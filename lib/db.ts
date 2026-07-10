import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import type { LocalSession } from "@/lib/portal-session";
import type { StationId } from "@/lib/archive-data";

export interface DailyAttempt {
  challenge_id: string;
  daily_date: string;
  started_at: string;
  solved_at: string | null;
  viewed_reveal_at: string | null;
  hint_count: number;
  wrong_attempts: number;
}

export interface LeaderboardEntry {
  handle: string;
  picture: string | null;
  solved_at: string;
  hint_count: number;
  wrong_attempts: number;
  seconds_to_solve: number | null;
}

let db: Database.Database | null = null;

export function getDb() {
  if (!db) {
    const dbPath = process.env.SQLITE_PATH ?? path.join(process.cwd(), ".data", "cypherpunk-archive.sqlite");
    fs.mkdirSync(path.dirname(dbPath), { recursive: true });
    db = new Database(dbPath);
    db.pragma("journal_mode = WAL");
    migrate(db);
  }
  return db;
}

export function upsertUser(session: LocalSession) {
  if (!session.authenticated) return;
  const now = nowIso();
  getDb()
    .prepare(
      `
      insert into users (portal_user_id, handle, picture, created_at, last_seen_at)
      values (@portalUserID, @handle, @picture, @now, @now)
      on conflict(portal_user_id) do update set
        handle = excluded.handle,
        picture = excluded.picture,
        last_seen_at = excluded.last_seen_at
    `
    )
    .run({
      portalUserID: session.portalUserID,
      handle: session.handle,
      picture: session.picture ?? null,
      now,
    });
}

export function getStationCompletions(portalUserID: string) {
  return getDb()
    .prepare("select station_id from station_completions where portal_user_id = ? order by completed_at")
    .all(portalUserID)
    .map((row) => (row as { station_id: StationId }).station_id);
}

export function recordStationCompletion(portalUserID: string, stationId: StationId) {
  getDb()
    .prepare(
      `
      insert into station_completions (portal_user_id, station_id, completed_at)
      values (?, ?, ?)
      on conflict(portal_user_id, station_id) do nothing
    `
    )
    .run(portalUserID, stationId, nowIso());
}

export function getOrCreateDailyAttempt(portalUserID: string, dailyDate: string, challengeId: string): DailyAttempt {
  const database = getDb();
  database
    .prepare(
      `
      insert into daily_challenge_attempts (portal_user_id, challenge_id, daily_date, started_at)
      values (?, ?, ?, ?)
      on conflict(portal_user_id, challenge_id) do nothing
    `
    )
    .run(portalUserID, challengeId, dailyDate, nowIso());

  return database
    .prepare(
      `
      select challenge_id, daily_date, started_at, solved_at, viewed_reveal_at, hint_count, wrong_attempts
      from daily_challenge_attempts
      where portal_user_id = ? and challenge_id = ?
    `
    )
    .get(portalUserID, challengeId) as DailyAttempt;
}

export function recordDailyHint(portalUserID: string, dailyDate: string, challengeId: string) {
  getOrCreateDailyAttempt(portalUserID, dailyDate, challengeId);
  getDb()
    .prepare(
      `
      update daily_challenge_attempts
      set hint_count = hint_count + 1
      where portal_user_id = ? and challenge_id = ? and solved_at is null
    `
    )
    .run(portalUserID, challengeId);
}

export function recordDailyReveal(portalUserID: string, dailyDate: string, challengeId: string) {
  getOrCreateDailyAttempt(portalUserID, dailyDate, challengeId);
  getDb()
    .prepare(
      `
      update daily_challenge_attempts
      set viewed_reveal_at = coalesce(viewed_reveal_at, ?)
      where portal_user_id = ? and challenge_id = ?
    `
    )
    .run(nowIso(), portalUserID, challengeId);
}

