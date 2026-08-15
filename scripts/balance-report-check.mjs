import assert from 'node:assert/strict';
import * as E from '../src/engine.js';
import * as Bot from '../src/bot.js';
import { createEmptyBoard, drawTray } from '../src/blocks/board.js';
import { TACTIC_POLICIES, choosePolicyPlacement, playRun } from './balance-bot.mjs';

assert.deepEqual(TACTIC_POLICIES, ['none', 'random', 'threat']);

const state = E.createGame({ rng: Bot.mulberry32(17), difficulty: 'normal' });
state.phase = 'wave';
const board = createEmptyBoard();
const tray = drawTray(state.rng, board);
const legalMoves = Bot.listBlockMoves(board, tray);
const profile = { tacticUse: 1, tacticSloppy: 0 };
const sameMove = (a, b) => a.slot === b.slot && a.row === b.row && a.col === b.col;

assert.ok(legalMoves.length > 0, 'an opening board exposes a legal placement');
assert.equal(choosePolicyPlacement('none', state, board, tray, profile, state.rng, 0, legalMoves), null,
  'none policy never places');
const randomMove = choosePolicyPlacement('random', state, board, tray, profile, state.rng, 0, legalMoves);
assert.ok(legalMoves.some(move => sameMove(move, randomMove)), 'random policy chooses a legal placement');
const threatMove = choosePolicyPlacement('threat', state, board, tray, profile, state.rng, 0, legalMoves);
assert.ok(legalMoves.some(move => sameMove(move, threatMove)), 'threat policy chooses a legal placement');

const noTactics = playRun('보통', 'normal', 13, { waveCap: 6, tacticPolicy: 'none', trace: true });
assert.equal(noTactics.tactics, 0, 'none policy cannot cast tactics');
assert.ok(noTactics.trace.every(entry => !entry.place), 'none policy records decisions without placements');

const traced = playRun('고수', 'easy', 13, { waveCap: 6, tacticPolicy: 'threat', trace: true });
assert.ok(traced.trace.length > 0, 'traced run records tactical decision windows');
for (const decision of traced.trace) {
  assert.ok(Number.isInteger(decision.placements) && decision.placements > 0, 'trace records current legal options');
  assert.ok(Number.isFinite(decision.castleHp), 'trace records current castle health');
  assert.equal(decision.lanePressure.length, 3, 'trace records all three lane pressures');
  for (const cast of decision.casts || []) {
    assert.ok(['flare', 'tide', 'bloom'].includes(cast.kind), 'trace records tactic kind');
    assert.ok(cast.route >= 0 && cast.route <= 2, 'trace records target lane');
    assert.ok(cast.size >= 3 && cast.size <= 5, 'trace clamps the tactic tier');
    assert.ok(['row', 'col'].includes(cast.axis), 'trace records which line cast the tactic');
  }
}

console.log('Balance report checks passed.');
