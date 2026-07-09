import Link from "next/link";
import { getOptionalSession, portalModulesUrl } from "@/lib/session";

export const dynamic = "force-dynamic";

export default async function StartPage() {
  const session = await getOptionalSession();

  return (
    <main className="screen start-screen">
      <section className="start-copy">
        <p className="eyebrow">Portal learning module</p>
        <h1>Cypherpunk Archive</h1>
        <p>
          Explore a sealed archive, solve hand-friendly cipher puzzles, and uncover the people
          behind practical privacy tools.
        </p>
      </section>

      <section className="start-actions" aria-label="Launch options">
        <Link className="button button--primary" href="/archive">
          Enter anonymously
        </Link>
        <a className="button" href={portalModulesUrl()}>
          Launch from Portal
        </a>
      </section>

      <p className="muted">
        {session.handle ? `Portal session: ${session.handle}` : "Anonymous local play is enabled."}
      </p>
    </main>
  );
}
