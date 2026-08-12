import assert from 'node:assert/strict';
import {
  VILLAGE_BOUNDS,
  VILLAGE_BUILDINGS,
  VILLAGE_FACILITY_SPOTS,
  VILLAGE_RECRUITER_SPOTS,
  VILLAGE_START,
  advanceVillage,
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

test('diagonal movement slides along a blocked building edge', () => {
  const start = { x: -2.5, z: 2.4 };
  const next = villageWalkPoint(start, { x: -1.7, z: 1.6 });
  assert.equal(next.x, start.x);
  assert.equal(next.z, 1.6);
});

test('continuous movement normalizes diagonals and preserves facing', () => {
  const next = advanceVillage(VILLAGE_START, { x: 1, z: -1 }, .05);
  const distance = Math.hypot(next.x - VILLAGE_START.x, next.z - VILLAGE_START.z);
  assert.ok(Math.abs(distance - 6.5 * .05) < 1e-9);
  assert.ok(Math.abs(next.dirX - Math.SQRT1_2) < 1e-9);
  const stopped = advanceVillage(next, { x: 0, z: 0 }, .05);
  assert.equal(stopped.moving, false);
  assert.equal(stopped.dirX, next.dirX);
  assert.equal(stopped.dirZ, next.dirZ);
});

test('recruit NPCs have independent plaza locations', () => {
  assert.notDeepEqual(VILLAGE_RECRUITER_SPOTS.doyun, VILLAGE_RECRUITER_SPOTS.sera);
  assert.equal(isNearVillageTarget(VILLAGE_RECRUITER_SPOTS.doyun, VILLAGE_RECRUITER_SPOTS.sera), false);
});

console.log('Village presentation checks passed.');
