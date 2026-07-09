# Cypherpunk Archive Learning Module - Initial Spec

## Summary

The Cypherpunk Archive is an interactive web learning module for Portal. The first version is a one-room escape-room experience that teaches approachable cipher concepts and introduces key cypherpunk figures through short, contextual artifacts.

The experience should feel like exploring a dungeon archive, but the interaction model should stay manageable: players click or tap hotspots in a single room, open puzzle stations, solve hand-solvable cipher challenges, collect lore artifacts, and unlock a final vault.

## Goals

- Teach beginner-friendly cipher concepts through direct interaction.
- Introduce cypherpunk history, values, and major contributors without turning the module into a lecture.
- Use a consistent puzzle shell so each station feels familiar while still supporting different cipher mechanics.
- Keep the MVP small enough to build, test, and expand.
- Preserve replayability through curated random phrase selection and a shared Daily Vault mode.
- Give Portal-authenticated users persistent tool unlocks, daily completion credit, streaks, and leaderboard placement.

## Non-Goals for MVP

- Full character movement, collision, or dungeon crawling.
- Procedural rooms or fully generated puzzles.
- AI-generated hinting.
- Complex cryptographic math.
- Multiplayer.
- Real-time collaboration.
- High-stakes anti-cheat. The daily score should prove meaningful engagement, not provide tournament-grade verification.

## Core Experience

The player enters a sealed archive room containing several interactive stations. Each station represents a cipher or cryptographic idea. Solving a station updates the room state and unlocks a short historical artifact.

The MVP should use a static top-down or illustrated room with clickable hotspots. A player avatar may be shown for atmosphere, but precise keyboard movement should not be required.

## Primary Loop

1. Explore the room.
2. Click or tap a hotspot.
3. Read a short puzzle prompt.
4. Manipulate a cipher tool or enter an answer.
5. Request hints if needed.
6. Solve the puzzle.
7. Unlock a lore artifact and update room progress.
8. Use solved stations to unlock tools for the Final/Daily Vault.

## MVP Puzzle Stations

### 1. Caesar / ROT13 Door

- Concept: fixed alphabet shift.
- Interaction: shift slider or cipher wheel.
- Difficulty: easy.
- Teaching point: simple substitution can be brute-forced.
- Possible guide voice: general intro or John Gilmore.

### 2. Rail Fence Table

- Concept: transposition.
- Interaction: visual rails showing letters arranged in a zigzag or rows.
- Difficulty: easy-medium.
- Teaching point: encryption can reorder symbols instead of replacing them.
- Possible guide voice: archive scribe / neutral guide.

### 3. Vigenere Terminal

- Concept: keyed polyalphabetic substitution.
- Interaction: keyword input plus decoded preview or Vigenere helper table.
- Difficulty: medium.
- Teaching point: keys make simple shifts more flexible.
- Possible guide voice: Hal Finney or David Chaum.

### 4. Diffie-Hellman Altar

- Concept: agreeing on a shared secret over an insecure channel.
- Interaction: small-number or color-mixing analogy.
- Difficulty: medium.
- Teaching point: public exchange can still produce a private shared result.
- Possible guide voice: Martin Hellman, Whitfield Diffie, and Ralph Merkle.

### 5. Final Vault

- Concept: synthesis.
- Interaction: a layered vault puzzle using the cipher tools learned in the stations.
- Difficulty: medium.
- Teaching point: cryptographic systems often combine multiple primitives and protocols.
- Product direction: this format becomes the Daily Vault shell.

## Optional Later Stations

- Atbash mirror: simple alphabet reversal.
- Merkle tree archive: verify which document was tampered with.
- PGP desk: encrypt or verify a short message with a public key.
- Chaum blind signature desk: privacy-preserving authorization or digital cash analogy.
- Peer-to-peer node map: Bram Cohen and decentralized distribution.

## Historical Figures

The module should use historical figures as short contextual voices, notes, or artifacts rather than long NPC lectures.

- Martin Hellman and Whitfield Diffie: public-key exchange and shared secrets.
- Ralph Merkle: Merkle puzzles, public-key foundations, Merkle trees.
- Hal Finney: PGP 2.0, practical privacy tools, early Bitcoin history.
- Bram Cohen: BitTorrent and peer-to-peer distribution.
- John Gilmore: Cypherpunks mailing list, EFF, anti-backdoor advocacy.
- David Chaum: blind signatures, anonymous digital cash, DigiCash.

## Puzzle Component Model

Each station should share the same outer structure:

```ts
type PuzzleStation = {
  id: string;
  title: string;
  act: "intro" | "keys" | "vault";
  difficulty: "easy" | "medium" | "hard";
  guide: string;
  prompt: string;
  cipherType: string;
  encodedText: string;
  expectedAnswer: string;
  hints: Hint[];
  artifact: LoreArtifact;
};
```

Puzzle-specific widgets should live inside the shared station shell:

- Caesar widget: shift slider / wheel.
- Rail Fence widget: rail count and visual layout.
- Vigenere widget: keyword input and helper table.
- Diffie-Hellman widget: guided shared-secret exchange.

## Randomness and Replayability

The MVP should support bounded randomness through curated content lists.

Safe MVP randomness:

