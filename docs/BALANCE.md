# Difficulty and bot baseline

Last calibrated: 2026-08-14

The balance bot uses the real journey links, recruit rules, town-only
specializations, castle upgrades, combat engine, match-3 board, legal adjacent
swaps, Flare/Tide/Bloom casts, and each recruited hero's named active ability.
It does not read hidden information or cast a tactic without producing a legal
board move. Hero actives are attempted only at the profile's human-scale
decision interval and pass through the same cooldown command as the UI.

The previous default curve was too punishing: across 60 seeded runs, a novice
bot completed the normal expedition 0% of the time and the normal-profile bot
completed it 22% of the time. After the accessibility pass, a 120-run sample
produced:

| Difficulty | Novice | Normal | Expert |
| --- | ---: | ---: | ---: |
| Easy | 43% | 91% | 100% |
| Normal | 19% | 86% | 100% |
| Hard | 1% | 45% | 100% |

After the Act 2 route policy was added, the required 60-seed first-expedition
gate produced the following latest completion rates without changing the Act 1
enemy curve:

| Difficulty | Novice | Normal | Expert |
| --- | ---: | ---: | ---: |
| Easy | 28% | 90% | 100% |
| Normal | 22% | 88% | 100% |
| Hard | 0% | 52% | 100% |

This baseline deliberately measures the first expedition so it remains
comparable with the stored medians. The separate 60-seed, full two-chapter run
now exercises the market-route monster blueprint through the same public
command used by the player:

| Difficulty | Profile | Reached Act 2 | Completed Act 2 | Mean blueprint casts |
| --- | --- | ---: | ---: | ---: |
| Easy | Novice | 28% | 3% | 0.5 |
| Easy | Normal | 90% | 83% | 8.7 |
| Easy | Expert | 100% | 100% | 10.1 |
| Normal | Novice | 22% | 2% | 0.2 |
| Normal | Normal | 88% | 62% | 8.2 |
| Normal | Expert | 100% | 100% | 10.4 |
| Hard | Novice | 0% | 0% | 0.0 |
| Hard | Normal | 52% | 5% | 3.1 |
| Hard | Expert | 100% | 98% | 10.9 |

The Act 2 encounter threats were calibrated from `13/16/19` to `12/14/16` for
Corrector Hunt, Correction Gates, and Manuscript Core. This preserves the
opt-in Hard wall while bringing the engaged Normal profile above the 35% full
campaign floor. `npm.cmd run campaign:balance:check` enforces the release
profiles; use `node scripts/campaign-balance-check.mjs 60` for the full audit.

The intent is that Easy teaches and forgives, Normal lets an engaged first-time
player finish the authored expedition, and Hard remains the opt-in pressure
test. Median progress and minimum completion rates are both enforced by
`scripts/balance-baseline.json`.

GitHub Actions runs the full deterministic, storage, and 60-run balance gates
every day at 06:17 KST and on manual dispatch. Any gameplay-number or bot-policy
change must also run the same gates locally before commit.
