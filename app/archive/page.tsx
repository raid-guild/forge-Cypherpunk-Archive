import { getCurrentSession } from "@/lib/portal-session";
import { getStationCompletions, upsertUser } from "@/lib/db";
import ArchiveRoom from "./ArchiveRoom";
import type { StationId } from "@/lib/archive-data";

export const dynamic = "force-dynamic";

export default async function ArchivePage() {
  const session = await getCurrentSession();
  let initialSolved: Partial<Record<StationId, boolean>> = {};
  if (session.authenticated) {
    upsertUser(session);
    initialSolved = Object.fromEntries(getStationCompletions(session.portalUserID).map((stationId) => [stationId, true]));
  }

  return (
    <ArchiveRoom
      handle={session.authenticated ? session.handle : null}
      authenticated={session.authenticated}
      initialSolved={initialSolved}
    />
  );
}
