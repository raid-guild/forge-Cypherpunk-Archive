import { NextResponse } from "next/server";
import {
  getLeaderboard,
  getOrCreateDailyAttempt,
  getStationCompletions,
  getStreak,
  upsertUser,
} from "@/lib/db";
import { buildDailyChallenge, dailyDate } from "@/lib/daily";
import { getCurrentSession } from "@/lib/portal-session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const session = await getCurrentSession();
  const date = dailyDate();
  const challenge = buildDailyChallenge(date);
  const leaderboard = getLeaderboard(challenge.id);
  const challengeMeta = {
    challengeId: challenge.id,
    difficulty: challenge.difficulty,
    generatorVersion: challenge.generatorVersion,
  };

  if (!session.authenticated) {
    return NextResponse.json({
      authenticated: false,
      dailyDate: date,
      ...challengeMeta,
      stationCompletions: [],
      attempt: null,
      streak: null,
      leaderboard,
    });
  }

  upsertUser(session);
  const attempt = getOrCreateDailyAttempt(session.portalUserID, date, challenge.id);
  return NextResponse.json({
    authenticated: true,
    dailyDate: date,
    ...challengeMeta,
    stationCompletions: getStationCompletions(session.portalUserID),
    attempt,
    streak: getStreak(session.portalUserID, date),
    leaderboard,
  });
}
