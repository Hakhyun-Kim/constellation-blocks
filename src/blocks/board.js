/* =====================================================
 * 별자리 블록 보드 — 순수 블록 퍼즐 규칙
 *
 * 이 모듈은 DOM·엔진·렌더러를 전혀 모른다. 8×8 판, 조각 모양, 놓을 수 있는지,
 * 가로·세로 줄이 찼는지, 지운 줄이 어느 방어로에 어떤 전술로 닿는지까지만 책임진다.
 *
 * ▸ 왜 블록 퍼즐인가 (3매치를 대신하며 남긴 설계 이유)
 *   3매치는 "지금 있는 판에서 답을 찾는" 놀이라 급할수록 눈이 바빠진다.
 *   블록은 반대로 **내가 판을 만든다**. 트레이의 세 조각을 어디에 둘지 고르는
 *   순간이 곧 "어느 길을 지킬까"가 되므로, 디펜스의 판단과 퍼즐의 판단이 하나가 된다.
 *
 * ▸ 규칙 요약
 *   · 판은 8×8, 중력 없음. 트레이의 세 조각을 빈칸에 놓는다(회전 없음).
 *   · 조각을 다 쓰면 새 세 개가 온다.
 *   · 가로줄/세로줄이 꽉 차면 지워지고, 그 줄이 전술 명령이 된다.
 *     세로줄 → 그 열이 속한 길 하나에 집중.  가로줄 → 세 길에 나눠서.
 *   · 어떤 전술인가는 지워진 칸의 **가장 많은 색**이 정한다.
 *     (flare 공격 · tide 감속 · bloom 회복) 그래서 색을 모아 두는 것이 곧 계획이다.
 *   · 어떤 조각도 못 놓으면 트레이를 다시 뽑고, 그래도 막히면 가장 찬 줄을
 *     전술 없이 정리한다 — 디펜스는 멈추지 않고, 대신 한 박자를 잃는다.
 * ===================================================== */
import {
  DEADLOCK_REDRAWS,
  PIECE_WEIGHTS,
  ROW_SPREAD_PENALTY,
  TRAY_SIZE,
  TYPE_WEIGHTS,
  blockTier,
} from '../balance/blocks.js';

export const GRID = 8;
export const BLOCK_TYPES = Object.freeze(['flare', 'tide', 'bloom']);

/* 열 → 방어로. 가운데 길이 두 열로 좁은 것은 의도다: 가장 짧고 위험한 길의
 * 전술은 더 벌기 어렵게 두되, 좌우는 대칭으로 남겨 판이 한쪽으로 기울지 않게 한다. */
export const LANE_COLS = Object.freeze([
  Object.freeze([0, 1, 2]),
  Object.freeze([3, 4]),
  Object.freeze([5, 6, 7]),
]);
export const laneForCol = (col) => (col <= 2 ? 0 : col <= 4 ? 1 : 2);

export const cellIndex = (row, col, size = GRID) => row * size + col;
export const cellRow = (index, size = GRID) => Math.floor(index / size);
export const cellCol = (index, size = GRID) => index % size;

/* 조각 목록 — 회전은 플레이어가 하지 않는다. 대신 회전 모양을 각각 별개 조각으로
 * 넣어 "지금 온 조각을 어디에 둘까"만 고민하게 한다. 초등 저학년도 규칙을
 * 한 문장으로 이해할 수 있어야 한다. */
const shape = (id, cells) => {
  const rows = Math.max(...cells.map(([row]) => row)) + 1;
  const cols = Math.max(...cells.map(([, col]) => col)) + 1;
  return Object.freeze({ id, cells: Object.freeze(cells.map(Object.freeze)), rows, cols, size: cells.length });
};

