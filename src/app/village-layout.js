/* Shared, visual-only village geometry. Keeping this data pure lets the UI
 * and Three scene agree on where a building, NPC, and walkable space are. */

export const VILLAGE_START = Object.freeze({ x: 0, z: 8.8 });

export const VILLAGE_BOUNDS = Object.freeze({ minX: -10.5, maxX: 10.5, minZ: -9.6, maxZ: 9.2 });

export const VILLAGE_BUILDINGS = Object.freeze({
  forge: Object.freeze({ x: -6.4, z: 2.4, w: 1.85, d: 1.5 }),
  shrine: Object.freeze({ x: 0, z: 2.4, w: 1.95, d: 1.55 }),
  guild: Object.freeze({ x: 6.4, z: 2.4, w: 1.85, d: 1.5 }),
});

export const VILLAGE_FACILITY_SPOTS = Object.freeze({
  forge: Object.freeze({ x: -6.4, z: 4.25 }),
  shrine: Object.freeze({ x: 0, z: 4.25 }),
  guild: Object.freeze({ x: 6.4, z: 4.25 }),
});

export const VILLAGE_RECRUITER_SPOTS = Object.freeze({
  doyun: Object.freeze({ x: -5.6, z: -1.5, place: '수문 초소' }),
  sera: Object.freeze({ x: 5.6, z: -1.5, place: '전령 길드' }),
});

const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

export function villageWalkPoint(current, proposed) {
  const point = {
    x: clamp(proposed.x, VILLAGE_BOUNDS.minX, VILLAGE_BOUNDS.maxX),
    z: clamp(proposed.z, VILLAGE_BOUNDS.minZ, VILLAGE_BOUNDS.maxZ),
  };
  const blocked = Object.values(VILLAGE_BUILDINGS).some((building) =>
    Math.abs(point.x - building.x) < building.w && Math.abs(point.z - building.z) < building.d);
  return blocked ? { x: current.x, z: current.z } : point;
}

export function isNearVillageTarget(point, target, radius = 2.1) {
  const dx = point.x - target.x;
  const dz = point.z - target.z;
  return dx * dx + dz * dz <= radius * radius;
}
