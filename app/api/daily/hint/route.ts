import { NextResponse } from "next/server";
import { buildDailyChallenge, dailyDate } from "@/lib/daily";
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
  const challenge = buildDailyChallenge(date);
  recordDailyHint(session.portalUserID, date, challenge.id);
  return NextResponse.json({
    authenticated: true,
    attempt: getOrCreateDailyAttempt(session.portalUserID, date, challenge.id),
    streak: getStreak(session.portalUserID, date),
    leaderboard: getLeaderboard(challenge.id),
  });
}
