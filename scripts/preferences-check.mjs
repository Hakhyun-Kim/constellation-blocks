import assert from 'node:assert/strict';
import {
  KEY_ACTIONS,
  actionForCode,
  defaultBindings,
  isBindableCode,
  keyCodeLabel,
  normalizeBindings,
  rebindAction,
} from '../src/app/preferences.js';

const defaults = defaultBindings();
assert.equal(Object.keys(defaults).length, KEY_ACTIONS.length);
assert.equal(new Set(Object.values(defaults)).size, KEY_ACTIONS.length);
assert.equal(actionForCode(defaults, 'KeyA'), 'spell');
assert.equal(actionForCode(defaults, 'KeyG'), 'blueprint');

const rebound = rebindAction(defaults, 'spell', 'KeyG');
assert.equal(rebound.ok, true);
assert.equal(rebound.bindings.spell, 'KeyG');
assert.equal(rebound.bindings.blueprint, 'KeyA');
assert.equal(rebound.swappedAction, 'blueprint');
assert.equal(new Set(Object.values(rebound.bindings)).size, KEY_ACTIONS.length);

assert.equal(rebindAction(defaults, 'spell', 'Escape').reason, 'reserved');
assert.equal(rebindAction(defaults, 'missing', 'KeyZ').reason, 'action');
assert.equal(isBindableCode('KeyZ'), true);
assert.equal(isBindableCode('Space'), false);
assert.equal(keyCodeLabel('Digit7'), '7');
assert.equal(keyCodeLabel('Numpad4'), 'Num 4');

const repaired = normalizeBindings({ spell: 'KeyZ', ultimate: 'KeyZ', skills: 'Escape' });
assert.equal(repaired.spell, 'KeyZ');
assert.notEqual(repaired.ultimate, 'KeyZ');
assert.notEqual(repaired.skills, 'Escape');
assert.equal(new Set(Object.values(repaired)).size, KEY_ACTIONS.length);

console.log('✅ versioned preferences, physical-key lookup, reserved keys, conflict swapping, and repair passed.');
