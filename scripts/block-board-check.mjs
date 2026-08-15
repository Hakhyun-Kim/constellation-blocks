import * as Board from '../src/blocks/board.js';
import { blockTier, COMBO_BONUS_AT, TRAY_SIZE } from '../src/balance/blocks.js';
import { describeBlockMove } from '../src/demo.js';
import { JUDGE_OPENING, judgeOpeningClear, prepareJudgeWave } from '../src/app/judge-run.js';

let failures = 0;
function check(condition, message) {
  if (condition) return;
  failures++;
  console.error(`FAIL: ${message}`);
}

function mulberry32(seed) {
  return () => {
    let value = seed += 0x6D2B79F5;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

const empty = Board.createEmptyBoard();
check(empty.length === Board.GRID ** 2, 'the board is 8×8');
check(empty.every((cell) => cell === null), 'a new board starts empty');
check(Board.findClears(empty).rows.length === 0 && Board.findClears(empty).cols.length === 0,
  'an empty board clears nothing');

/* 조각 정의는 눈에 보이는 모양과 어긋나면 안 된다. */
for (const piece of Board.PIECES) {
  check(piece.cells.length === piece.size, `${piece.id} reports its own cell count`);
  check(piece.cells.every(([row, col]) => row >= 0 && col >= 0 && row < piece.rows && col < piece.cols),
    `${piece.id} stays inside its own bounding box`);
  check(piece.cells.some(([row]) => row === 0) && piece.cells.some(([, col]) => col === 0),
    `${piece.id} is anchored at its top-left corner`);
}
check(new Set(Board.PIECES.map((piece) => piece.id)).size === Board.PIECES.length, 'piece ids are unique');

/* 배치 규칙 */
const square = Board.pieceById('square');
check(Board.canPlace(empty, square, 0, 0), 'a piece fits on an empty board');
check(!Board.canPlace(empty, square, 7, 7), 'a piece may not hang off the board edge');
const placed = Board.placePiece(empty, square, 0, 0, 'flare');
check(empty[0] === null, 'placement does not mutate the source board');
check(placed[0] === 'flare' && placed[1] === 'flare' && placed[8] === 'flare' && placed[9] === 'flare',
  'placement fills exactly the piece cells');
check(!Board.canPlace(placed, square, 0, 0), 'a filled cell rejects a second piece');
check(Board.placePiece(placed, square, 0, 0, 'tide') === null, 'an illegal placement returns null');

/* 세로줄 = 한 길에 집중 */
const columnBoard = Board.createEmptyBoard();
for (let row = 0; row < 7; row++) columnBoard[Board.cellIndex(row, 3)] = 'flare';
const columnResult = Board.resolvePlacement(columnBoard, [{ piece: 'dot', type: 'flare' }], 0, 7, 3);
check(columnResult.ok && columnResult.lines === 1, 'a filled column clears one line');
check(columnResult.commands.length === 1, 'a column clear casts on a single lane');
check(columnResult.commands[0].route === 1 && columnResult.commands[0].kind === 'flare'
  && columnResult.commands[0].size === 3, 'a column clear targets its own lane at the base tier');
check(columnResult.cells.every((cell, index) => Board.cellCol(index) !== 3 || cell === null),
  'a cleared column is emptied');

/* 가로줄 = 세 길에 나눠서, 각 길은 자기 열의 색을 따른다 */
const rowBoard = Board.createEmptyBoard();
const rowColors = ['flare', 'flare', 'flare', 'tide', 'tide', 'bloom', 'bloom', null];
rowColors.forEach((type, col) => { if (type) rowBoard[Board.cellIndex(4, col)] = type; });
const rowResult = Board.resolvePlacement(rowBoard, [{ piece: 'dot', type: 'bloom' }], 0, 4, 7);
check(rowResult.ok && rowResult.lines === 1, 'a filled row clears one line');
check(rowResult.commands.length === 3, 'a row clear reaches all three lanes');
check(rowResult.commands.map((command) => command.kind).join(',') === 'flare,tide,bloom',
  'each lane follows the dominant colour of its own columns');
check(rowResult.commands.every((command) => command.size === 3),
  'a spread row clear stays at the base tier');
check(rowResult.commands.map((command) => command.route).join(',') === '0,1,2',
  'row commands are ordered left to right');

/* 동시에 여러 줄 = 더 높은 등급, 연속 정리 = 한 등급 더 */
check(blockTier(1) === 3 && blockTier(2) === 4 && blockTier(3) === 5, 'more lines mean a stronger tactic');
check(blockTier(1, COMBO_BONUS_AT) === 4, 'a clearing streak raises the tier by one');
check(blockTier(3, COMBO_BONUS_AT) === 5, 'the tier never exceeds the five-star table');

const crossBoard = Board.createEmptyBoard();
for (let col = 0; col < Board.GRID; col++) if (col !== 6) crossBoard[Board.cellIndex(2, col)] = 'tide';
for (let row = 0; row < Board.GRID; row++) if (row !== 2) crossBoard[Board.cellIndex(row, 6)] = 'tide';
const crossResult = Board.resolvePlacement(crossBoard, [{ piece: 'dot', type: 'tide' }], 0, 2, 6);
check(crossResult.lines === 2, 'one placement can complete a row and a column together');
check(crossResult.commands.some((command) => command.axis === 'col' && command.size === 4),
  'the focused column of a double clear is upgraded');
check(crossResult.commands.filter((command) => command.axis === 'row').every((command) => command.size === 3),
  'the spread row of a double clear stays one tier lower');

const comboResult = Board.resolvePlacement(columnBoard, [{ piece: 'dot', type: 'flare' }], 0, 7, 3,
  { combo: COMBO_BONUS_AT - 1 });
check(comboResult.commands[0].size === 4, 'the third clear in a row casts one tier higher');
check(comboResult.combo === COMBO_BONUS_AT, 'a clearing placement extends the streak');
const noClear = Board.resolvePlacement(empty, [{ piece: 'dot', type: 'flare' }], 0, 0, 0, { combo: 4 });
check(noClear.combo === 0, 'a placement without a clear breaks the streak');
check(noClear.commands.length === 0, 'a placement without a clear casts nothing');

/* 색이 섞인 줄은 가장 많은 색이 정한다 — 같은 수면 언제나 같은 답이 나와야 한다. */
const mixed = Board.createEmptyBoard();
['tide', 'tide', 'tide', 'flare', 'flare', 'flare', 'bloom', 'bloom']
  .forEach((type, col) => { mixed[Board.cellIndex(0, col)] = type; });
const tie = Board.dominantType(mixed, [0, 1, 2, 3, 4, 5, 6, 7]);
check(tie === 'flare', 'a tie is resolved by a fixed colour order, not by chance');

/* 트레이 — 사람이 손댈 수 없는 판을 주지 않는다 */
const random = mulberry32(20260814);
const tray = Board.drawTray(random, Board.createEmptyBoard());
check(tray.length === TRAY_SIZE, 'a tray holds three pieces');
check(tray.every((entry) => Board.pieceById(entry.piece) && Board.BLOCK_TYPES.includes(entry.type)),
  'every tray piece is a real shape with a real tactic colour');
check(Board.hasAnyPlacement(Board.createEmptyBoard(), tray), 'a fresh tray fits the board');

const nearlyFull = Board.createEmptyBoard().map((_, index) => (index < 60 ? 'flare' : null));
const tightTray = Board.drawTray(mulberry32(7), nearlyFull);
check(Board.hasAnyPlacement(nearlyFull, tightTray), 'a crowded board still receives a playable tray');

const full = Board.createEmptyBoard().map(() => 'flare');
check(!Board.hasAnyPlacement(full, Board.drawTray(mulberry32(9), full)), 'a full board admits no placement');
const relief = Board.breakDeadlock(full);
check(relief.cells.filter((cell) => cell === null).length === Board.GRID,
  'a deadlock clears exactly one row so the defense keeps running');
check(Array.from({ length: Board.GRID }, (_, col) => relief.cells[Board.cellIndex(relief.row, col)])
  .every((cell) => cell === null), 'the deadlock relief empties the row it reports');

/* 열거된 후보는 전부 실제로 놓을 수 있어야 한다 */
const moves = Board.legalPlacements(nearlyFull, tightTray);
check(moves.length > 0, 'a crowded board still exposes legal placements');
check(moves.every((move) => Board.canPlace(nearlyFull, Board.pieceById(move.piece), move.row, move.col)),
  'every enumerated placement is legal on the source board');
check(nearlyFull[0] === 'flare', 'enumerating placements does not mutate the source board');
check(Board.legalPlacements(Board.createEmptyBoard(), [{ piece: 'dot', type: 'flare' }]).length === 64,
  'a single cell can go anywhere on an empty board');

/* 관전 자막은 봇이 실제로 고른 수를 설명해야 한다 */
const columnMove = Board.legalPlacements(columnBoard, [{ piece: 'dot', type: 'flare' }])
  .find((move) => move.row === 7 && move.col === 3);
check(!!columnMove, 'the winning placement appears in the enumeration');
const described = describeBlockMove({
  ...columnMove,
  commands: Board.clearCommands(columnMove.cells, columnMove.clears, { combo: 1 }),
});
check(described === '🌌 1줄 정리 · 가운데 길 유성 3등급', `spectator copy reports the real clear (${described})`);
check(describeBlockMove({ piece: 'square', type: 'tide', row: 0, col: 0, lines: 0 })
  === '🧩 서리블록 4칸 · 1행 1열에 배치', 'spectator copy also reads a quiet placement');

/* 판정용 오프닝 */
const judge = judgeOpeningClear();
check(!!judge, 'judge opening starts clean and clears a line with its highlighted placement');
check(judge?.command.route === JUDGE_OPENING.lane && judge?.command.kind === JUDGE_OPENING.kind,
  'judge opening teaches a middle-lane flare');
check(judge?.commands.length === 1, 'judge opening teaches one focused cast, not a spread');
const judgeState = { pendingWave: [{ t: 1.2, type: 'slime', route: 0 }] };
check(prepareJudgeWave(judgeState), 'judge wave can author its first threat');
check(judgeState.pendingWave[0].route === JUDGE_OPENING.lane && judgeState.pendingWave[0].t === 0.15,
  'judge wave puts the first threat promptly on the taught lane');
check(judgeState.pendingWave[0].type === 'ogrelord',
  'judge wave keeps the taught target alive long enough for a first-time player to cast');

/* 열 → 방어로 매핑은 좌우 대칭이어야 한다 */
check(Board.LANE_COLS.flat().length === Board.GRID, 'every column belongs to exactly one lane');
check(Board.LANE_COLS[0].length === Board.LANE_COLS[2].length, 'the outer lanes are symmetric');
check([0, 1, 2, 3, 4, 5, 6, 7].map(Board.laneForCol).join(',') === '0,0,0,1,1,2,2,2',
  'columns map to lanes left, middle, right');

if (failures) process.exitCode = 1;
else console.log('Block board checks passed.');
