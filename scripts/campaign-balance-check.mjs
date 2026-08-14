import assert from 'node:assert/strict';
import { runProfile } from './balance-bot.mjs';

const runs = Number(process.argv[2]) || 20;
const difficulties = ['easy', 'normal', 'hard'];
const profiles = ['초보', '보통', '고수'];
let expertBlueprints = 0;
const completionMins = {
  'easy/보통': .60,
  'normal/보통': .35,
  'normal/고수': .85,
  'hard/고수': .75,
};

console.log(`\n=== two-chapter campaign bot (${runs} seeds per cell) ===\n`);
for (const difficulty of difficulties) {
  for (const profile of profiles) {
    const result = runProfile(profile, difficulty, runs, { chapterCap: 2, waveCap: 40 });
    assert.ok(Number.isFinite(result.survivedRate));
    assert.ok(Number.isFinite(result.reachedAct2Rate));
    assert.ok(Number.isFinite(Number(result.blueprintMean)));
    if (profile === '고수') expertBlueprints += Number(result.blueprintMean);
    const minimum = completionMins[`${difficulty}/${profile}`];
    if (minimum != null) assert.ok(result.survivedRate >= minimum,
      `${difficulty}/${profile} two-chapter completion ${result.survivedPct} must stay above ${minimum * 100}%`);
    console.log(`[${difficulty}/${profile}] 2막 진입 ${result.reachedAct2Pct} · 완주 ${result.survivedPct} · 청사진 평균 ${result.blueprintMean}회 · 종료 ${JSON.stringify(result.nodeCounts)}`);
  }
  console.log('');
}

assert.ok(expertBlueprints > 0, 'expert campaign bots must exercise the public market blueprint command');
console.log('✅ two-chapter campaign route and monster-blueprint bot checks passed.');
