# Campaign-wide `art-v2` expansion — 2026-08-14

## Scope

The P0 pilot was expanded from Arin and the Verdant Dawn encounter to the five
named heroes and all five campaign regions. All added models come from the same
Quaternius CC0 character/monster families. `art-v2` is now the release default;
`?art=procedural` remains the zero-manifest fallback and comparison path.

Hero mapping:

- Arin / Warrior, Luna / Wizard, Doyun / Monk, Sera / Ranger, Yuna / Cleric.
- Only the two starting heroes are preloaded. The three recruit models are
  requested when their views first exist.

Regional monster mapping:

- Verdant Dawn: Green Blob, Demon, Yeti, Blue Demon boss.
- Ember Gate: Orc, Orc Skull commander, Blue Demon boss.
- Neon Ruins: Alien, Blue Demon commander, Alien boss.
- Ashen Margin: Mushroom King family at three readable scales.
- Manuscript Core: Orc Skull, Alien commander, Blue Demon boss.

## Asset budget

| Budget | Measured | Limit |
| --- | ---: | ---: |
| Initial release files + preload assets | 5.97 MiB | 12.00 MiB |
| Full runtime asset set | 14.73 MiB | 60.00 MiB |
| Largest single file | 2.06 MiB | 8.00 MiB |

The campaign adds 9 GLB files. Models not needed by the first defense are marked
`preload: false`; a failed request keeps the procedural actor visible.

## Same-scene browser measurement

Local Chromium, Windows, DPR 1, `judge=1&perf=1&mute=1&hour=11`. The probe
records ten seconds after asset readiness. Mobile uses the actual 390×844
viewport, `gfx=lite&mobile=1&decor=off`.

| Metric | Desktop procedural | Desktop release `art-v2` | Mobile procedural | Mobile release `art-v2` |
| --- | ---: | ---: | ---: | ---: |
| Average FPS | 57.08 | 57.04 | 57.09 | 57.02 |
| p95 frame time | 18.10 ms | 18.10 ms | 18.10 ms | 18.10 ms |
| First frame | 99.30 ms | 175.79 ms | 58.50 ms | 169.40 ms |
| Asset ready | 264.30 ms | 550.40 ms | 209.50 ms | 425.80 ms |
| Asset transfer | 0 B | 4,968,949 B | 0 B | 4,968,949 B |
| Render calls | 274 | 272 | 243 | 247 |
| Triangles | 99,415 | 119,767 | 11,165 | 34,561 |
| Textures | 7 | 26 | 6 | 31 |
| Geometries | 272 | 293 | 241 | 266 |

The desktop captures differed by two currently visible spawned enemies, so
draw-call/triangle rows are diagnostic rather than a strict model delta. The
mobile captures had the same three visible enemies and are the exact comparison.
Average FPS changed by -0.12% on mobile and p95 did not change, safely within
the -10% FPS / +20% p95 merge limits. The mobile page had zero horizontal
overflow, and `body`/`.stage` animation plus stage filter all remained `none`.

## Decision

GO. The same art family now communicates named hero role, region, commander,
and boss silhouette without consuming the first-play or runtime budgets. Keep
later models lazy and do not add another character family until a measured scene
shows a role that these rigs cannot express.
