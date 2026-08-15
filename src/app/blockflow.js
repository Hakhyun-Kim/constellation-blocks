/* =====================================================
 * 블록 전술판 화면 어댑터
 *
 * 여기에는 DOM, 선택, 미리보기, 애니메이션 취소만 둔다. 퍼즐 규칙은 blocks/board.js,
 * 방어 효과는 주입받은 resolveTactic()이 담당하므로 어느 한쪽도 다른 쪽을 import하거나
 * 상태 구조를 알 필요가 없다.
 *
 * 입력은 두 걸음이다: 트레이의 조각을 고르고 → 판의 칸을 누른다. 손가락으로도 되도록
 * 드래그를 요구하지 않고, 대신 마우스가 지나가는 자리에 놓일 모습(ghost)을 미리 보여 준다.
 * ===================================================== */
import {
  GRID,
  BLOCK_TYPES,
  canPlace,
  createEmptyBoard,
  drawTray,
  breakDeadlock,
  cellCol,
  cellIndex,
  hasAnyPlacement,
  laneForCol,
  pieceById,
  placementCells,
  resolvePlacement,
} from '../blocks/board.js';
import { TRAY_SIZE } from '../balance/blocks.js';

const LABEL = { flare: '유성 폭격', tide: '서리 결계', bloom: '수호 회복' };
const ROUTE_LABEL = ['왼쪽', '가운데', '오른쪽'];
const GLOW = { flare: '#ff8b62', tide: '#71dcff', bloom: '#8eea94' };

