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
- Morse signal desk: decode a short light, sound, or dot/dash transmission. Teach explicitly that Morse is an encoding, not encryption.
- Pigpen cabinet: map geometric symbols back to letters using a physical-looking key plate.
- Playfair grid: decode letter pairs with a keyed 5x5 square.
- Book cipher shelf: resolve coordinates against a fixed document stored inside the module.
- XOR console: combine short binary strings and show why applying the same key reverses the operation.
- Base64 terminal: distinguish transport encoding from encryption.
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

Expand the roster in themed groups so every addition supports a puzzle, clue, or artifact:

- Eric Hughes: co-founder of the Cypherpunks group and author of *A Cypherpunk's Manifesto*. Use for privacy-versus-secrecy clues and the idea that cypherpunks build working tools.
- Timothy C. May: co-founder and author of *The Crypto Anarchist Manifesto*. Use for early movement history, anonymous networks, and predictions about online identity and commerce.
- Jude Milhon: credited with coining the name "cypherpunk." Use for an archive naming/origins artifact rather than assigning her a cryptographic invention.
- Phil Zimmermann: creator of Pretty Good Privacy. Use for a PGP desk, public/private key selection, and the history of publishing encryption software.
- Adam Back: creator of Hashcash. Use for a small proof-of-work or anti-spam stamp puzzle.
- Cynthia Dwork and Moni Naor: proposed computational pricing to combat junk mail before Hashcash. Use as the conceptual lineage for proof-of-work rather than labeling them members of the Cypherpunks movement.
- Wei Dai: proposed b-money and created Crypto++. Use for digital-cash design and pseudonymous contract clues.
- Nick Szabo: proposed bit gold. Use for chained proof-of-work and minimizing trusted intermediaries.
- Len Sassaman: maintained Mixmaster and contributed to OpenPGP. Use for an anonymous-remailer routing puzzle.

The roster should distinguish among Cypherpunks founders/participants, earlier cryptographic pioneers, and adjacent privacy or digital-cash researchers. They belong in the same history, but not everyone should be labeled a cypherpunk.

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

## Daily Difficulty Model

Difficulty should change the amount of inference required, not only add more mechanical decoding. The daily remains one shared challenge for all players. Its difficulty is selected by a visible calendar cadence, then the seed generates a reproducible challenge within that tier.

Recommended rollout:

- Easy: the current vault pattern. Three familiar layers, each tool used once, decode order shown, short plaintext, and strong parameter clues.
- Medium: three familiar layers in a seeded order. The player must infer which tool comes next from the output and archive clues. Use longer plaintext, more research files, and less direct parameter clues.
- Hard: four layers with one advanced tool plus familiar tools. The player infers the order and resolves a historical or conceptual clue for the new tool. Avoid exceeding four layers until playtesting shows the work remains fun.

Initial cadence:

- Monday and Tuesday: easy.
- Wednesday through Sunday: medium.
- After at least one advanced training station ships, Saturday and Sunday can become hard days.

This cadence keeps the daily socially shared and gives players a known ramp through the week. Difficulty should be an explicit input to generation rather than an accidental result of random-number calls. A versioned seed should include date and difficulty, for example `daily:v2:2026-07-10:medium`.

Normal hints should form a ladder for each unresolved layer:

1. Point toward the next tool family through a riddle, acrostic, artifact, or recognizable output shape.
2. Narrow the parameter, key source, or reading method.
3. Reveal the next tool and parameter, but not the final plaintext.
4. The existing direct reveal gives the complete route or answer and removes daily credit.

Medium should first ship using only Caesar, Rail Fence, and Vigenere. Reordering those tools adds meaningful diagnosis without requiring another station. Repeating a tool or adding extra layers should be used sparingly; repetition often adds labor without adding a new idea.

## Phrase Length and Content Banks

Longer phrases should be part of medium and hard difficulty, but phrase length must be constrained by the selected tools and viewport. Recommended normalized plaintext targets:

- Easy: 18-32 letters, usually 3-5 words.
- Medium: 35-65 letters, usually 6-10 words.
- Hard: 55-90 letters, usually 8-14 words.
- Morse or Pigpen layer: cap the source near 20-35 letters until the symbol UI has been playtested, because these representations expand dramatically.

Length is a supporting difficulty factor, not the main one. A long phrase with an obvious route is mostly repetitive; a medium phrase with a clue-driven tool order is a stronger puzzle.

Store phrases as records rather than bare strings:

```ts
type PhraseDefinition = {
  id: string;
  text: string;
  tiers: Array<"easy" | "medium" | "hard">;
  themes: Array<"privacy" | "speech" | "digital-cash" | "remailers" | "proof-of-work" | "peer-to-peer">;
  figureIds: string[];
  maxExpansion?: "text" | "symbols";
  sourceUrl?: string;
  attribution?: string;
};
```

