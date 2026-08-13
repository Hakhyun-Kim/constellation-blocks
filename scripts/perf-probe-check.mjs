import assert from 'node:assert/strict';
import { summarizeFrameDurations } from '../src/app/perf-probe.js';

assert.deepEqual(summarizeFrameDurations([]), {
  frames: 0, avgFps: 0, avgFrameMs: 0, p95FrameMs: 0,
});
const steady = summarizeFrameDurations(Array(120).fill(1000 / 60));
assert.equal(steady.frames, 120);
assert.ok(Math.abs(steady.avgFps - 60) < 0.001);
assert.ok(Math.abs(steady.p95FrameMs - (1000 / 60)) < 0.001);
const spike = summarizeFrameDurations([...Array(95).fill(16), ...Array(5).fill(40)]);
assert.equal(spike.p95FrameMs, 16);
assert.ok(spike.avgFps < 62.5);

console.log('✅ 성능 probe 평균 FPS·p95 계산 통과');
