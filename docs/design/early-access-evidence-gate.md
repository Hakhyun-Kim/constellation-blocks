# Early Access evidence gate

Updated: 2026-08-14

## Current decision

**Hold the current two-chapter campaign plus weekly challenge as the demo scope.**
Do not begin Act 3, PvP, monetization, a large inventory, or a second core combat
system yet.

This is an evidence hold, not a claim that the current amount is ideal. Human
samples remain 0 as of 2026-08-14. Bot balance runs, Codex browser checks, and
desktop smoke runs are QA evidence only and must never be counted as players.

## What the export now answers

The local 📊 export keeps the raw version-1 sessions and adds a deterministic
analysis block. It reports campaign and weekly values separately:

- attempts, completions, defeats, voluntary/flow exits, and retry starts;
- completion, exit, retry, and target-duration rates;
- p25, median, and p75 active minutes for completed and all attempts;
- first-defense, Act 1 completion, and Act 2 start conversion;
- actions per active minute and outcome counts;
- linked and unlinked retry records, invalid records excluded from analysis;
- a conservative Early Access scope recommendation.

The in-game export deliberately sets participant count to `null` and marks the
evidence `unverified-local`. A device cannot honestly infer how many people used
it. Only the facilitator can qualify a run as human under the duration protocol.

## Aggregate human exports

Keep one JSON file per participant where possible, then run:

```powershell
npm.cmd run playtest:report -- player-a.json player-b.json player-c.json player-d.json player-e.json
```

The command treats the number of files as the participant count. If files and
people are not one-to-one, state the verified count explicitly:

```powershell
npm.cmd run playtest:report -- batch-1.json batch-2.json --participants=5
```

Add `--json` for a machine-readable result. Do not put participant names, email,
device fingerprints, or free-form interview answers into the runtime session
records. Keep qualitative notes separately and publish only an anonymized
summary.

## Minimum evidence

No content recommendation is allowed until all of these are true:

- at least 5 verified human participants;
- at least 5 campaign attempts and 5 weekly attempts;
- at least 3 completed sessions in each mode;
- campaign and weekly results kept separate;
- the same build/commit and protocol conditions recorded for the cohort.

The preferred cohort still spans novice, regular, and expert match-3/tower
defense familiarity. A five-person minimum is a direction check, not statistical
proof; a Steam demo decision should repeat the cohort after any material pacing
change.

## Scope branches

1. If campaign completion is below 60%, campaign completion median exceeds 40
   minutes, or weekly median exceeds 15 minutes, freeze expansion and shorten or
   ease the current experience.
2. If campaign median is below 25 minutes and overall retry is at least 35%, add
   at most one authored region or encounter family without a new core system,
   then re-measure.
3. If duration is short but retry intent is weak, improve route, build, and
   weekly variation before adding map length.
4. If duration is inside target but overall retry is below 25%, prove replay
   value before Early Access expansion.
5. If duration, completion, and retry pass together, use the two chapters plus
   weekly challenge as the Early Access base and add later content one measured
   region at a time.

These branches intentionally prevent “more content” from masking a difficult
opening, long dead time, weak build variety, or unclear reasons to retry.

## What remains human-only

The tool cannot decide whether a participant understood the first match, where
they felt lost, whether they wanted a different route/build, or why they would
return. Collect the four questions in the duration protocol immediately after
play. The quantitative gate chooses the safe amount of content; the short
interview explains what to change inside that amount.
