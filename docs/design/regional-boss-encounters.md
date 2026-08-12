# Regional boss encounter design

Last updated: 2026-08-13

## Problem

The old wave generator appended a mid-boss to every defense and appended a
great boss whenever the global wave number was divisible by five. That made a
great boss feel like a calendar event instead of the climax of a place. It also
created a flat sequence: clear the mid-boss, wait a few seconds, then fight the
great boss alone.

## Implemented encounter rhythm

Boss cadence now comes only from the active expedition region, never from the
global wave number.

| Regional position | Encounter | Player-facing decision |
| --- | --- | --- |
| Early defenses | Patrol squads | Read the enemy mix and prepare the three roads. |
| Penultimate defense | One mid-boss plus three simultaneous minions | Choose whether to burst the commander or stabilize the road that its minions opened. |
| Final defense | Regional great boss plus minions and a mid-boss lieutenant | Split attention between the center shortcut and a pressured side road. |
| Final chapter region | Great boss plus minions and two side-road lieutenants | Use all three match-3 columns and hero actives as one final formation. |

The formation minions are reserved from the existing normal-monster budget,
not added on top of it. Regional lieutenants use 58% health, 65% reward, and
72% castle damage. They retain the mid-boss silhouette and rules but do not
produce overlapping entrance banners. This raises simultaneous pressure
without turning the climax into an arbitrary health wall.

`verdant-dawn` ends with the dragon and `ember-gate` ends with the ancient
destroyer. A wave numbered 5 has no special meaning by itself.

## Visual safety contract

Intensity must come from target selection and formation shape, not from the
whole display flashing. The renderer therefore has no post-processing bloom
pulse or camera shake, and the five-match CSS never animates or filters the
scene/canvas. Local impact particles, a compact banner, a card glow, and small
warning accents remain available.

`npm.cmd run visual:check` rejects full-battlefield animation/filter rules,
post-processing composer code, bloom pulse state, and camera shake state.

## Verification

- Engine checks assert the commander/minion formation, both regional finales,
  two side lieutenants in the chapter finale, and the absence of a wave-5 boss.
- The 60-seed balance gate uses the same journey, hero actives, and match-3
  policy as the playable game.
- Browser smoke checks cover the `지휘관전` preview and both reduced and lively
  effect settings. In both settings, the scene and canvas report no animation
  or filter.
