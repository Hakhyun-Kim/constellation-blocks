import assert from 'node:assert/strict';
import {
  AUTO_PHASE_DELAY,
  advanceAutoPhase,
  autoPhaseKey,
  createAutoPhaseClock,
} from '../src/app/phase-flow.js';

const test = (name, run) => {
  run();
  console.log(`✅ phase flow: ${name}`);
};

test('the first defense remains a deliberate player start', () => {
  assert.equal(autoPhaseKey({ phase: 'prep', wave: 1 }), null);
  assert.equal(autoPhaseKey({ phase: 'prep', wave: 4, journey: { activeBattle: 'gate', wavesInBattle: 0 } }), null);
});

test('a completed defense arms the next phase countdown', () => {
  assert.equal(autoPhaseKey({ phase: 'prep', wave: 2 }), 'wave:0:2');
  assert.equal(autoPhaseKey({ phase: 'prep', wave: 4, journey: { activeBattle: 'meadow', wavesInBattle: 1 } }), 'journey:meadow:1');
});

test('map, combat, and game-over states never auto-advance', () => {
  for (const phase of ['journey', 'wave', 'over']) {
    assert.equal(autoPhaseKey({ phase, wave: 8 }), null);
  }
});

test('the clock pauses behind player-facing overlays', () => {
  const state = { phase: 'prep', wave: 2 };
  const armed = advanceAutoPhase(createAutoPhaseClock(), state, 1);
  const paused = advanceAutoPhase(armed, state, 99, true);
  assert.equal(paused.remaining, AUTO_PHASE_DELAY - 1);
  assert.equal(paused.ready, false);
});

test('the clock becomes ready once and resets for a different phase', () => {
  const state = { phase: 'prep', wave: 2 };
  const armed = advanceAutoPhase(createAutoPhaseClock(), state, AUTO_PHASE_DELAY);
  assert.equal(armed.ready, true);
  assert.equal(armed.remaining, 0);
  const next = advanceAutoPhase(armed, { phase: 'prep', wave: 3 }, .5);
  assert.equal(next.ready, false);
  assert.equal(next.remaining, AUTO_PHASE_DELAY - .5);
});

console.log('Automatic phase-flow checks passed.');
