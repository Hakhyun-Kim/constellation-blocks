# Constellation Defense

**A real-time match-3 tactics defense game.**

Constellation Defense keeps the full 3D kingdom-defense experience — summon and position heroes, combine their ranks, improve a castle, withstand boss waves, and grow the Star Warden — while replacing the former learning gate with a live tactical starboard.

During battle, match neighbouring stars on the 6×6 board. The matched columns point to the left, center, or right road; the constellation type decides the effect:

- ☄️ **Flare** deals damage on that road.
- ❄️ **Tide** slows that road's enemy line.
- 🛡️ **Bloom** restores the citadel and pushes danger back.
- Four- and five-star constellations are stronger tactical moments.

Hero combinations are now immediate, gold-only preparation choices. The real-time puzzle is the combat layer: it creates last-second saves without replacing the army-building strategy.

## Play

[Play in the browser](https://hakhyun-kim.github.io/constellation-defense/)

```bash
npm install
npm run build
npm run serve
npm run check
```

## Built with Codex

Codex was used as a development collaborator to evolve an existing 3D defense foundation into a distinct match-3 tactics game. It helped map the new game loop onto the existing renderer and pure simulation engine, add a deterministic tactical-board flow, and preserve the original responsive UI, automatic demo player, procedural 3D world, synthesized audio, and engine invariants.

The design decisions were human-led: the match location must map to a visible road, tactical colors must have clearly different jobs, and the puzzle must remain active during combat rather than becoming a detached reward screen.

## Technical notes

- Browser-only static build with esbuild.
- The `src/engine/` layer is DOM- and renderer-free, enabling node-based invariant checks.
- `src/app/tacticflow.js` owns board input and cascades; `src/engine/tactics.js` resolves the resulting commands into the game's usual event stream.
- All 3D models, VFX, terrain, and Web Audio sound are generated procedurally — no game-art or audio asset files are required.

See [CREDITS.md](CREDITS.md) for font credits.
