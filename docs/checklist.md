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
- [ ] Confirm final Portal module integration requirements.
- [ ] Audit reusable assets from `arcade-roundtable-melee`.
- [ ] Identify missing generated assets and draft prompts using `docs/imagegen-assets.md`.

## Phase 1 - Content Design

- [ ] Draft 8-12 Caesar / ROT13 phrases.
- [ ] Draft 8-12 Rail Fence phrases.
- [ ] Draft 8-12 Vigenere phrases.
- [ ] Draft 5-8 Diffie-Hellman puzzle setups.
- [ ] Draft 3-5 final vault combinations.
- [ ] Draft short lore artifacts for Diffie, Hellman, Merkle, Finney, Cohen, Gilmore, and Chaum.
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
- [x] Connect each widget to shared station shell.
- [x] Connect solve events to room visual progress.

## Phase 5 - Polish and Validation

- [ ] Generate or finalize missing puzzle prop assets.
- [ ] Generate or finalize missing lore/item assets.
- [ ] Log generated asset prompts, paths, and post-processing notes.
- [ ] Add room state visuals for solved stations.
- [ ] Add basic sound cues if appropriate.
- [ ] Verify text fits on mobile and desktop.
- [ ] Verify all puzzles are solvable by hand.
- [ ] Verify hint flow does not reveal too much too early.
- [ ] Run accessibility pass for keyboard and screen-reader basics.
- [ ] Run browser QA on desktop and mobile viewport sizes.

## Phase 6 - Future Daily Mode

- [ ] Define daily seed format.
- [ ] Create daily challenge generator using existing cipher engines.
- [ ] Add daily challenge route/view.
- [ ] Decide whether daily challenge state needs SQLite persistence.
- [ ] Add SQLite schema and volume path config if persistence is needed.
- [ ] Add scoring based on hints and completion time.
- [ ] Add shareable result format.
- [ ] Add streak/progress persistence if Portal supports it.
