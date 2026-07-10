import { NextRequest, NextResponse } from "next/server";
import { compactAnswer, normalizeAnswer } from "@/lib/ciphers";
import { buildDailyChallenge, dailyDate } from "@/lib/daily";
import { getLeaderboard, getStreak, recordDailySubmit, upsertUser } from "@/lib/db";
import { getCurrentSession } from "@/lib/portal-session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await getCurrentSession();
  const date = dailyDate();
  const body = (await request.json().catch(() => null)) as { answer?: string } | null;
  const answer = body?.answer ?? "";
  const challenge = buildDailyChallenge(date);
  const accepted = [challenge.expectedAnswer, ...challenge.acceptedAnswers];
  const correct = accepted.some(
    (acceptedAnswer) =>
      normalizeAnswer(answer) === normalizeAnswer(acceptedAnswer) ||
      compactAnswer(answer) === compactAnswer(acceptedAnswer)
  );

  if (!session.authenticated) {
    return NextResponse.json({ authenticated: false, correct, credited: false });
  }

  upsertUser(session);
  const attempt = recordDailySubmit(session.portalUserID, date, challenge.id, correct);
  return NextResponse.json({
    authenticated: true,
    correct,
    attempt,
    credited: Boolean(attempt.solved_at && !attempt.viewed_reveal_at),
    streak: getStreak(session.portalUserID, date),
    leaderboard: getLeaderboard(challenge.id),
  });
}
