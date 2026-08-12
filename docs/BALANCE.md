# Difficulty and bot baseline

Last calibrated: 2026-08-13

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

After named hero actives were added, the required 60-seed gate produced the
following latest completion rates without changing the enemy curve:

| Difficulty | Novice | Normal | Expert |
| --- | ---: | ---: | ---: |
| Easy | 52% | 95% | 100% |
| Normal | 17% | 93% | 100% |
| Hard | 0% | 48% | 100% |

The intent is that Easy teaches and forgives, Normal lets an engaged first-time
player finish the authored expedition, and Hard remains the opt-in pressure
test. Median progress and minimum completion rates are both enforced by
`scripts/balance-baseline.json`.

GitHub Actions runs the full deterministic, storage, and 60-run balance gates
every day at 06:17 KST and on manual dispatch. Any gameplay-number or bot-policy
change must also run the same gates locally before commit.
