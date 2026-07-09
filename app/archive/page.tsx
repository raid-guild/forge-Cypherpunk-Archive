import { getOptionalSession } from "@/lib/session";
import ArchiveRoom from "./ArchiveRoom";

export const dynamic = "force-dynamic";

export default async function ArchivePage() {
  const session = await getOptionalSession();
  return <ArchiveRoom handle={session.handle ?? null} />;
}
