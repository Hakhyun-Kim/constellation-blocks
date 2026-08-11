# Cross-machine continuation guide

Last updated: 2026-08-12

This document is the starting point for a developer or Codex session picking
up `Constellation Defense` on another computer.

## Current handoff state

- Branch: `main`
- Town implementation commit: `8b4037c feat: add dedicated 3d town screen`
- Working tree at handoff: clean
- Latest deterministic gates: `npm.cmd run check` and
  `node scripts/balance-check.mjs 60` passed on 2026-08-11.

The current campaign is an authored constellation expedition. It starts with
Arin and Luna, uses a fixed five-hero party, and connects short defense stages
with map choices and towns. The live battle loop remains real-time match-3:
Flare damages, Tide slows, and Bloom heals/pushes back enemies on the selected
road. Do not restore the former math-prototype gates, random summoning, or
rank-combination loop.

## Fresh-machine setup

In PowerShell:

```powershell
git clone https://github.com/Hakhyun-Kim/constellation-defense.git
Set-Location constellation-defense
git switch main
git pull --ff-only origin main
npm.cmd ci
npm.cmd run check
node scripts/balance-check.mjs 60
npm.cmd run serve
```

Open the local URL printed by `npm.cmd run serve`. Use `npm.cmd`, not `npm`,
on Windows because the PowerShell execution policy may block the shim.

## Current town implementation

The most recent feature deliberately makes a town a separate visual screen:

- `src/ui.js` owns town entry, walking, proximity, dialogue, recruit actions,
  and facility actions.
- `src/app/village-layout.js` is the shared pure source for the plaza bounds,
  building collision rectangles, target locations, and proximity checks.
- `src/gfx/village.js` draws the procedural Three.js plaza only. It must not
  decide rewards, facility rules, or combat results.
- `src/main.js` frames `VillageRenderer` while a town is active; otherwise it
  frames the normal defense renderer. The defense canvas/HUD must not be shown
  in town.

See [town-only-presentation.md](design/town-only-presentation.md) for the
player-facing decision.

## Required manual smoke test

Automated checks cover the pure layout contract but not WebGL composition.
Before presenting or submitting a visual change, manually confirm:

1. Reach a town from the expedition map.
2. Confirm the defense canvas and combat HUD disappear, leaving only the town
   plaza, its header, and its interaction controls.
3. Move with WASD/arrow keys, a plaza click, and the mobile direction controls.
4. Approach a recruit NPC and a facility; Enter/the action button must only
   work inside the interaction radius.
5. Leave to the map, start a defense stage, and confirm the normal defense
   renderer returns without console errors.
6. Repeat the first swap, all three tactics, 4/5 matches, wave clear, defeat
   reset, and a town facility visit at desktop and mobile widths.

## Change discipline

- Read `AGENTS.md`, this guide, and the relevant design note before changing a
  system. Preserve unrelated work in a dirty tree.
- Rules and balance belong in `src/engine/` and `src/balance/`; DOM, Three.js,
  VFX, and sound only present their output.
- Add or update a deterministic check with a behavior change. Run
  `npm.cmd run check`; rerun the 60-run balance gate whenever gameplay numbers
  or the bot policy changes.
- Run `npm.cmd run build` instead of editing `dist/game.js` directly.
- Keep all art, terrain, models, VFX, and sound procedural. Do not add external
  game assets.

## Public/private boundary

This repository is public. Do not add application copy, checklist text,
recordings, credentials, or other submission material from the separate private
directory `D:\constellation-defense-submission`. If that directory is not
available on the next computer, continue game work here and leave submission
material untouched.

## Suggested next task

Perform the manual town smoke test above first. If the plaza still feels unlike
a compact RPG town, improve only the presentation in `src/gfx/village.js` and
CSS: path readability, building silhouettes, NPC readability, lighting, and
camera framing. Keep the pure layout API and the engine/facility rules intact.
