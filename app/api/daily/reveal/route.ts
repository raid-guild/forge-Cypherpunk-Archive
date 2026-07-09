import { NextResponse } from "next/server";
import { dailyDate } from "@/lib/daily";
import { getLeaderboard, getOrCreateDailyAttempt, getStreak, recordDailyReveal, upsertUser } from "@/lib/db";
import { getCurrentSession } from "@/lib/portal-session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
  const session = await getCurrentSession();
  if (!session.authenticated) {
    return NextResponse.json({ authenticated: false, viewedReveal: true });
  }

  upsertUser(session);
  const date = dailyDate();
  recordDailyReveal(session.portalUserID, date);
  return NextResponse.json({
    authenticated: true,
    viewedReveal: true,
    attempt: getOrCreateDailyAttempt(session.portalUserID, date),
    streak: getStreak(session.portalUserID, date),
    leaderboard: getLeaderboard(date),
  });
}