- Select one phrase from a curated list per puzzle.
- Select Caesar shift from a known range.
- Select Vigenere keyword from a curated list.
- Select optional lore artifact variant.

Avoid for MVP:

- Fully generated arbitrary plaintext.
- Procedural clue chains.
- Random station requirements that can block progression.

Random runs should be seedable so a puzzle can be reproduced during testing.

## Daily Puzzle Mode

Daily Puzzle is now a target mode after the archive training loop.

Archive Demo:

- Guided.
- Educational.
- Generous hints.
- No scoring pressure.
- Teaches one idea at a time.
- Solving stations unlocks tools.

Daily Vault:

- One shared seeded challenge per calendar day.
- Reuses cipher engines from the archive.
- Combines multiple learned mechanics.
- Uses the Final Vault tool-tray format.
- Can be opened by anonymous or authenticated players.
- Authenticated players get persistent progress, streaks, and leaderboard eligibility.
- Tools are only usable when the corresponding training station has been solved.
- Normal hints are allowed without disqualifying credit.
- The full/direct reveal hint can still help a player complete the daily, but it removes scoring credit for that day.

The daily seed should be shared for all users, e.g. `daily-YYYY-MM-DD`. Use UTC unless Portal later defines a preferred timezone.

The first implementation can generate the daily from the seed. Longer term, daily challenge definitions can be persisted so specific days can be curated, replayed, audited, or discussed.

## Authentication and Progress

Anonymous users:

- Can play the archive training loop.
- Can attempt the Daily Vault.
- Store progress locally only.
- Do not appear on leaderboards or receive streak credit.

Authenticated Portal users:

- Have a local module session created through the Portal handoff.
- Persist station completions server-side.
- Do not need to repeat solved training stations across runs/devices.
- Unlock tools permanently by solving the corresponding station.
- Can receive Daily Vault credit and streak progress.

Training station completion should be idempotent. If an authenticated user has already solved `caesar`, `rail-fence`, or `vigenere`, the station can still be replayed, but the related daily tool should already be unlocked.

## Daily Scoring

Keep the first scoring model deliberately simple:

- `solved`: the authenticated user submitted the correct Daily Vault answer.
- `viewed_reveal`: the authenticated user opened the full/direct reveal hint for that day.

Daily credit condition:

```sql
solved_at IS NOT NULL
AND viewed_reveal_at IS NULL
```

Normal hints do not disqualify credit. The direct reveal is the boundary because it gives away enough information that completion no longer proves puzzle-solving.

Leaderboard eligibility:

- Authenticated only.
- Daily credit condition must be true.
- Sort by fewest normal hints, then fewer wrong attempts, then fastest completion time or earliest solve time.

Streak eligibility:

- Authenticated only.
- Count consecutive daily dates where the daily credit condition is true.
- Solving after viewing the direct reveal can be shown as completed/assisted, but does not extend the streak.

## Persistence Model

Use SQLite when implementing authenticated progress, Daily Vault state, leaderboard, and streaks. Keep it in the same Railway service on a persistent volume.

Initial tables:

```sql
users
  portal_user_id text primary key
  handle text
  picture text
  created_at text
  last_seen_at text

station_completions
  portal_user_id text
  station_id text
  completed_at text
  primary key (portal_user_id, station_id)

daily_attempts
  portal_user_id text
  daily_date text
  started_at text
  solved_at text
  viewed_reveal_at text
  hint_count integer default 0
  wrong_attempts integer default 0
  primary key (portal_user_id, daily_date)
```

Future optional table:

```sql
daily_events
  portal_user_id text
  daily_date text
  event_type text
  payload_json text
  created_at text
```

This can support analytics, replay/debugging, and richer scoring without complicating the first implementation.

## Visual Direction

- Dungeon archive / cryptolab atmosphere.
- One static room with progressive visual states.
- Hotspots should be obvious but still feel integrated into the room.
- Reuse visual assets from `~/Projects/raidguild/forge/arcade-roundtable-melee` where useful:
  - dungeon background
  - character sprite sheets
  - item sprites
  - pixel UI styling
- Generate new raster assets where needed for puzzle props, room variants, lore artifacts, portraits, and item sprites. See `docs/imagegen-assets.md`.

## Initial Technical Direction

- Build as a Next.js webapp/module suitable for Portal.
- Use the same general deployment pattern as `arcade-roundtable-melee`: a single Railway service.
- Prefer a React component model for puzzle panels and state.
- Use data-driven puzzle definitions.
- Keep cipher encode/decode logic isolated and unit-testable.
- Store anonymous progress in local state first.
- Store authenticated station completion, Daily Vault attempts, leaderboard data, and streak data in SQLite on a Railway persistent volume.
- Avoid adding a separate database service for the MVP.
- Avoid adapting the arcade combat loop unless movement becomes a hard requirement.

## Storage Direction

The archive training loop can work with client/session state for anonymous users, but authenticated progress and Daily Vault scoring require server-side storage.

SQLite-backed data:

- Authenticated user records from Portal launch/session.
- Persistent station completion/tool unlock records.
- Daily attempt records.
- Direct reveal state.
- Hint counts, wrong attempts, completion time, and streaks.
- Optional daily challenge records if generated dailies need to become auditable or curated.

SQLite should live on the Railway persistent volume so the module can remain a single deployable service.
