import { NextResponse } from "next/server";
import { dailyDate } from "@/lib/daily";
import { getLeaderboard, getOrCreateDailyAttempt, getStreak, recordDailyHint, upsertUser } from "@/lib/db";
import { getCurrentSession } from "@/lib/portal-session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  const session = await getCurrentSession();
  if (!session.authenticated) {
    return NextResponse.json({ authenticated: false });
  }

  upsertUser(session);
  const date = dailyDate();
  recordDailyHint(session.portalUserID, date);
  return NextResponse.json({
    authenticated: true,
    attempt: getOrCreateDailyAttempt(session.portalUserID, date),
    streak: getStreak(session.portalUserID, date),
    leaderboard: getLeaderboard(date),
  });
}
