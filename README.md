# Constellation Blocks

**A real-time block-puzzle tactics defense game.**

Constellation Blocks is a 3D kingdom-defense game framed as a compact constellation expedition. Every run begins with Arin the knight and Luna the constellation mage. The player follows an authored star-map, clears short defense encounters, and chooses which towns and companions to pursue. Doyun, Sera, and Yuna can join the party; a party holds up to five heroes and each hero gains experience and specializations.

During battle, the lower panel is an 8×8 block board. Three pieces wait in a tray; you place them on the board (no rotation, no gravity) and **a line that fills up completely is a tactic**:

- A **column** clear casts on the single lane that column belongs to — focused.
- A **row** clear casts on all three lanes, one tier weaker — spread.
- The **majority colour** of the cleared cells decides which tactic fires: **Flare** damages, **Tide** slows, **Bloom** heals the citadel and pushes the lane back.
- Two or three lines at once, or three clears in a row, raise the tactic one tier.
- If nothing fits, the tray is redealt; if the board is still jammed, one row is swept with **no** tactic — a lost beat, never a game over.

The point of the swap from match-3 to blocks: match-3 asks "what answer is already on the board?", blocks ask "what board do I want next?" Placing a piece *is* deciding which lane you will be able to defend two moves from now, which is the same question the defense layer asks.

The redesign decisions and verification gates are recorded in [docs/design/block-board-redesign.md](docs/design/block-board-redesign.md).

## Play

[Play in the browser](https://hakhyun-kim.github.io/constellation-blocks/)

```bash
npm install
npm run build
npm run serve
npm run check
npm run balance:check
```

Use `?lang=en` for the English build, or change **Language** from the in-game ⚙️ settings panel.

## Technical notes

- Browser-only static build with esbuild.
- `src/blocks/board.js` is the whole puzzle: grid, pieces, placement, line clears, tray dealing, lane mapping. It knows nothing about DOM, the renderer, or the engine.
- `src/engine/tactics.js` accepts only `{ route, kind, size }` commands, so the defense rules were untouched by the puzzle swap — the same file served the match-3 board before.
- `src/engine/` is DOM- and renderer-free, enabling deterministic Node checks.
- `src/balance/` is the single source for tactical and squad-growth numbers; `src/balance/blocks.js` holds the puzzle's tier, streak, and piece-weight numbers.
- `src/app/blockflow.js` owns board input, ghost previews, and resolution timing.
- The balance bot places real pieces through the same pure rules the player uses (`npm run balance:check`).
- The release uses a single CC0 Quaternius character/monster family and compact CC0 Kenney combat samples, with procedural terrain, VFX, and synthesized fallbacks.
- `?art=procedural` runs without requesting the external-asset manifest. Every bundled asset has recorded provenance and must pass the initial-download, integrity, and rendering-performance gates.
- The 📊 toolbar button exports up to 40 locally stored play-session records for duration testing. No identifier or play telemetry is sent over the network.
- The ⚙️ panel shares graphics, reduced-effects, audio, and remappable physical-key preferences across browser and desktop builds.
- Korean and English share stable game/save IDs; localization changes presentation only. Saves and star shards from Constellation Defense are migrated once on first launch.

## Lineage

This game is a fork of [Constellation Defense](https://github.com/Hakhyun-Kim/constellation-defense). The expedition, heroes, citadel, enemies, renderer, and synthesized audio come from that project; the puzzle layer, its balance numbers, the bot's placement policy, and the checks around them are new here.

See [CREDITS.md](CREDITS.md) for asset and font credits.
