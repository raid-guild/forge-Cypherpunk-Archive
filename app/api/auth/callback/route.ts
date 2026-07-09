import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import {
  SESSION_COOKIE,
  sessionFromClaims,
  signLocalSession,
  verifyPortalLaunchToken,
} from "@/lib/portal-session";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) return redirectToLaunchError("missing_token", req.nextUrl);

  try {
    const claims = verifyPortalLaunchToken(token);
    const session = sessionFromClaims(claims);
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, signLocalSession(session), {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 8,
      path: "/",
    });

    return redirectTo("/archive", req.nextUrl);
  } catch (err) {
    console.error("Portal launch rejected", launchErrorLog(err));
    return redirectToLaunchError(launchErrorCode(err), req.nextUrl);
  }
}

function redirectToLaunchError(reason: string, requestUrl?: URL) {
  return redirectTo(`/launch-error?reason=${encodeURIComponent(reason)}`, requestUrl);
}

function redirectTo(location: string, requestUrl?: URL) {
  const target = requestUrl ? appRedirectURL(location, requestUrl) : location;
  return NextResponse.redirect(target, 303);
}

function launchErrorCode(err: unknown) {
  if (err instanceof Error) return err.message.toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
  return "callback_failed";
}

function launchErrorLog(err: unknown) {
  if (err instanceof Error) return { code: launchErrorCode(err), message: err.message };
  return { code: "callback_failed" };
}

function appRedirectURL(path: string, requestURL: URL) {
  const publicURL = process.env.APP_PUBLIC_URL ?? railwayPublicURL() ?? requestURL.origin;
  return new URL(path, publicURL);
}

function railwayPublicURL() {
  const domain = process.env.RAILWAY_PUBLIC_DOMAIN || process.env.RAILWAY_STATIC_URL;
  return domain ? `https://${domain}` : undefined;
}