Prefer original educational phrases that paraphrase a concept, such as:

- `PRIVACY REQUIRES TOOLS PEOPLE CAN ACTUALLY USE`
- `A PUBLIC MESSAGE CAN HELP CREATE A PRIVATE SHARED SECRET`
- `ANONYMOUS REMAILERS BREAK THE LINK BETWEEN SENDER AND RECEIVER`
- `COMPUTATIONAL COST CAN MAKE MASS ABUSE EXPENSIVE`
- `OPEN PROTOCOLS LET STRANGERS COORDINATE WITHOUT ONE GATEKEEPER`

Use verified historical quotations sparingly and store their attribution and source. A figure association does not mean the generated phrase is a quotation from that person.

Phrase selection should consider the whole pipeline. The generator filters by difficulty, theme, figure, and output compatibility before making a seeded selection. It should reject results that exceed tool-specific display limits.

Longer challenges require the workbench to chunk visual output. Vigenere strips and Rail Fence reconstructions should display in fixed windows of roughly 12-16 letters with clear continuation, while the work text and answer fields wrap without changing puzzle state.

## Layered Challenge Definition

The current vault stores one `vaultShift`, `vaultRails`, and `vaultKeyword` and assumes a fixed decode order. Medium and hard require a general ordered layer definition.

```ts
type CipherToolId =
  | "caesar"
  | "rail-fence"
  | "vigenere"
  | "atbash"
  | "morse";

type VaultLayer = {
  id: string;
  tool: CipherToolId;
  params: Record<string, string | number>;
  clueIds: string[];
};

type DailyChallenge = {
  id: string;
  generatorVersion: number;
  date: string;
  seed: string;
  difficulty: "easy" | "medium" | "hard";
  encodedText: string;
  layers: VaultLayer[]; // Stored in the order the player should decode them.
  researchFiles: VaultResearchFile[];
  expectedAnswer: string;
  acceptedAnswers: string[];
};
```

Generation starts with the plaintext and applies the inverse of `layers` so the player can decode in the stored order. The generator must validate every generated challenge by replaying all decode layers and asserting that the normalized result equals the expected answer.

The client should receive a public challenge view that omits `expectedAnswer` and any parameters intended to remain hidden. The server retains or deterministically rebuilds the full definition for answer validation. This is not intended as high-stakes anti-cheat, but answers should not be embedded directly in normal client state.

The vault UI should use a tool registry instead of hardcoded Shift/Rail/Keyword tabs. Each tool registration owns its decoder component, unlock requirement, supported input alphabet, and preview/apply behavior. This allows a new station to unlock a new daily tool without rewriting the vault shell.

Some tools cannot be composed in every order. Morse and Pigpen produce symbols rather than plain A-Z text, for example. Each tool should declare compatible input/output alphabets, and the generator should only choose valid pipelines. Morse and Pigpen are best used as the outermost encoded layer at first.

## Advanced Tool Roadmap

Recommended order for new training stations:

| Tool | Learning value | Daily role | Implementation cost |
| --- | --- | --- | --- |
| Atbash | Fast introduction to substitution and symmetry | Easy extra layer or medium order clue | Low |
| Morse | Strong visual/audio interaction; clarifies encoding vs encryption | Outermost hard layer | Medium |
| XOR | Connects hand ciphers to a real modern primitive | Short binary hard layer | Medium |
| Pigpen | Memorable visual symbol puzzle | Outermost hard layer | Medium-high |
| Book cipher | Excellent archive/escape-room theme | Research-driven coordinate layer | Medium, but requires a fixed in-app source text |
| Playfair | Rich hand-solvable keyed cipher | Advanced hard layer | High due to digraph rules and teaching UI |

Braille can be an interesting representation puzzle, but it is a writing system rather than a cipher and has a weaker direct connection to cypherpunk history. If included, present it accurately and design for accessibility rather than treating accessibility itself as secrecy.

Merkle trees, Diffie-Hellman, blind signatures, PGP, and peer-to-peer routing are better as standalone stations or branching verification puzzles than text-transform layers. They teach important cryptographic ideas, but forcing them into a decode pipeline would distort the concepts.

## Daily Persistence and Versioning

Before medium/hard launch, persist the generated daily definition so old challenges remain reproducible when phrase banks or generator code change.

Add a `daily_challenges` record containing at least:

- `challenge_id`, `daily_date`, `difficulty`, and `generator_version`.
- The seed and serialized full challenge definition.
- Creation timestamp and optional publication/curation status.

Associate `daily_attempts` with `challenge_id` and retain the date for streak queries. Leaderboards should display difficulty and compare players only within the same shared challenge. Existing solve/reveal credit rules can remain unchanged.

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
