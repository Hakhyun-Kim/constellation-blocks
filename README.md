# Constellation Defense

**A real-time match-3 tactics defense game.**

Constellation Defense is a 3D kingdom-defense game built around a fixed four-hero squad. Every run begins with Arin the knight, Doyun the guard, Sera the archer, and Yuna the mage already defending the castle. They gain experience from combat and choose specializations as they level up, while Luna, the Star Warden, remains directly playable.

During battle, swap neighboring stars on the 6×6 board. Each match targets the matching road:

- **Flare** damages enemies on that road.
- **Tide** slows that road's enemy line.
- **Bloom** restores the citadel and pushes danger back.
- Four- and five-star constellations create stronger tactical moments.

The player’s choices are deliberately focused: position the four heroes, select their specializations and castle upgrades between waves, then react with tactical swaps during the fight. Random summoning, duplicate heroes, rank combinations, and rarity collection are not part of the current game.

The redesign decision and verification gates are recorded in [docs/design/hero-squad-redesign.md](docs/design/hero-squad-redesign.md).

## Play

[Play in the browser](https://hakhyun-kim.github.io/constellation-defense/)

```bash
npm install
npm run build
npm run serve
npm run check
npm run balance:check
```

## Built with Codex

Codex was used as a development collaborator to evolve an existing 3D defense foundation into a focused match-3 tactics game. It helped separate deterministic simulation rules from presentation, add the tactical board, create the fixed-squad growth system, automate balance runs with real match-3 actions, and retain procedural 3D visuals and synthesized audio.

The design decisions were human-led: matching must map to a visible road, each tactic must have a distinct role, and hero growth must create commitment without competing with the live board.

## Technical notes

- Browser-only static build with esbuild.
- `src/engine/` is DOM- and renderer-free, enabling deterministic Node checks.
- `src/balance/` is the single source for tactical and squad-growth numbers.
- `src/app/tacticflow.js` owns board input and cascades; `src/engine/tactics.js` resolves their commands into combat events.
- All 3D models, VFX, terrain, and Web Audio sound are generated procedurally; no game-art or audio asset files are required.

See [CREDITS.md](CREDITS.md) for font credits.
