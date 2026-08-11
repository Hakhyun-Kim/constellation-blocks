import assert from 'node:assert/strict';
import {
  VILLAGE_BOUNDS,
  VILLAGE_BUILDINGS,
  VILLAGE_FACILITY_SPOTS,
  VILLAGE_RECRUITER_SPOTS,
  VILLAGE_START,
  isNearVillageTarget,
  villageWalkPoint,
} from '../src/app/village-layout.js';

const test = (name, run) => {
  run();
  console.log(`✅ village: ${name}`);
};

test('spawn is not already inside a facility radius', () => {
  for (const spot of Object.values(VILLAGE_FACILITY_SPOTS)) {
    assert.equal(isNearVillageTarget(VILLAGE_START, spot), false);
  }
});

test('walk points clamp to the plaza boundary', () => {
  const point = villageWalkPoint(VILLAGE_START, { x: 999, z: -999 });
  assert.equal(point.x, VILLAGE_BOUNDS.maxX);
  assert.equal(point.z, VILLAGE_BOUNDS.minZ);
});

test('a building blocks walking but a facility marker remains reachable', () => {
  const blocked = villageWalkPoint(VILLAGE_START, VILLAGE_BUILDINGS.shrine);
  assert.deepEqual(blocked, VILLAGE_START);
  const target = VILLAGE_FACILITY_SPOTS.shrine;
  const approach = villageWalkPoint(VILLAGE_START, target);
  assert.deepEqual(approach, target);
  assert.equal(isNearVillageTarget(approach, target), true);
});

test('recruit NPCs have independent plaza locations', () => {
  assert.notDeepEqual(VILLAGE_RECRUITER_SPOTS.doyun, VILLAGE_RECRUITER_SPOTS.sera);
  assert.equal(isNearVillageTarget(VILLAGE_RECRUITER_SPOTS.doyun, VILLAGE_RECRUITER_SPOTS.sera), false);
});

console.log('Village presentation checks passed.');
