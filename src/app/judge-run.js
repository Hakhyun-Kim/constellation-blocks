import { findMatchGroups, swapCells } from '../tactics/board.js';

/* The judge route is an authored presentation state, not a different ruleset.
 * Its opening still goes through the normal adjacent-swap and cast paths. */
export const JUDGE_OPENING = Object.freeze({
  cells: Object.freeze([
    'flare', 'tide', 'bloom', 'bloom', 'flare', 'tide',
    'flare', 'tide', 'tide', 'flare', 'bloom', 'bloom',
    'tide', 'bloom', 'flare', 'flare', 'tide', 'flare',
    'bloom', 'flare', 'flare', 'bloom', 'tide', 'bloom',
    'bloom', 'flare', 'tide', 'bloom', 'flare', 'tide',
    'tide', 'bloom', 'flare', 'tide', 'bloom', 'bloom',
  ]),
  from: 3,
  to: 4,
  lane: 1,
  kind: 'flare',
  refill: Object.freeze(['flare', 'flare', 'tide']),
});

export function judgeOpeningMatch() {
  if (findMatchGroups(JUDGE_OPENING.cells).length) return null;
  const groups = findMatchGroups(swapCells(JUDGE_OPENING.cells, JUDGE_OPENING.from, JUDGE_OPENING.to));
  const group = groups.find((entry) => entry.length === 3);
  return group ? { group, kind: JUDGE_OPENING.kind, lane: JUDGE_OPENING.lane } : null;
}

export function prepareJudgeWave(state) {
  if (!state?.pendingWave?.length) return false;
  const first = state.pendingWave.find((entry) => !entry.warnOnly);
  if (!first) return false;
  first.route = JUDGE_OPENING.lane;
  first.t = 0.15;
  first.type = 'ogrelord';
  return true;
}