export function createBlockFlow({ getPhase, random, resolveTactic, onCast, onClear, onPlace, onPreview, toast }) {
  const board = document.getElementById('blockGrid');
  const trayBox = document.getElementById('blockTray');
  const status = document.getElementById('tacticStatus');
  const card = board.closest('.tactic-card');
  let cells = createEmptyBoard();
  let tray = [];
  let picked = null;
  let combo = 0;
  let resolving = false;
  let generation = 0;
  const timers = new Set();

  const later = (fn, ms) => {
    const id = setTimeout(() => { timers.delete(id); fn(); }, ms);
    timers.add(id);
    return id;
  };

  function cancelPending() {
    generation++;
    for (const id of timers) clearTimeout(id);
    timers.clear();
    resolving = false;
  }

  function refillTray() {
    tray = drawTray(random, cells, TRAY_SIZE);
    picked = null;
  }

  function drawBoard() {
    board.innerHTML = cells.map((type, index) =>
      `<button class="block-cell${type ? ` filled ${type}` : ''}" data-i="${index}" data-lane="${laneForCol(cellCol(index))}"`
      + ` aria-label="${cellCol(index) + 1}열 ${Math.floor(index / GRID) + 1}행"></button>`
    ).join('');
    board.querySelectorAll('button').forEach((button) => {
      const index = Number(button.dataset.i);
      button.addEventListener('click', () => drop(index));
      button.addEventListener('pointerenter', () => ghost(index));
    });
  }

  /* 조각은 판과 같은 칸 크기로 그린다. 크기가 다르면 "들어갈까?"를 눈으로 못 재고,
   * 아이가 매번 시행착오로만 배우게 된다. */
  function pieceSvg(entry) {
    const spec = pieceById(entry.piece);
    if (!spec) return '';
    const grid = spec.cells.map(([row, col]) =>
      `<i style="grid-row:${row + 1};grid-column:${col + 1}"></i>`).join('');
    return `<span class="block-piece ${entry.type}" style="--pw:${spec.cols};--ph:${spec.rows}">${grid}</span>`;
  }

  function drawTrayBox() {
    trayBox.innerHTML = tray.map((entry, index) => {
      if (!entry) return `<button class="block-slot used" data-s="${index}" disabled aria-label="사용한 조각"></button>`;
      const fits = hasAnyPlacement(cells, [entry]);
      const classes = ['block-slot', entry.type];
      if (picked === index) classes.push('picked');
      if (!fits) classes.push('stuck');
      return `<button class="${classes.join(' ')}" data-s="${index}" aria-label="${LABEL[entry.type]} 조각">`
        + `${pieceSvg(entry)}</button>`;
    }).join('');
    trayBox.querySelectorAll('button').forEach((button) =>
      button.addEventListener('click', () => pick(Number(button.dataset.s))));
  }

  function draw() {
    drawBoard();
    drawTrayBox();
  }

  function clearGhost() {
    board.querySelectorAll('.ghost, .ghost-bad, .will-clear').forEach((element) =>
      element.classList.remove('ghost', 'ghost-bad', 'will-clear', ...BLOCK_TYPES));
  }

  function ghost(index) {
    clearGhost();
    const entry = picked == null ? null : tray[picked];
    if (!entry || resolving || getPhase() !== 'wave') return;
    const spec = pieceById(entry.piece);
    const row = Math.floor(index / GRID);
    const col = cellCol(index);
    const fits = canPlace(cells, spec, row, col);
    const targets = placementCells(spec, row, col).filter((cell) => cell >= 0);
    for (const cell of targets) {
      const element = board.querySelector(`button[data-i="${cell}"]`);
      if (element) element.classList.add(fits ? 'ghost' : 'ghost-bad', entry.type);
    }
    if (!fits) return;
    /* 지금 놓으면 어느 줄이 사라지는지 미리 보인다. "우연히 터졌다"가 아니라
     * "노려서 터뜨렸다"가 되어야 다음 수를 계획한다. */
    const preview = [...cells];
    for (const cell of targets) preview[cell] = entry.type;
    for (let line = 0; line < GRID; line++) {
      const rowFull = Array.from({ length: GRID }, (_, c) => preview[cellIndex(line, c)]).every(Boolean);
      const colFull = Array.from({ length: GRID }, (_, r) => preview[cellIndex(r, line)]).every(Boolean);
      if (rowFull) for (let c = 0; c < GRID; c++) board.querySelector(`button[data-i="${cellIndex(line, c)}"]`)?.classList.add('will-clear');
      if (colFull) for (let r = 0; r < GRID; r++) board.querySelector(`button[data-i="${cellIndex(r, line)}"]`)?.classList.add('will-clear');
    }
  }

  function clearVisuals() {
    board.classList.remove('casting');
    board.style.removeProperty('--tactic-glow');
    delete board.dataset.matchSize;
    delete card.dataset.matchSize;
    delete card.dataset.tactic;
    card.querySelectorAll('.tactic-routes span.active').forEach((element) =>
      element.classList.remove('active', ...BLOCK_TYPES));
    card.querySelectorAll('.tactic-beam').forEach((element) => element.remove());
  }

  function recoverResolution(token) {
    if (token !== generation) return;
    resolving = false;
    picked = null;
    clearVisuals();
    draw();
    status.textContent = '별빛이 흔들렸어요. 다른 자리에 조각을 놓아 보세요.';
  }

  function showBeam(indices, lane, type) {
    const targets = indices.map((index) => board.querySelector(`button[data-i="${index}"]`)).filter(Boolean);
    const target = card.querySelector(`.tactic-routes span[data-route="${lane}"]`);
    if (!targets.length || !target) return;
    const cardRect = card.getBoundingClientRect();
    const targetRect = target.getBoundingClientRect();
    const from = targets.reduce((sum, element) => {
      const rect = element.getBoundingClientRect();
      sum.x += rect.left + rect.width / 2;
      sum.y += rect.top + rect.height / 2;
      return sum;
    }, { x: 0, y: 0 });
    from.x /= targets.length;
    from.y /= targets.length;
    const to = { x: targetRect.left + targetRect.width / 2, y: targetRect.top + targetRect.height / 2 };
    const dx = to.x - from.x;
    const dy = to.y - from.y;
    const beam = document.createElement('div');
    beam.className = `tactic-beam ${type}`;
    beam.style.left = `${from.x - cardRect.left}px`;
    beam.style.top = `${from.y - cardRect.top}px`;
    beam.style.width = `${Math.hypot(dx, dy)}px`;
    beam.style.setProperty('--beam-angle', `${Math.atan2(dy, dx)}rad`);
    card.appendChild(beam);
    void beam.offsetWidth;
    beam.classList.add('run');
    target.classList.add('active', type);
  }

  function showClear(cleared, command, indices) {
    board.classList.add('casting');
    board.style.setProperty('--tactic-glow', GLOW[command.kind] || GLOW.flare);
    board.dataset.matchSize = String(command.size);
    card.dataset.matchSize = String(command.size);
    card.dataset.tactic = command.kind;
    for (const index of cleared) {
      const element = board.querySelector(`button[data-i="${index}"]`);
      if (element) element.classList.add('matched', command.kind, ...(command.size >= 4 ? ['jackpot'] : []));
    }
    showBeam(indices, command.route, command.kind);
  }

  function pick(slot) {
    if (resolving) return;
    if (getPhase() !== 'wave') {
      toast('전술판은 웨이브 중에만 사용할 수 있어요.', 'warn');
      return;
    }
    if (!tray[slot]) return;
    picked = picked === slot ? null : slot;
    clearGhost();
    drawTrayBox();
  }

  function drop(index) {
    if (resolving) return;
    if (getPhase() !== 'wave') {
      toast('전술판은 웨이브 중에만 사용할 수 있어요.', 'warn');
      return;
    }
    if (picked == null) {
      status.textContent = '아래 조각을 먼저 고르세요.';
      return;
    }
    return place(picked, Math.floor(index / GRID), cellCol(index));
  }

  /* 봇·데모·판정 데모도 이 경로로 들어온다. 화면 전용 지름길을 만들면
   * 화면에서만 나는 버그가 생긴다. */
  function place(slot, row, col) {
    if (resolving || getPhase() !== 'wave') return false;
    const result = resolvePlacement(cells, tray, slot, row, col, { combo });
    if (!result.ok) {
      status.textContent = result.reason === 'space'
        ? '그 자리에는 조각이 들어가지 않아요.' : '조각을 먼저 고르세요.';
      return false;
    }

    const token = generation;
    picked = null;
    combo = result.combo;
    tray = result.tray;
    cells = result.placed;
    clearGhost();
    card.classList.remove('guided-opening');
    draw();
    onPlace?.({ slot, row, col, lines: result.lines, combo, commands: result.commands });

    if (!result.lines) {
      status.textContent = tray.some(Boolean)
        ? '조각을 놓았어요. 줄을 꽉 채우면 전술이 나가요.'
        : '새 조각이 도착했어요.';
      if (!tray.some(Boolean)) refillTray();
      ensurePlayable();
      draw();
      return true;
    }

    resolving = true;
    try {
      const lead = result.commands[0];
      status.textContent = lead
        ? `${ROUTE_LABEL[lead.route]} 길 · ${LABEL[lead.kind]} ${result.lines >= 2 ? '연속 정리!' : '준비!'}`
        : '줄을 정리했어요.';
      if (lead) showClear(result.cleared, lead, result.cleared);
      onClear?.(result.commands, result.lines, combo);
    } catch (error) {
      console.error('Block clear presentation failed', error);
      recoverResolution(token);
      return true;
    }

    later(() => {
      try {
        if (token !== generation) return;
        cells = result.cells;
        if (!tray.some(Boolean)) refillTray();
        clearVisuals();
        let cast = 0;
        for (const command of result.commands) {
          const outcome = resolveTactic(command.route, command.kind, command.size);
          if (outcome.ok) {
            cast++;
            onCast(outcome, command.kind, command.route, command.size, command);
          }
        }
        status.textContent = cast
          ? `${result.lines}줄 정리 · 전술 ${cast}회 발동!${combo >= 3 ? ` (연속 ${combo})` : ''}`
          : '줄은 정리했지만 그 길에 적이 없어요.';
        ensurePlayable();
        draw();
      } catch (error) {
        console.error('Block resolution failed', error);
        recoverResolution(token);
        return;
      }
      resolving = false;
    }, 210);
    return true;
  }

  /* 막힘은 게임오버가 아니라 템포 손실이다 — 트레이를 다시 뽑고, 그래도 막히면
   * 가장 찬 줄을 전술 없이 비운다. */
  function ensurePlayable() {
    if (hasAnyPlacement(cells, tray)) return false;
    refillTray();
    if (hasAnyPlacement(cells, tray)) {
      status.textContent = '들어갈 자리가 없어 새 조각을 받았어요.';
      return true;
    }
    const relief = breakDeadlock(cells);
    cells = relief.cells;
    combo = 0;
    refillTray();
    status.textContent = '판이 막혀 한 줄을 그냥 치웠어요 — 전술은 나가지 않아요.';
    return true;
  }

  function reset() {
    cancelPending();
    cells = createEmptyBoard();
    combo = 0;
    refillTray();
    clearVisuals();
    draw();
    status.textContent = '웨이브가 시작되면 조각이 내려와요.';
  }

  function preview(type = 'flare', lane = 1, size = 3) {
    if (!BLOCK_TYPES.includes(type) || resolving) return false;
    const safeLane = Math.max(0, Math.min(2, Math.round(lane)));
    const safeSize = Math.max(3, Math.min(5, Math.round(size)));
    const col = safeLane === 0 ? 1 : safeLane === 1 ? 3 : 6;
    const indices = Array.from({ length: GRID }, (_, row) => cellIndex(row, col));
    const token = generation;
    resolving = true;
    status.textContent = `테스트 · ${ROUTE_LABEL[safeLane]} 길 ${LABEL[type]} ${safeSize}등급`;
    showClear(indices, { route: safeLane, kind: type, size: safeSize }, indices);
    later(() => {
      if (token !== generation) return;
      clearVisuals();
      resolving = false;
      draw();
      onPreview?.(type, safeLane, safeSize);
    }, 250);
    return true;
  }

  refillTray();
  draw();
  /* 판 자체는 다시 그려도 남아 있으므로 리스너는 한 번만 단다. 셀마다 달면
   * 재드로마다 리스너가 쌓인다. */
  board.addEventListener('pointerleave', clearGhost);
  return {
    reset,
    preview,
    place,
    getBoard: () => [...cells],
    getTray: () => tray.map((entry) => (entry ? { ...entry } : null)),
    getCombo: () => combo,
    /* 판정용 오프닝은 다른 규칙이 아니라 authored된 판이다. 배치와 발동은
     * 사람과 같은 place() 경로를 그대로 쓴다. */
    setOpening(opening) {
      if (!opening || !Array.isArray(opening.cells) || opening.cells.length !== GRID * GRID) return false;
      if (!Array.isArray(opening.tray) || !opening.tray.length) return false;
      cancelPending();
      cells = [...opening.cells];
      tray = opening.tray.map((entry) => ({ ...entry }));
      combo = 0;
      picked = Number.isInteger(opening.slot) ? opening.slot : 0;
      clearVisuals();
      draw();
      card.classList.add('guided-opening');
      for (const index of placementCells(pieceById(tray[picked].piece), opening.row, opening.col)) {
        board.querySelector(`button[data-i="${index}"]`)?.classList.add('guided-to');
      }
      trayBox.querySelector(`button[data-s="${picked}"]`)?.classList.add('guided-from');
      status.textContent = '첫 지휘 · 빛나는 자리에 조각을 놓아 가운데 길에 유성을 내리세요.';
      return true;
    },
  };
}
