import assert from "node:assert/strict";
import test from "node:test";
import {
  buildDailyChallenge,
  dailyDifficulty,
  dailySeed,
  decodeDailyChallenge,
} from "../lib/daily";
import { compactAnswer } from "../lib/ciphers";

test("uses a visible weekly difficulty cadence", () => {
  assert.equal(dailyDifficulty("2026-07-06"), "easy");
  assert.equal(dailyDifficulty("2026-07-07"), "easy");
  assert.equal(dailyDifficulty("2026-07-08"), "medium");
  assert.equal(dailyDifficulty("2026-07-12"), "medium");
});

test("includes generator version and difficulty in the seed", () => {
  assert.equal(dailySeed("2026-07-10", "medium"), "daily:v2:2026-07-10:medium");
});

test("generates deterministic challenges", () => {
  assert.deepEqual(buildDailyChallenge("2026-07-10"), buildDailyChallenge("2026-07-10"));
});

test("easy challenges retain the guided tool order", () => {
  const challenge = buildDailyChallenge("2026-07-06", "easy");
  assert.deepEqual(challenge.layers.map((layer) => layer.tool), ["caesar", "rail-fence", "vigenere"]);
  assert.ok(compactAnswer(challenge.expectedAnswer).length >= 18);
  assert.ok(compactAnswer(challenge.expectedAnswer).length <= 32);
  assert.equal(compactAnswer(decodeDailyChallenge(challenge)), compactAnswer(challenge.expectedAnswer));
});

test("medium challenges vary tool order and always decode to the answer", () => {
  const orders = new Set<string>();

  for (let day = 8; day <= 24; day += 1) {
    const date = `2026-07-${String(day).padStart(2, "0")}`;
    const challenge = buildDailyChallenge(date, "medium");
    orders.add(challenge.layers.map((layer) => layer.tool).join(","));
    assert.equal(compactAnswer(decodeDailyChallenge(challenge)), compactAnswer(challenge.expectedAnswer));
    assert.ok(compactAnswer(challenge.expectedAnswer).length >= 35);
    assert.ok(compactAnswer(challenge.expectedAnswer).length <= 65);
  }

  assert.ok(orders.size > 1);
});

test("does not enable hard challenges before an advanced tool exists", () => {
  assert.throws(() => buildDailyChallenge("2026-07-11", "hard"), /advanced archive tool/);
});
