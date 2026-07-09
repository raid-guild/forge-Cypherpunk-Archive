import { NextResponse } from "next/server";
import {
  getLeaderboard,
  getOrCreateDailyAttempt,
  getStationCompletions,
  getStreak,
  upsertUser,
} from "@/lib/db";
import { dailyDate } from "@/lib/daily";
import { getCurrentSession } from "@/lib/portal-session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const session = await getCurrentSession();
  const date = dailyDate();
  const leaderboard = getLeaderboard(date);

  if (!session.authenticated) {
    return NextResponse.json({
      authenticated: false,
      dailyDate: date,
      stationCompletions: [],
      attempt: null,
      streak: null,
      leaderboard,
    });
  }

  upsertUser(session);
  const attempt = getOrCreateDailyAttempt(session.portalUserID, date);
  return NextResponse.json({
    authenticated: true,
    dailyDate: date,
    stationCompletions: getStationCompletions(session.portalUserID),
    attempt,
    streak: getStreak(session.portalUserID, date),
    leaderboard,
  });
}
