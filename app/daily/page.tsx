import { buildDailyChallenge, dailyDate } from "@/lib/daily";
import {
  getLeaderboard,
  getOrCreateDailyAttempt,
  getStationCompletions,
  getStreak,
  upsertUser,
} from "@/lib/db";
import { getCurrentSession } from "@/lib/portal-session";
import ArchiveRoom from "@/app/archive/ArchiveRoom";
import type { StationId } from "@/lib/archive-data";

export const dynamic = "force-dynamic";

export default async function DailyPage() {
  const session = await getCurrentSession();
  const date = dailyDate();
  const challenge = buildDailyChallenge(date);
  const leaderboard = getLeaderboard(challenge.id);
  let toolUnlocks: Partial<Record<StationId, boolean>> = {};
  let dailyAttempt = null;
  let streak = null;

  if (session.authenticated) {
    upsertUser(session);
    toolUnlocks = Object.fromEntries(getStationCompletions(session.portalUserID).map((stationId) => [stationId, true]));
    dailyAttempt = getOrCreateDailyAttempt(session.portalUserID, date, challenge.id);
    streak = getStreak(session.portalUserID, date);
  }

  return (
    <ArchiveRoom
      mode="daily"
      handle={session.authenticated ? session.handle : null}
      authenticated={session.authenticated}
      initialSeed={challenge.seed}
      dailyDate={date}
      toolUnlocks={toolUnlocks}
      initialSolved={dailyAttempt?.solved_at ? { vault: true } : {}}
      dailyAttempt={
        dailyAttempt
          ? {
              solved: Boolean(dailyAttempt.solved_at),
              viewedReveal: Boolean(dailyAttempt.viewed_reveal_at),
              credited: Boolean(dailyAttempt.solved_at && !dailyAttempt.viewed_reveal_at),
              hintCount: dailyAttempt.hint_count,
              wrongAttempts: dailyAttempt.wrong_attempts,
            }
          : null
      }
      leaderboard={leaderboard}
      streak={streak}
    />
  );
}
