import { NextResponse } from "next/server";
import { getCurrentSession, portalModulesUrl } from "@/lib/portal-session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const session = await getCurrentSession();
  return NextResponse.json({
    authenticated: session.authenticated,
    playerId: session.authenticated ? session.portalUserID : null,
    handle: session.authenticated ? session.handle : null,
    picture: session.picture ?? null,
    roles: session.roles ?? [],
    portalUrl: portalModulesUrl(),
    anonymousPlay: true,
  });
}
