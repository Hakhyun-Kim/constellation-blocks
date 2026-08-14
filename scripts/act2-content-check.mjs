import assert from 'node:assert/strict';
import * as D from '../src/data.js';
import { REGION_THEMES, RegionScenery } from '../src/gfx/regions.js';

const chapter = D.JOURNEY_CHAPTERS.find((entry) => entry.id === 'beyond-page');
assert.ok(chapter, 'Act 2 chapter must be registered');
assert.equal(chapter.nodes.length, 8, 'Act 2 promises exactly eight map nodes');

const ids = new Set(chapter.nodes.map((node) => node.id));
assert.equal(ids.size, chapter.nodes.length, 'Act 2 node ids must be unique');
for (const node of chapter.nodes) {
  for (const next of node.next) assert.ok(ids.has(next), `${node.id} links to known node ${next}`);
}

const reached = new Set();
const queue = [chapter.start];
while (queue.length) {
  const id = queue.shift();
  if (reached.has(id)) continue;
  reached.add(id);
  const node = chapter.nodes.find((entry) => entry.id === id);
  queue.push(...node.next);
}
assert.equal(reached.size, chapter.nodes.length, 'all eight Act 2 nodes are reachable');

const regions = new Set(chapter.nodes.map((node) => node.region).filter(Boolean));
assert.deepEqual([...regions].sort(), ['ashen-margin', 'manuscript-core', 'neon-ruins']);
for (const region of regions) {
  assert.ok(REGION_THEMES[region], `${region} has a renderer theme`);
  assert.ok(D.REGION_BOSS_TYPES[region], `${region} has a boss mapping`);
}
assert.ok([...regions].every((region) => REGION_THEMES[region].grass === false), 'Act 2 regions must not inherit the verdant grass field');

const noteIds = chapter.nodes.map((node) => node.annotation?.id).filter(Boolean);
assert.ok(noteIds.length >= 5 && new Set(noteIds).size === noteIds.length, 'margin note ids are unique');
const fork = chapter.nodes.find((node) => node.id === 'alignment-hub');
assert.deepEqual(fork.choices.map((choice) => choice.key).sort(), ['guild', 'market']);
assert.ok(chapter.nodes.find((node) => node.id === 'refugee-station')?.refugeeStation, 'refugee station state is declared');

const fakeScene = { add() {} };
const scenery = new RegionScenery(fakeScene);
for (const region of regions) {
  scenery.setTheme(region);
  assert.equal(Object.values(scenery.groups).filter((group) => group.visible).length, 1, `${region} selects one scenery group`);
  assert.equal(scenery.groups[region].visible, true, `${region} scenery exists`);
}
scenery.frame(1.25);

console.log('✅ Act 2 eight-node graph, notes, fork, refugee state, and three region themes passed.');
