import Link from "next/link";

export default async function LaunchErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string }>;
}) {
  const { reason } = await searchParams;

  return (
    <main className="screen screen--center">
      <p className="eyebrow">Portal launch failed</p>
      <h1>Could not enter the archive</h1>
      <p className="muted">
        Reason: <code>{reason ?? "unknown"}</code>
      </p>
      <Link className="button button--primary" href="/">
        Back to start
      </Link>
    </main>
  );
}
