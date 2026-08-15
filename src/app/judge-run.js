import { GRID, createEmptyBoard, findClears, resolvePlacement } from '../blocks/board.js';

/* The judge route is an authored presentation state, not a different ruleset.
 * Its opening still goes through the normal place-a-piece and cast paths. */
const openingCells = () => {
  const cells = createEmptyBoard();
  /* 가운데 길(3열)만 두 칸 남겨 둔다. 첫 배치가 곧 첫 전술이 되도록. */
  for (let row = 0; row < 6; row++) cells[row * GRID + 3] = 'flare';
  for (let row = 0; row < 3; row++) cells[row * GRID + 2] = 'tide';
  for (let row = 5; row < 8; row++) cells[row * GRID + 6] = 'bloom';
  return cells;
};

export const JUDGE_OPENING = Object.freeze({
  cells: Object.freeze(openingCells()),
  tray: Object.freeze([
    Object.freeze({ piece: 'duoV', type: 'flare' }),
    Object.freeze({ piece: 'square', type: 'tide' }),
    Object.freeze({ piece: 'tri', type: 'bloom' }),
  ]),
  slot: 0,
  row: 6,
  col: 3,
  lane: 1,
  kind: 'flare',
});

export function judgeOpeningClear() {
  const opening = JUDGE_OPENING;
  const before = findClears(opening.cells);
  if (before.rows.length || before.cols.length) return null;
  const result = resolvePlacement(
    [...opening.cells],
    opening.tray.map((entry) => ({ ...entry })),
    opening.slot, opening.row, opening.col,
  );
  if (!result.ok || result.lines !== 1) return null;
  const command = result.commands[0];
  return command && command.route === opening.lane && command.kind === opening.kind
    ? { command, commands: result.commands, lines: result.lines }
    : null;
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
