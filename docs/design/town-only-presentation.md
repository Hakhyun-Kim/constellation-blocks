# Town-only presentation

Status: accepted and implemented on 2026-08-11.

## Decision

Entering a town hides the defense canvas and combat HUD and mounts a dedicated
Three.js plaza. The town never starts, resolves, or rewards a wave.

## Player experience

- The plaza has a spawn point, forge, shrine, guild, recruit NPCs, path,
  fence, trees, and small props. They are all procedural meshes; no external
  image, audio, or 3D asset is added.
- WASD/arrow keys, mobile direction buttons, and a plaza click move the avatar.
  A player must be inside a target radius before Enter/the action button opens
  a recruit conversation or facility panel.
- Leaving town removes the town canvas and returns rendering control to the
  defense renderer.

## Ownership

- `src/ui.js` owns movement, proximity, dialogue, and facility actions.
- `src/gfx/village.js` only draws the plaza from that presentation state.
- The game engine and balance rules stay unchanged; this is a presentation and
  navigation boundary, not a combat rule.
