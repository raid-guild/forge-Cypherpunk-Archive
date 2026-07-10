import assert from "node:assert/strict";
import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

test("keeps attempts isolated by versioned challenge ID", async () => {
  const directory = mkdtempSync(join(tmpdir(), "cypherpunk-db-"));
  process.env.SQLITE_PATH = join(directory, "test.sqlite");
  const {
    getDb,
    getLeaderboard,
    getOrCreateDailyAttempt,
    getStreak,
    recordDailySubmit,
    upsertUser,
  } = await import("../lib/db");

  upsertUser({
    authenticated: true,
    handle: "cipher-tester",
    portalUserID: "test-user",
    roles: [],
  });

  recordDailySubmit("test-user", "2026-07-10", "2026-07-10:medium:v1", true);
  const nextVersion = getOrCreateDailyAttempt("test-user", "2026-07-10", "2026-07-10:medium:v2");

  assert.equal(nextVersion.solved_at, null);
  assert.equal(getLeaderboard("2026-07-10:medium:v1").length, 1);
  assert.equal(getLeaderboard("2026-07-10:medium:v2").length, 0);
  assert.equal(getStreak("test-user", "2026-07-10").total, 1);

  getDb().close();
  rmSync(directory, { recursive: true, force: true });
});
