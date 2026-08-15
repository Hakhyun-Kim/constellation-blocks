import assert from 'node:assert/strict';
import {
  PLAYTEST_STORAGE_KEY,
  createLocalPlaytestLog,
  createSessionMeter,
  formatPlayMinutes,
} from '../src/app/session-metrics.js';

let time = 0;
let epoch = Date.UTC(2026, 7, 14, 0, 0, 0);
const meter = createSessionMeter({
  mode: 'campaign', difficulty: 'normal', experience: 'novice', clock: () => time, epoch: () => epoch,
});
meter.observe({ active: true, phase: 'story', chapter: 'dawn-road', node: 'gate', wave: 1 });
time += 1200;
meter.observe({ active: true, phase: 'wave', chapter: 'dawn-road', node: 'meadow', wave: 1 });
meter.action('waveStarts');
meter.action('blockPlacements', 3);
time += 2800;
meter.checkpoint('first-defense', { chapter: 'dawn-road', node: 'meadow', wave: 1 });
time += 600;
meter.observe({ active: false, phase: 'menu', chapter: 'dawn-road', node: 'meadow', wave: 2 });
time += 5000;
epoch += time;
const result = meter.finish('defeat', { chapter: 'dawn-road', node: 'meadow', wave: 2 });

assert.equal(result.elapsedMs, 9600);
assert.equal(result.activeMs, 4600);
assert.equal(result.startKind, 'new');
assert.equal(result.experience, 'novice');
assert.deepEqual(result.phaseMs, { story: 1200, wave: 3400 });
assert.equal(result.actions.waveStarts, 1);
assert.equal(result.actions.blockPlacements, 3);
assert.equal(result.checkpoints['first-defense'].activeMs, 4000);
assert.equal(result.outcome, 'defeat');
assert.equal(meter.finish('duplicate'), null);
assert.equal(formatPlayMinutes(900000), '15.0분');

const memory = new Map();
const storage = {
  getItem: (key) => memory.get(key) ?? null,
  setItem: (key, value) => memory.set(key, value),
};
const log = createLocalPlaytestLog(storage, { limit: 2, now: () => epoch });
const first = log.append(result);
const second = log.append({ ...result, outcome: 'restart' });
const third = log.append({ ...result, outcome: 'campaign-complete' });
assert.equal(first.sequence, 1);
assert.equal(second.sequence, 2);
assert.equal(third.sequence, 3);
assert.deepEqual(log.records().map((entry) => entry.sequence), [2, 3]);
assert.equal(log.export().sessions.length, 2);
assert.match(log.export().privacy, /no network telemetry/i);
assert.equal(log.export().evidence.qualification, 'unverified-local');
assert.equal(log.export().analysis.summary.evidence.participantCount, null);
assert.equal(log.export().analysis.earlyAccess.status, 'insufficient-evidence');
assert.ok(memory.has(PLAYTEST_STORAGE_KEY));

const blockedLog = createLocalPlaytestLog({
  getItem: () => null,
  setItem: () => { throw new Error('storage blocked'); },
});
assert.equal(blockedLog.append(result), null);
assert.equal(blockedLog.clear(), false);

console.log('✅ local-only active/wall/phase timing, actions, checkpoints, retry sequence, and bounded export passed.');
