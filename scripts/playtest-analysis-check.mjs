import assert from 'node:assert/strict';
import {
  evaluateEarlyAccessScope,
  formatPlaytestReport,
  summarizePlaytestSessions,
} from '../src/app/playtest-analysis.js';

const session = (mode, outcome, activeMinutes, sequence, extras = {}) => ({
  schemaVersion: 1,
  mode,
  outcome,
  activeMs: activeMinutes * 60000,
  elapsedMs: activeMinutes * 62000,
  sequence,
  startKind: 'new',
  retryOf: null,
  checkpoints: mode === 'campaign' ? {
    'first-defense-start': { activeMs: 1000 },
    'dawn-road-complete': { activeMs: 1000 },
    'act2-start': { activeMs: 1000 },
  } : { 'first-defense-start': { activeMs: 1000 }, 'dawn-road-complete': { activeMs: 1000 } },
  actions: { waveStarts: 7, tacticSwaps: 20, tacticCasts: 8 },
  ...extras,
});

const healthy = [
  session('campaign', 'campaign-complete', 25, 1),
  session('campaign', 'campaign-complete', 30, 2, { startKind: 'retry', retryOf: 1 }),
  session('campaign', 'campaign-complete', 35, 3),
  session('campaign', 'campaign-complete', 40, 4, { startKind: 'retry', retryOf: 3 }),
  session('campaign', 'defeat', 12, 5),
  session('weekly', 'weekly-complete', 10, 6),
  session('weekly', 'weekly-complete', 11, 7, { startKind: 'retry', retryOf: 6 }),
  session('weekly', 'weekly-complete', 12, 8),
  session('weekly', 'weekly-complete', 13, 9, { startKind: 'retry', retryOf: 8 }),
  session('weekly', 'weekly-complete', 14, 10),
  { schemaVersion: 99, mode: 'campaign', outcome: 'campaign-complete', activeMs: 1 },
];

const summary = summarizePlaytestSessions(healthy, { participantCount: 5 });
assert.equal(summary.evidence.validSessions, 10);
assert.equal(summary.evidence.excludedSessions, 1);
assert.equal(summary.evidence.linkedRetries, 4);
assert.equal(summary.campaign.attempts, 5);
assert.equal(summary.campaign.completed, 4);
assert.equal(summary.campaign.completionRate, 0.8);
assert.deepEqual(summary.campaign.completedActiveMinutes, { p25: 28.75, median: 32.5, p75: 36.25 });
assert.equal(summary.campaign.checkpointRate.act2Start, 1);
assert.equal(summary.weekly.completedWithinTargetRate, 1);
assert.equal(evaluateEarlyAccessScope(summary).recommendation, 'retain-two-chapter-early-access-base');

const unverified = summarizePlaytestSessions(healthy);
assert.equal(evaluateEarlyAccessScope(unverified).status, 'insufficient-evidence');
assert.ok(evaluateEarlyAccessScope(unverified).missing.includes('verified-participant-count'));

const strugglingSessions = [
  ...[1, 2, 3].map((n) => session('campaign', 'campaign-complete', 45 + n, n)),
  ...[4, 5].map((n) => session('campaign', 'defeat', 20, n)),
  ...[6, 7, 8].map((n) => session('weekly', 'weekly-complete', 16, n)),
  ...[9, 10].map((n) => session('weekly', 'abandon', 5, n)),
];
const struggling = summarizePlaytestSessions(strugglingSessions, { participantCount: 5 });
assert.equal(evaluateEarlyAccessScope(struggling).recommendation, 'shorten-and-ease-current-scope');

const shortEnthusiastic = healthy.map((entry) => entry.schemaVersion === 1 && entry.mode === 'campaign'
  ? { ...entry, activeMs: 20 * 60000 } : entry);
assert.equal(
  evaluateEarlyAccessScope(summarizePlaytestSessions(shortEnthusiastic, { participantCount: 5 })).recommendation,
  'add-one-region-without-a-new-core-system',
);

const report = formatPlaytestReport(summary);
assert.match(report, /Participants: 5/);
assert.match(report, /retain-two-chapter-early-access-base/);
assert.match(report, /campaign/);

console.log('✅ playtest aggregation, quantiles, conversion, retries, and Early Access evidence gate passed.');
