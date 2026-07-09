import { NextRequest, NextResponse } from "next/server";
import { LaunchTokenError, verifyLaunchToken } from "@/lib/launch-token";
import { getSession } from "@/lib/session";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return redirectToLaunchError("missing_token");

  try {
    const claims = await verifyLaunchToken(token);
    const session = await getSession();
    session.playerId = claims.portalUserId;
    session.portalUserId = claims.portalUserId;
    session.portalProfileId = claims.portalProfileId;
    session.handle = claims.handle;
    session.picture = claims.picture;
    session.roles = claims.roles;
    await session.save();

    return redirectTo("/archive");
  } catch (err) {
    console.error("Portal launch rejected", launchErrorLog(err));
    return redirectToLaunchError(launchErrorCode(err));
  }
}

function redirectToLaunchError(reason: string) {
  return redirectTo(`/launch-error?reason=${encodeURIComponent(reason)}`);
}

function redirectTo(location: string) {
  return new NextResponse(null, {
    status: 303,
    headers: { Location: location },
  });
}

function launchErrorCode(err: unknown) {
  if (err instanceof LaunchTokenError) return err.code;
  if (err instanceof Error && err.message === "SESSION_SECRET is not set") return "missing_session_secret";
  return "callback_failed";
}

function launchErrorLog(err: unknown) {
  if (err instanceof LaunchTokenError) {
    return { code: err.code, message: err.message, details: err.details };
  }
  if (err instanceof Error) return { code: launchErrorCode(err), message: err.message };
  return { code: "callback_failed" };
}
