import { NextResponse } from "next/server";
import { getStationCompletions, upsertUser } from "@/lib/db";
import { getCurrentSession } from "@/lib/portal-session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const session = await getCurrentSession();
  if (!session.authenticated) {
    return NextResponse.json({
      authenticated: false,
      stationCompletions: [],
    });
  }

  upsertUser(session);
  return NextResponse.json({
    authenticated: true,
    stationCompletions: getStationCompletions(session.portalUserID),
  });
}
