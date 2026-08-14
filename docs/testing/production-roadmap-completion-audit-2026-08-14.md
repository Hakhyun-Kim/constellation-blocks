# Production roadmap completion audit — 2026-08-14

This audit maps every requested P0-3 through P3 deliverable to current-state
evidence. A roadmap checkbox is not evidence by itself. Automated checks prove
deterministic contracts; stored captures prove the requested visual comparison;
browser and packaged-app smoke prove integration. Human-play requirements remain
open until real people provide qualified exports.

| Requirement | Status | Authoritative evidence |
|---|---|---|
| P0-3: 8–12 real SFX, layered and normalized | Achieved | Ten Kenney CC0 OGG entries in `assets/manifest.json`, ten distinct runtime roles in `src/audio/sample-plan.js`, gain range −16 to −7 dB, `audio:pilot:check`, runtime fallback checks, `CREDITS.md`. |
| P0-4: same-seed before/after stills, 10-second video, desktop/mobile performance | Achieved | Four JPEGs, two WebMs, and comparison page under `docs/evidence/art-v2/`; measured desktop/mobile tables and GO decision in `docs/performance/art-v2-verdant-gate-2026-08-13.md`; `capture:check`, `evidence:check`, `perf:check`. |
| P1: combat information hierarchy | Achieved | `src/app/combat-focus.js`, combat projection in `src/ui.js`, battle-only panel CSS, static/local boss feedback, `combat:ui:check`, `visual:check`, desktop and 390×844 browser smoke with zero overflow and no stage animation/filter. |
| P2-1: chapter registry | Achieved | Ordered `JOURNEY_CHAPTERS`, chapter-scoped lookup and safe recovery covered by `engine:check` and `act2:check`. |
| P2-2: Act 1 history, Act 2 transition, save/restore, ending | Achieved | Versioned journey history/ending state and deterministic transition, save round-trip, ending lock, single-choice, and bot-path assertions in `engine:check` plus `storage:check`. |
| P2-3: three regions, eight nodes, notes, refugee station | Achieved | Authored Act 2 graph and state in balance/engine data; reachability, unique notes, branch lock, refugee derivation, and three renderer themes in `act2:check`. |
| P2-4: monster blueprint through the public command path | Achieved | `castMonsterBlueprint()` availability/charge/projectile/persistence tests for player and bot, UI G-key/button integration, and two-chapter campaign balance gate. |
| P3-1: five heroes and regional enemy/boss art family | Achieved | Five Quaternius hero rigs, five-region Ultimate Monsters mapping, lazy manifest selection, GLB structural checks, and same-scene performance record in `docs/performance/art-v2-campaign-expansion-2026-08-14.md`. |
| P3-2: human campaign 25–40 min and weekly 10–15 min measurement | External evidence pending | Timing/actions/checkpoints/retry instrumentation, privacy boundary, weekly scope, export, and report checks are achieved. `?playtest=novice\|regular\|expert` now binds the documented cohort to each session and shows a visible badge. Verified human samples: **0**. |
| P3-3: browser plus desktop demo, settings, path, remapping, ko/en | Achieved | Preference/i18n checks, English desktop/mobile smoke, secure Electron protocol/preload checks, source and packaged executable smoke, and Steam ZIP evidence in `docs/performance/desktop-package-2026-08-14.md`. |
| P3-4: decide Early Access content from human exit/completion/retry data | External evidence pending | Deterministic aggregate and conservative scope branches are implemented and tested. Gate now requires ≥5 people, ≥5 attempts and ≥3 completions per mode, plus all three experience cohorts. With 0 human samples the only valid decision is to hold the two-chapter + weekly scope. |

## Completion-criterion audit

- One capture can expose hero, boss, three-lane pressure, and match-3 together:
  implemented by the combat-focus layout and stored desktop/mobile evidence.
- External art reads as one game: runtime characters and monsters use the same
  Quaternius families; Kenney supplies the coherent SFX family; provenance and
  hashes pass the manifest gate.
- Act 1 leads into a new objective rather than ending the run: deterministic
  chapter transition, history preservation, eight-node Act 2, and ending choice
  pass engine and storage tests.
- Serious story plus restrained comedy: authored bilingual beats are present,
  but whether the tone lands remains a qualitative human-test question.
- Browser entry, mobile controls, reduced-effects safety, save restore, and
  deterministic balance are covered by automated gates and direct browser smoke.
- The desktop package looks and behaves as a product wrapper: branded executable,
  offline fonts/assets, explicit storage path, sandboxed bridge, ASAR, and a
  depot-ready ZIP have all run successfully.

## Commands passed in this audit

```powershell
npm.cmd run check
npm.cmd run storage:check
node scripts/balance-check.mjs 60
npm.cmd run campaign:balance:check
```

The experience-profile change was additionally checked in the local browser at
desktop and 390×844 widths. The Korean novice route showed a valid human-test
badge; the English weekly expert route showed both weekly and cohort badges; an
unknown profile showed the red “Profile required” state. All had zero horizontal
overflow and no whole-stage animation or filter.

## Honest remaining condition

No code, bot, generated data, or Codex-operated browser session can satisfy the
two open human requirements. Completion requires a facilitator to run the
documented cohort, collect the local JSON exports, keep the four qualitative
answers separately, and execute `npm.cmd run playtest:report -- ...`. Until then,
P3-2 and P3-4 must remain unchecked and the goal cannot truthfully be marked
complete.