export function recordDailySubmit(portalUserID: string, dailyDate: string, challengeId: string, correct: boolean) {
  const attempt = getOrCreateDailyAttempt(portalUserID, dailyDate, challengeId);
  if (attempt.solved_at) return getOrCreateDailyAttempt(portalUserID, dailyDate, challengeId);

  if (correct) {
    getDb()
      .prepare(
        `
        update daily_challenge_attempts
        set solved_at = ?
        where portal_user_id = ? and challenge_id = ?
      `
      )
      .run(nowIso(), portalUserID, challengeId);
  } else {
    getDb()
      .prepare(
        `
        update daily_challenge_attempts
        set wrong_attempts = wrong_attempts + 1
        where portal_user_id = ? and challenge_id = ?
      `
      )
      .run(portalUserID, challengeId);
  }

  return getOrCreateDailyAttempt(portalUserID, dailyDate, challengeId);
}

export function getLeaderboard(challengeId: string, limit = 20): LeaderboardEntry[] {
  return getDb()
    .prepare(
      `
      select
        u.handle,
        u.picture,
        a.solved_at,
        a.hint_count,
        a.wrong_attempts,
        cast((julianday(a.solved_at) - julianday(a.started_at)) * 86400 as integer) as seconds_to_solve
      from daily_challenge_attempts a
      join users u on u.portal_user_id = a.portal_user_id
      where a.challenge_id = ?
        and a.solved_at is not null
        and a.viewed_reveal_at is null
      order by a.hint_count asc, a.wrong_attempts asc, seconds_to_solve asc, a.solved_at asc
      limit ?
    `
    )
    .all(challengeId, limit) as LeaderboardEntry[];
}

export function getStreak(portalUserID: string, today: string) {
  const creditedDates = new Set(
    getDb()
      .prepare(
        `
        select daily_date from daily_attempts
        where portal_user_id = ? and solved_at is not null and viewed_reveal_at is null
        union
        select daily_date from daily_challenge_attempts
        where portal_user_id = ? and solved_at is not null and viewed_reveal_at is null
      `
      )
      .all(portalUserID, portalUserID)
      .map((row) => (row as { daily_date: string }).daily_date)
  );

  let current = 0;
  let cursor = new Date(`${today}T00:00:00.000Z`);
  while (creditedDates.has(cursor.toISOString().slice(0, 10))) {
    current += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  let longest = 0;
  let run = 0;
  const sortedDates = [...creditedDates].sort();
  let previous: string | null = null;
  for (const date of sortedDates) {
    if (previous && daysBetween(previous, date) === 1) {
      run += 1;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
    previous = date;
  }

  return {
    current,
    longest,
    total: creditedDates.size,
  };
}

function migrate(database: Database.Database) {
  database.exec(`
    create table if not exists users (
      portal_user_id text primary key,
      handle text not null,
      picture text,
      created_at text not null,
      last_seen_at text not null
    );

    create table if not exists station_completions (
      portal_user_id text not null,
      station_id text not null,
      completed_at text not null,
      primary key (portal_user_id, station_id),
      foreign key (portal_user_id) references users(portal_user_id)
    );

    create table if not exists daily_attempts (
      portal_user_id text not null,
      daily_date text not null,
      started_at text not null,
      solved_at text,
      viewed_reveal_at text,
      hint_count integer not null default 0,
      wrong_attempts integer not null default 0,
      primary key (portal_user_id, daily_date),
      foreign key (portal_user_id) references users(portal_user_id)
    );

    create table if not exists daily_challenge_attempts (
      portal_user_id text not null,
      challenge_id text not null,
      daily_date text not null,
      started_at text not null,
      solved_at text,
      viewed_reveal_at text,
      hint_count integer not null default 0,
      wrong_attempts integer not null default 0,
      primary key (portal_user_id, challenge_id),
      foreign key (portal_user_id) references users(portal_user_id)
    );

    create index if not exists daily_challenge_attempts_date
      on daily_challenge_attempts(daily_date);
  `);
}

function nowIso() {
  return new Date().toISOString();
}

function daysBetween(left: string, right: string) {
  const leftTime = Date.parse(`${left}T00:00:00.000Z`);
  const rightTime = Date.parse(`${right}T00:00:00.000Z`);
  return Math.round((rightTime - leftTime) / 86400000);
}
