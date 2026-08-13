import assert from 'node:assert/strict';
import { ART_PILOT_REGION, enemyPilotSlot, heroPilotSlot, landmarkPilotSlot } from '../src/gfx/art-pilot.js';

assert.equal(heroPilotSlot(ART_PILOT_REGION, { heroKey: 'arin' })?.id, 'quaternius-warrior');
assert.equal(heroPilotSlot(ART_PILOT_REGION, { heroKey: 'luna' }), null);
assert.equal(heroPilotSlot('ember-gate', { heroKey: 'arin' }), null);

assert.equal(enemyPilotSlot(ART_PILOT_REGION, { type: 'goblin' })?.id, 'quaternius-green-blob');
assert.equal(enemyPilotSlot(ART_PILOT_REGION, { type: 'orc' })?.id, 'quaternius-demon');
assert.equal(enemyPilotSlot(ART_PILOT_REGION, { type: 'ogrelord', midBoss: true })?.id, 'quaternius-yeti');
assert.equal(enemyPilotSlot(ART_PILOT_REGION, { type: 'boss', boss: true }), null);
assert.equal(enemyPilotSlot('ember-gate', { type: 'goblin' }), null);

assert.deepEqual(Object.values(landmarkPilotSlot(ART_PILOT_REGION)), [
  'quaternius-gate-wall',
  'quaternius-gate-wall-straight',
  'quaternius-gate-door',
  'quaternius-gate-tower',
]);
assert.equal(landmarkPilotSlot('ember-gate'), null);

console.log('✅ 푸른 초원 아트 슬롯 11개 결정적 검사 통과');
