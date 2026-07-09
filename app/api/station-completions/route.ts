import { NextRequest, NextResponse } from "next/server";
import { recordStationCompletion, getStationCompletions, upsertUser } from "@/lib/db";
import { getCurrentSession } from "@/lib/portal-session";
import type { StationId } from "@/lib/archive-data";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const validStationIds = new Set<StationId>(["caesar", "rail-fence", "vigenere", "diffie-hellman"]);

export async function POST(request: NextRequest) {
  const session = await getCurrentSession();
  if (!session.authenticated) {
    return NextResponse.json({ error: "Authentication required." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as { stationId?: StationId } | null;
  if (!body?.stationId || !validStationIds.has(body.stationId)) {
    return NextResponse.json({ error: "Invalid stationId." }, { status: 400 });
  }

  upsertUser(session);
  recordStationCompletion(session.portalUserID, body.stationId);
  return NextResponse.json({
    stationCompletions: getStationCompletions(session.portalUserID),
  });
}