export const PIECES = Object.freeze([
  shape('dot', [[0, 0]]),
  shape('duo', [[0, 0], [0, 1]]),
  shape('duoV', [[0, 0], [1, 0]]),
  shape('tri', [[0, 0], [0, 1], [0, 2]]),
  shape('triV', [[0, 0], [1, 0], [2, 0]]),
  shape('quad', [[0, 0], [0, 1], [0, 2], [0, 3]]),
  shape('quadV', [[0, 0], [1, 0], [2, 0], [3, 0]]),
  shape('penta', [[0, 0], [0, 1], [0, 2], [0, 3], [0, 4]]),
  shape('pentaV', [[0, 0], [1, 0], [2, 0], [3, 0], [4, 0]]),
  shape('square', [[0, 0], [0, 1], [1, 0], [1, 1]]),
  shape('bigSquare', [[0, 0], [0, 1], [0, 2], [1, 0], [1, 1], [1, 2], [2, 0], [2, 1], [2, 2]]),
  shape('cornerNE', [[0, 0], [0, 1], [1, 1]]),
  shape('cornerSE', [[0, 1], [1, 0], [1, 1]]),
  shape('cornerSW', [[0, 0], [1, 0], [1, 1]]),
  shape('cornerNW', [[0, 0], [0, 1], [1, 0]]),
  shape('bigCornerNE', [[0, 0], [0, 1], [0, 2], [1, 2], [2, 2]]),
  shape('bigCornerSE', [[0, 2], [1, 2], [2, 0], [2, 1], [2, 2]]),
  shape('bigCornerSW', [[0, 0], [1, 0], [2, 0], [2, 1], [2, 2]]),
  shape('bigCornerNW', [[0, 0], [0, 1], [0, 2], [1, 0], [2, 0]]),
  shape('teeN', [[0, 0], [0, 1], [0, 2], [1, 1]]),
  shape('teeS', [[0, 1], [1, 0], [1, 1], [1, 2]]),
  shape('teeE', [[0, 0], [1, 0], [1, 1], [2, 0]]),
  shape('teeW', [[0, 1], [1, 0], [1, 1], [2, 1]]),
  shape('zigH', [[0, 1], [0, 2], [1, 0], [1, 1]]),
  shape('zigV', [[0, 0], [1, 0], [1, 1], [2, 1]]),
]);

const PIECE_BY_ID = new Map(PIECES.map((piece) => [piece.id, piece]));
export const pieceById = (id) => PIECE_BY_ID.get(id) || null;

export const createEmptyBoard = (size = GRID) => Array.from({ length: size * size }, () => null);

/* 가중 추첨. 넘겨받은 random()만 쓰므로 봇·테스트가 같은 시드로 같은 판을 만든다. */
function weightedPick(entries, random) {
  const total = entries.reduce((sum, [, weight]) => sum + weight, 0);
  let roll = random() * total;
  for (const [key, weight] of entries) {
    roll -= weight;
    if (roll < 0) return key;
  }
  return entries[entries.length - 1][0];
}

const PIECE_ENTRIES = PIECES.map((piece) => [piece.id, PIECE_WEIGHTS[piece.id] ?? 1]);
const TYPE_ENTRIES = BLOCK_TYPES.map((type) => [type, TYPE_WEIGHTS[type] ?? 1]);

export const randomPiece = (random) => ({
  piece: weightedPick(PIECE_ENTRIES, random),
  type: weightedPick(TYPE_ENTRIES, random),
});

/* 조각이 (row, col)을 왼쪽 위로 삼아 차지할 칸들. 판 밖이면 -1이 섞여 나온다. */
export function placementCells(piece, row, col, size = GRID) {
  const spec = typeof piece === 'string' ? pieceById(piece) : piece;
  if (!spec) return [];
  return spec.cells.map(([dr, dc]) => {
    const r = row + dr;
    const c = col + dc;
    return r >= 0 && r < size && c >= 0 && c < size ? cellIndex(r, c, size) : -1;
  });
}

export function canPlace(cells, piece, row, col, size = GRID) {
  const targets = placementCells(piece, row, col, size);
  if (!targets.length) return false;
  return targets.every((index) => index >= 0 && cells[index] == null);
}

