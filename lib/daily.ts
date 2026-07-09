import { buildArchiveRun } from "@/lib/archive-data";

export function dailyDate(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

export function dailySeed(date = dailyDate()) {
  return `daily-${date}`;
}

export function buildDailyRun(date = dailyDate()) {
  return buildArchiveRun(dailySeed(date));
}
