import Link from "next/link";
import { getCurrentSession, portalModulesUrl } from "@/lib/portal-session";

export const dynamic = "force-dynamic";

export default async function StartPage() {
  const session = await getCurrentSession();

  return (
    <main className="screen start-screen">
      <section className="start-copy">
        <p className="eyebrow">Portal learning module</p>
        <h1>Cypherpunk Archive</h1>
        <p>
          Explore a sealed archive, solve hand-friendly cipher puzzles, and uncover the people behind practical privacy
          tools.
        </p>
      </section>

      <section className="mode-grid" aria-label="Play options">
        <Link className="mode-card" href="/archive">
          <span className="eyebrow">Training</span>
          <strong>Play Demo</strong>
          <small>Learn the stations, unlock tools, and collect cipher history.</small>
        </Link>
        <Link className="mode-card mode-card--daily" href="/daily">
          <span className="eyebrow">Shared challenge</span>
          <strong>Play Daily</strong>
          <small>Solve today's vault puzzle. Portal sessions count for streaks and leaderboard credit.</small>
        </Link>
      </section>

      <section className="start-actions" aria-label="Portal options">
        <a className="button" href={portalModulesUrl()}>
          Launch from Portal
        </a>
      </section>

      <p className="muted">{session.authenticated ? `Signed in: ${session.handle}` : "Anonymous play is enabled."}</p>
    </main>
  );
}