/* 반환값은 새 배열이다. 화면 어댑터가 미리보기(ghost)를 만들 때 실제 판을 잃지 않는다. */
export function placePiece(cells, piece, row, col, type, size = GRID) {
  if (!canPlace(cells, piece, row, col, size)) return null;
  const next = [...cells];
  for (const index of placementCells(piece, row, col, size)) next[index] = type;
  return next;
}

export function findClears(cells, size = GRID) {
  const rows = [];
  const cols = [];
  for (let row = 0; row < size; row++) {
    let full = true;
    for (let col = 0; col < size && full; col++) if (cells[cellIndex(row, col, size)] == null) full = false;
    if (full) rows.push(row);
  }
  for (let col = 0; col < size; col++) {
    let full = true;
    for (let row = 0; row < size && full; row++) if (cells[cellIndex(row, col, size)] == null) full = false;
    if (full) cols.push(col);
  }
  return { rows, cols };
}

export const clearedCellIndices = ({ rows = [], cols = [] }, size = GRID) => {
  const hit = new Set();
  for (const row of rows) for (let col = 0; col < size; col++) hit.add(cellIndex(row, col, size));
  for (const col of cols) for (let row = 0; row < size; row++) hit.add(cellIndex(row, col, size));
  return [...hit];
};

export function applyClears(cells, clears, size = GRID) {
  const next = [...cells];
  for (const index of clearedCellIndices(clears, size)) next[index] = null;
  return next;
}

/* 같은 수면 BLOCK_TYPES 순서로 정한다 — 같은 판에서는 언제나 같은 결과가 나와야
 * 리플레이와 봇이 화면과 어긋나지 않는다. */
export function dominantType(cells, indices) {
  const count = new Map();
  for (const index of indices) {
    const type = cells[index];
    if (type) count.set(type, (count.get(type) || 0) + 1);
  }
  let best = null;
  let bestCount = 0;
  for (const type of BLOCK_TYPES) {
    const value = count.get(type) || 0;
    if (value > bestCount) { best = type; bestCount = value; }
  }
  return best;
}

/* 지운 줄 → 전술 명령 목록. 명령의 모양은 engine/tactics.js의 계약과 같다:
 * { route, kind, size }. 그래서 이 퍼즐을 또 다른 퍼즐로 바꿔도 전투는 그대로다.
 *
 * cells는 **지우기 전**의 판이어야 한다. 색이 사라진 뒤에는 어떤 전술인지 알 수 없다. */
export function clearCommands(cells, clears, { combo = 0, size = GRID } = {}) {
  const rows = clears?.rows || [];
  const cols = clears?.cols || [];
  const lines = rows.length + cols.length;
  if (!lines) return [];
  const tier = blockTier(lines, combo);
  const commands = [];

  for (const col of cols) {
    const indices = Array.from({ length: size }, (_, row) => cellIndex(row, col, size));
    const kind = dominantType(cells, indices);
    if (kind) commands.push({ route: laneForCol(col), kind, size: tier, axis: 'col', line: col });
  }

  for (const row of rows) {
    for (let lane = 0; lane < LANE_COLS.length; lane++) {
      const indices = LANE_COLS[lane].map((col) => cellIndex(row, col, size));
      const kind = dominantType(cells, indices);
      if (!kind) continue;
      commands.push({
        route: lane,
        kind,
        size: Math.max(3, tier - ROW_SPREAD_PENALTY),
        axis: 'row',
        line: row,
      });
    }
  }
  return commands;
}

export const trayFits = (cells, slot, size = GRID) => {
  if (!slot) return false;
  const spec = pieceById(slot.piece);
  if (!spec) return false;
  for (let row = 0; row <= size - spec.rows; row++) {
    for (let col = 0; col <= size - spec.cols; col++) if (canPlace(cells, spec, row, col, size)) return true;
  }
  return false;
};

export const hasAnyPlacement = (cells, tray, size = GRID) =>
  (tray || []).some((slot) => slot && trayFits(cells, slot, size));

