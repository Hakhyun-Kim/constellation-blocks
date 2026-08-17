import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import {
  ART_PILOT_REGION,
  ART_REGIONS,
  enemyPilotSlot,
  heroPilotSlot,
  landmarkPilotSlot,
  supportsArtRegion,
} from '../src/gfx/art-pilot.js';

const HERO_ASSETS = Object.freeze({
  arin: 'quaternius-warrior',
  luna: 'quaternius-wizard',
  doyun: 'quaternius-monk',
  sera: 'quaternius-ranger',
  yuna: 'quaternius-cleric',
});
const manifest = JSON.parse(readFileSync(new URL('../assets/manifest.json', import.meta.url), 'utf8'));
const assets = new Map(manifest.assets.map((asset) => [asset.id, asset]));
const selectedAssets = new Set();

assert.equal(ART_REGIONS.length, 5);
assert.equal(new Set(ART_REGIONS).size, ART_REGIONS.length);
for (const region of ART_REGIONS) {
  assert.equal(supportsArtRegion(region), true);
  for (const [heroKey, asset] of Object.entries(HERO_ASSETS)) {
    assert.equal(heroPilotSlot(region, { heroKey })?.id, asset);
    selectedAssets.add(asset);
  }
  selectedAssets.add(enemyPilotSlot(region, { type: 'goblin' })?.id);
  selectedAssets.add(enemyPilotSlot(region, { type: 'ogrelord', midBoss: true })?.id);
  selectedAssets.add(enemyPilotSlot(region, { type: 'boss', boss: true })?.id);
}

for (const id of selectedAssets) assert.equal(assets.get(id)?.type, 'model', `${id} must be registered as a model`);
/* 영웅 GLB는 하나도 선로딩하지 않는다. 아린·루나는 첫 화면에 바로 서지만 그
 * 둘만 4MB라, 선로딩하면 첫 입력까지 그만큼 기다린다. 다른 세 영웅과 같은
 * 경로로 필요할 때 받고, 도착 전에는 절차형 모델이 그 자리를 지킨다. */
for (const id of Object.values(HERO_ASSETS)) {
  assert.equal(assets.get(id).preload, false, `${id} must stream in behind the procedural hero`);
}

assert.equal(heroPilotSlot('unknown', { heroKey: 'arin' }), null);
assert.equal(heroPilotSlot(ART_PILOT_REGION, { heroKey: 'unknown' }), null);
assert.equal(enemyPilotSlot('unknown', { type: 'goblin' }), null);
assert.equal(enemyPilotSlot('ember-gate', { type: 'goblin' })?.id, 'quaternius-orc');
assert.equal(enemyPilotSlot('neon-ruins', { type: 'boss', boss: true })?.id, 'quaternius-alien');
assert.equal(enemyPilotSlot('ashen-margin', { type: 'ogrelord', midBoss: true })?.id, 'quaternius-mushroom-king');
assert.equal(enemyPilotSlot('manuscript-core', { type: 'boss2', boss: true })?.id, 'quaternius-blue-demon');

assert.deepEqual(Object.values(landmarkPilotSlot(ART_PILOT_REGION)), [
  'quaternius-gate-wall',
  'quaternius-gate-wall-straight',
  'quaternius-gate-door',
  'quaternius-gate-tower',
]);
assert.equal(landmarkPilotSlot('ember-gate'), null);

console.log('✅ 5 heroes × 5 regions and regional monster/boss art slots passed.');
