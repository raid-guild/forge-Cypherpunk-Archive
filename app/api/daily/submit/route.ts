import { NextRequest, NextResponse } from "next/server";
import { compactAnswer, normalizeAnswer } from "@/lib/ciphers";
import { buildDailyRun, dailyDate } from "@/lib/daily";
import { getLeaderboard, getStreak, recordDailySubmit, upsertUser } from "@/lib/db";
import { getCurrentSession } from "@/lib/portal-session";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await getCurrentSession();
  const date = dailyDate();
  const body = (await request.json().catch(() => null)) as { answer?: string } | null;
  const answer = body?.answer ?? "";
  const run = buildDailyRun(date);
  const vault = run.stations.find((station) => station.id === "vault");

  if (!vault) return NextResponse.json({ error: "Daily vault missing." }, { status: 500 });

  const accepted = [vault.expectedAnswer, ...(vault.acceptedAnswers ?? [])];
  const correct = accepted.some(
    (acceptedAnswer) =>
      normalizeAnswer(answer) === normalizeAnswer(acceptedAnswer) ||
      compactAnswer(answer) === compactAnswer(acceptedAnswer)
  );

  if (!session.authenticated) {
    return NextResponse.json({ authenticated: false, correct, credited: false });
  }

  upsertUser(session);
  const attempt = recordDailySubmit(session.portalUserID, date, correct);
  return NextResponse.json({
    authenticated: true,
    correct,
    attempt,
    credited: Boolean(attempt.solved_at && !attempt.viewed_reveal_at),
    streak: getStreak(session.portalUserID, date),
    leaderboard: getLeaderboard(date),
  });
}
