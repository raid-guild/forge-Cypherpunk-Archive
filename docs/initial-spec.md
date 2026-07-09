# Cypherpunk Archive Learning Module - Initial Spec

## Summary

The Cypherpunk Archive is an interactive web learning module for Portal. The first version is a one-room escape-room experience that teaches approachable cipher concepts and introduces key cypherpunk figures through short, contextual artifacts.

The experience should feel like exploring a dungeon archive, but the interaction model should stay manageable: players click or tap hotspots in a single room, open puzzle stations, solve hand-solvable cipher challenges, collect lore artifacts, and unlock a final vault.

## Goals

- Teach beginner-friendly cipher concepts through direct interaction.
- Introduce cypherpunk history, values, and major contributors without turning the module into a lecture.
- Use a consistent puzzle shell so each station feels familiar while still supporting different cipher mechanics.
- Keep the MVP small enough to build, test, and expand.
- Preserve a path toward replayability through curated random phrase selection and a future daily puzzle mode.

## Non-Goals for MVP

- Full character movement, collision, or dungeon crawling.
- Procedural rooms or fully generated puzzles.
- AI-generated hinting.
- Complex cryptographic math.
- Multiplayer.
- Scoreboards, streaks, or timers.

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
8. Use solved artifacts to open the final vault.

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
- Interaction: combine outputs or artifacts from earlier stations.
- Difficulty: medium.
- Teaching point: cryptographic systems often combine multiple primitives and protocols.

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

Daily Puzzle should be a later mode, not the first build target.

Archive Demo:

- Guided.
- Educational.
- Generous hints.
- No scoring pressure.
- Teaches one idea at a time.

Daily Cipher:

- One seeded challenge per day.
- Reuses cipher engines from the archive.
- Combines multiple learned mechanics.
- Has fewer hints.
- May track timer, hint count, streak, or shareable result.

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
- Store progress in local state first.
- If persistence is needed, use SQLite on a Railway persistent volume.
- Avoid adding a separate database service for the MVP.
- Avoid adapting the arcade combat loop unless movement becomes a hard requirement.

## Storage Direction

The MVP should not require server-side storage unless Portal integration or daily challenge state requires it. Start with client/session state for the guided archive.

Potential SQLite-backed data, if needed later:

- Daily puzzle seed and generated challenge records.
- Player daily completion records.
- Hint counts, completion time, and streaks.
- Portal launch/session mapping if not fully handled upstream.

SQLite should live on the Railway persistent volume so the module can remain a single deployable service.
