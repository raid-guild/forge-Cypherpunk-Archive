import { getCurrentSession } from "@/lib/portal-session";
import ArchiveRoom from "./ArchiveRoom";

export const dynamic = "force-dynamic";

export default async function ArchivePage() {
  const session = await getCurrentSession();
  return <ArchiveRoom handle={session.authenticated ? session.handle : null} />;
}
