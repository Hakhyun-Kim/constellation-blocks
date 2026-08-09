# Constellation Defense

**Match the stars. Command the battle.**

Constellation Defense is a browser-first real-time tactics defense game. You command three automatic guardian lanes while using a live match-3 board as a spellbook. The *place* of a match targets a lane, its colour chooses the tactic, and a four- or five-star constellation becomes a devastating nova or starfall.

## Play

Open [the live game](https://hakhyun-kim.github.io/constellation-defense/) once GitHub Pages finishes deploying, or run it locally:

```bash
npm install
npm run build
npm run serve
```

## Controls and rules

- Click two neighboring stars to swap them.
- Columns 1–2 attack **Aurora**, 3–4 **Comet**, and 5–6 **Nebula**.
- Orange **Flare** stars damage enemies, blue **Tide** stars freeze them, and green **Bloom** stars heal or rally a defender.
- Spend stardust between waves to upgrade the guardian in a lane.
- Three stars cast a lane tactic; four make a nova; five call a starfall.

## Built with Codex

This project was rebuilt from a defense-game prototype into a new game loop with Codex as a development collaborator. Codex helped translate the design goal into a playable browser architecture, build the responsive match-3 board and real-time lane simulation, and iterate on readable visual feedback. The creative decisions — linking board columns to lanes, assigning tactical identities to star colours, and keeping match-3 play active during combat — were deliberately selected to make every swap a battlefield decision instead of a detached minigame.

The game uses no image or audio assets. Its night sky, battlefield, enemy movement, projectiles, constellation board, and UI are generated in HTML, CSS, and JavaScript.

## Technical notes

- Static browser build, with no runtime server or account requirement.
- `src/main.js` owns deterministic gameplay state, matching, tactics, waves, and rendering.
- The bundle is generated with esbuild and committed so the game can be opened without a local build step.

## License and credits

The game uses Google Fonts (Fredoka and Space Grotesk). See [CREDITS.md](CREDITS.md).
