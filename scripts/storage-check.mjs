import assert from 'node:assert/strict';

class MemoryStorage {
  constructor(values = {}) { this.values = new Map(Object.entries(values)); }
  getItem(name) { return this.values.has(name) ? this.values.get(name) : null; }
  setItem(name, value) { this.values.set(name, String(value)); }
  removeItem(name) { this.values.delete(name); }
}

globalThis.localStorage = new MemoryStorage({
  mathdef_best_easy: '9',
  mathdef_meta: '{"rank":2}',
  mathdef_mathlog: '{"old":true}',
  mathdef_mute_sfx: '1',
  mathdef_mute_bgm: '0',
});

const token = `?check=${Date.now()}`;
const { store } = await import(`../src/app/store.js${token}`);
const sfx = await import(`../src/sfx.js${token}`);

assert.equal(store.best('easy'), 9, 'legacy best score migrates once');
assert.deepEqual(store.meta, { rank: 2 }, 'legacy meta migrates once');
assert.equal(localStorage.getItem('mathdef_best_easy'), null, 'legacy best score is removed');
assert.equal(localStorage.getItem('mathdef_mathlog'), null, 'former math log is removed');
assert.equal(sfx.isSfxMuted(), true, 'legacy SFX preference migrates');
assert.equal(sfx.isMusicMuted(), false, 'legacy music preference migrates');
assert.equal(localStorage.getItem('constellation-defense.audio.sfx'), '1');
assert.equal(localStorage.getItem('constellation-defense.audio.music'), '0');
assert.equal(localStorage.getItem('mathdef_mute_sfx'), null, 'legacy SFX key is removed');
assert.equal(localStorage.getItem('mathdef_mute_bgm'), null, 'legacy music key is removed');

sfx.toggleAll();
assert.equal(localStorage.getItem('constellation-defense.audio.sfx'), '1', 'audio toggles write the new key');
assert.equal(localStorage.getItem('constellation-defense.audio.music'), '1', 'audio toggles write the new key');

assert.equal(store.effectsReduced, null, 'effect intensity is unset until the player chooses');
store.effectsReduced = true;
assert.equal(store.effectsReduced, true, 'reduced effects preference persists');
store.effectsReduced = false;
assert.equal(store.effectsReduced, false, 'lively effects preference persists');

assert.deepEqual(store.keyBindings, {}, 'key bindings start empty and are normalized by the preference layer');
store.keyBindings = { spell: 'KeyZ' };
assert.deepEqual(store.keyBindings, { spell: 'KeyZ' }, 'key bindings persist as device preferences');
assert.equal(store.language, 'ko', 'Korean is the default locale');
store.language = 'en';
assert.equal(store.language, 'en', 'supported locale persists');
store.language = 'invalid';
assert.equal(store.language, 'ko', 'unsupported locales fall back to Korean');

console.log('Storage migration checks passed.');
