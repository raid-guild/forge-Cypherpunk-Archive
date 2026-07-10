# Cypherpunk Archive Checklist

## Phase 0 - Planning

- [x] Define initial learning format.
- [x] Choose one-room layered archive over multiple levels for MVP.
- [x] Choose click/tap hotspots over required character movement for MVP.
- [x] Split guided archive demo from future daily puzzle mode.
- [x] Choose Next.js single-service app pattern.
- [x] Choose SQLite on Railway persistent volume if storage is needed.
- [x] Add Portal-compatible launch callback/session surface.
- [x] Allow anonymous local play.
- [x] Decide exact Next.js directory structure.
- [x] Define shared Daily Vault direction.
- [x] Define direct reveal as the scoring disqualifier.
- [ ] Confirm final Portal module integration requirements.
- [ ] Audit reusable assets from `arcade-roundtable-melee`.
- [ ] Identify missing generated assets and draft prompts using `docs/imagegen-assets.md`.

## Phase 1 - Content Design

- [ ] Draft 8-12 Caesar / ROT13 phrases.
- [ ] Draft 8-12 Rail Fence phrases.
- [ ] Draft 8-12 Vigenere phrases.
- [ ] Replace bare phrase strings with tier, theme, figure, and source metadata.
- [ ] Draft at least 12 medium phrases in the 35-65 letter range.
- [ ] Draft at least 8 hard phrases in the 55-90 letter range.
- [ ] Draft a separate short phrase bank for symbol-expanding tools such as Morse and Pigpen.
- [ ] Draft 5-8 Diffie-Hellman puzzle setups.
- [ ] Draft 3-5 final vault combinations.
- [ ] Draft short lore artifacts for Diffie, Hellman, Merkle, Finney, Cohen, Gilmore, and Chaum.
- [ ] Add artifacts and clue hooks for Hughes, May, Milhon, Zimmermann, Back, Dwork, Naor, Dai, Szabo, and Sassaman.
- [ ] Collect approved external resource links for each figure/concept.
- [ ] Write hint tiers for each MVP station.

## Phase 2 - Puzzle Engines

- [x] Implement Caesar encode/decode helpers.
- [ ] Implement ROT13 helper as Caesar shift 13.
- [x] Implement Rail Fence encode/decode helpers.
- [x] Implement Vigenere encode/decode helpers.
- [x] Add first simplified Diffie-Hellman puzzle/validator.
- [x] Add seedable random selection utilities.
- [x] Add phrase banks for first randomized archive runs.
- [x] Add focused tests for each cipher helper.

## Phase 3 - UI Shell

- [x] Build first room view.
- [x] Build first hotspot component.
- [x] Build shared puzzle station panel.
- [x] Build hint reveal component.
- [x] Build lore artifact unlock component.
- [x] Build first progress/vault state model.
- [x] Persist anonymous run progress in localStorage.
- [x] Add first run summary/completion screen.
- [ ] Add responsive behavior for desktop and mobile.

## Phase 4 - MVP Puzzle Widgets

- [x] Build Caesar slider widget.
- [x] Build Rail Fence visual widget.
- [x] Build Vigenere keyword widget.
- [x] Build Diffie-Hellman altar widget.
- [x] Build first final vault widget.
- [x] Convert final vault into the first Daily Vault-style layered puzzle shell.
- [x] Add generated acrostic-style hints for early vault layers.
- [x] Add research-file keyword hints for the vault keyword layer.
- [x] Add undo for applied vault decode steps.
- [x] Connect each widget to shared station shell.
- [x] Connect solve events to room visual progress.

## Phase 5 - Authenticated Progress and Persistence

- [ ] Add SQLite dependency and database helper.
- [ ] Configure `SQLITE_PATH` for Railway persistent volume.
- [ ] Add `users` table and upsert authenticated Portal users from session.
- [ ] Add `station_completions` table.
- [ ] Persist authenticated station completions server-side.
- [ ] Load authenticated station completions into archive state.
- [ ] Treat solved stations as permanent tool unlocks for authenticated users.
- [ ] Preserve anonymous localStorage behavior for unauthenticated users.
- [ ] Add migration/bootstrap path for SQLite schema.

## Phase 6 - Polish and Validation

- [ ] Generate or finalize missing puzzle prop assets.
- [ ] Generate or finalize missing lore/item assets.
- [ ] Log generated asset prompts, paths, and post-processing notes.
- [ ] Add room state visuals for solved stations.
- [ ] Add basic sound cues if appropriate.
- [ ] Verify text fits on mobile and desktop.
- [ ] Verify all puzzles are solvable by hand.
- [ ] Verify hint flow does not reveal too much too early.
- [ ] Verify direct reveal is clearly distinct from normal hints.
- [ ] Run accessibility pass for keyboard and screen-reader basics.
- [ ] Run browser QA on desktop and mobile viewport sizes.

## Phase 7 - Daily Vault, Leaderboard, and Streaks

- [x] Define daily seed format direction: shared `daily-YYYY-MM-DD`.
- [x] Create daily challenge generator using existing cipher engines.
- [x] Add daily challenge route/view.
- [x] Gate daily tools by authenticated station completions.
- [x] Allow anonymous Daily Vault play without leaderboard/streak credit.
- [x] Add `daily_attempts` table.
- [x] Add server-side daily answer validation.
- [x] Track daily `started_at`, `solved_at`, `viewed_reveal_at`, hint count, and wrong attempts.
- [x] Mark full/direct reveal hints with a scoring-disqualifying flag.
- [x] Ensure normal hints do not disqualify daily credit.
- [x] Add daily credit rule: solved and no viewed reveal.
- [x] Add leaderboard API and UI for credited authenticated solves.
- [x] Add streak calculation for credited daily solves.
- [x] Add shareable result format.

## Phase 8 - Daily Difficulty and Extensible Tools

- [x] Specify easy, medium, and hard daily challenge tiers.
- [x] Specify a predictable weekly difficulty cadence.
- [x] Rank candidate advanced stations and tools.
- [x] Add a versioned `DailyChallenge` and ordered `VaultLayer` model.
- [ ] Separate the public daily challenge payload from hidden solution data.
- [x] Add generator validation that decodes every generated pipeline back to its answer.
- [ ] Refactor vault tools into a registry with unlock and alphabet compatibility metadata.
- [x] Generate medium challenges with seeded permutations of Caesar, Rail Fence, and Vigenere.
- [x] Replace fixed-order vault hints with per-layer hint ladders.
- [ ] Persist generated definitions in a `daily_challenges` table.
- [x] Associate attempts and leaderboard entries with a challenge ID and difficulty.
- [x] Add seeded generator tests for order, reproducibility, and solvability.
- [ ] Add generator tests for tier length bounds and tool output limits.
- [x] Chunk long Vigenere and Rail Fence visualizations into readable fixed windows.
- [ ] Playtest medium challenges before adding repeated tools or a fourth layer.
- [ ] Build the Atbash training station and tool.
- [ ] Build the Morse signal training station with visual and non-audio fallback.
- [ ] Enable hard weekend challenges only after their required training tool is available.