/* 판에 하나도 안 들어가는 트레이는 재미가 아니라 사고다. 그래서 뽑은 뒤 확인하고,
 * 정 안 되면 1×1을 섞는다. 그래도 판이 꽉 차 있으면 막힘 처리(breakDeadlock)로 넘긴다. */
export function drawTray(random, cells, count = TRAY_SIZE, size = GRID) {
  for (let attempt = 0; attempt < DEADLOCK_REDRAWS; attempt++) {
    const tray = Array.from({ length: count }, () => randomPiece(random));
    if (!cells || hasAnyPlacement(cells, tray, size)) return tray;
  }
  const fallback = Array.from({ length: count }, () => randomPiece(random));
  fallback[0] = { piece: 'dot', type: weightedPick(TYPE_ENTRIES, random) };
  return fallback;
}

/* 막힘 해소 — 가장 많이 찬 줄을 전술 없이 비운다.
 * 게임오버로 끝내지 않는 이유: 여기서 퍼즐이 끝나면 방어도 같이 끝난다. 대신
 * 전술이 나가지 않으므로 그 사이 몬스터는 그대로 전진한다. */
export function breakDeadlock(cells, size = GRID) {
  let bestRow = 0;
  let bestCount = -1;
  for (let row = 0; row < size; row++) {
    let filled = 0;
    for (let col = 0; col < size; col++) if (cells[cellIndex(row, col, size)] != null) filled++;
    if (filled > bestCount) { bestCount = filled; bestRow = row; }
  }
  const next = [...cells];
  for (let col = 0; col < size; col++) next[cellIndex(bestRow, col, size)] = null;
  return { cells: next, row: bestRow, cleared: bestCount };
}

/* 사람이 할 수 있는 배치만 열거한다. 봇·데모·테스트가 화면을 거치지 않고도
 * 합법 입력만 만들 수 있어야 "봇은 되는데 화면에선 안 되는" 차이가 안 생긴다. */
export function legalPlacements(cells, tray, size = GRID) {
  const moves = [];
  (tray || []).forEach((slot, index) => {
    const spec = slot && pieceById(slot.piece);
    if (!spec) return;
    for (let row = 0; row <= size - spec.rows; row++) {
      for (let col = 0; col <= size - spec.cols; col++) {
        if (!canPlace(cells, spec, row, col, size)) continue;
        const next = placePiece(cells, spec, row, col, slot.type, size);
        const clears = findClears(next, size);
        moves.push({
          slot: index,
          piece: spec.id,
          type: slot.type,
          row,
          col,
          cells: next,
          clears,
          lines: clears.rows.length + clears.cols.length,
        });
      }
    }
  });
  return moves;
}

/* 한 번의 배치를 끝까지 해소한다. 화면 어댑터와 봇이 같은 함수를 쓰므로
 * "연출만 다르고 결과는 같다"가 규칙으로 보장된다. */
export function resolvePlacement(cells, tray, slot, row, col, { combo = 0, size = GRID } = {}) {
  const entry = tray?.[slot];
  const spec = entry && pieceById(entry.piece);
  if (!spec) return { ok: false, reason: 'piece' };
  const placed = placePiece(cells, spec, row, col, entry.type, size);
  if (!placed) return { ok: false, reason: 'space' };
  const clears = findClears(placed, size);
  const lines = clears.rows.length + clears.cols.length;
  const commands = clearCommands(placed, clears, { combo: lines ? combo + 1 : 0, size });
  const nextTray = tray.map((item, index) => (index === slot ? null : item));
  return {
    ok: true,
    placed,
    cells: lines ? applyClears(placed, clears, size) : placed,
    clears,
    lines,
    commands,
    cleared: clearedCellIndices(clears, size),
    tray: nextTray,
    combo: lines ? combo + 1 : 0,
    filled: placementCells(spec, row, col, size),
  };
}

export const boardFilled = (cells) => cells.reduce((sum, cell) => sum + (cell == null ? 0 : 1), 0);
