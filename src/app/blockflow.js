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

  /* 정리 연출의 박자는 CSS의 .block-cell.matched 애니메이션과 같은 길이로 둔다.
   * 절제 효과에서는 그 애니메이션이 .12s로 짧아지므로 대기도 함께 줄인다 —
   * 숫자를 따로 박아 두면 한쪽만 바뀌어 연출이 끝난 뒤에도 판이 멈춰 있다. */
  const resolveBeatMs = () => (document.body.classList.contains('reduced-effects') ? 120 : 210);

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

  /* 칸은 한 번만 만든다. 예전에는 한 수를 놓을 때마다 innerHTML로 버튼 64개를
   * 새로 만들고 리스너 128개를 다시 달았다. 저사양 기기에서는 이 재생성이
   * 조각을 놓을 때마다 눈에 띄는 멈칫거림이 된다. 리스너도 판에 하나씩만 두고
   * 위임으로 받는다 — pointerenter는 버블링하지 않으므로 pointerover를 쓴다. */
  const cellEls = cells.map((_, index) => {
    const button = document.createElement('button');
    button.className = 'block-cell';
    button.dataset.i = String(index);
    button.dataset.lane = String(laneForCol(cellCol(index)));
    button.setAttribute('aria-label', `${cellCol(index) + 1}열 ${Math.floor(index / GRID) + 1}행`);
    return button;
  });

  function buildBoard() {
    board.replaceChildren(...cellEls);
    const cellAt = (event) => event.target?.closest?.('button[data-i]')?.dataset.i;
    board.addEventListener('click', (event) => {
      const index = cellAt(event);
      if (index != null) drop(Number(index));
    });
    board.addEventListener('pointerover', (event) => {
      const index = cellAt(event);
      if (index != null) ghost(Number(index));
    });
  }

  /* 칸의 클래스는 언제나 판 상태에서 통째로 다시 만든다. 미리보기 클래스만
   * 골라 지우면 채워진 칸의 색까지 함께 지워지는 일이 생긴다. */
  const baseClass = (index) => {
    const type = cells[index];
    return type ? `block-cell filled ${type}` : 'block-cell';
  };

  function drawBoard() {
    for (let index = 0; index < cellEls.length; index++) {
      const next = baseClass(index);
      if (cellEls[index].className !== next) cellEls[index].className = next;
    }
    ghosted.length = 0;
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
  }

  function draw() {
    drawBoard();
    drawTrayBox();
  }

  /* 지금 미리보기가 얹힌 칸만 기억한다. 예전에는 판 전체를 훑어 찾았고,
   * 마우스가 칸을 지날 때마다 그 훑기가 다시 일어났다. */
  const ghosted = [];

  function clearGhost() {
    for (const index of ghosted) cellEls[index].className = baseClass(index);
    ghosted.length = 0;
  }

  const paint = (index, ...classes) => {
    const element = cellEls[index];
    if (!element) return;
    if (!ghosted.includes(index)) ghosted.push(index);
    element.classList.add(...classes);
  };

  function ghost(index) {
    clearGhost();
    const entry = picked == null ? null : tray[picked];
    if (!entry || resolving || getPhase() !== 'wave') return;
    const spec = pieceById(entry.piece);
    const row = Math.floor(index / GRID);
    const col = cellCol(index);
    const fits = canPlace(cells, spec, row, col);
    const targets = placementCells(spec, row, col).filter((cell) => cell >= 0);
    for (const cell of targets) paint(cell, fits ? 'ghost' : 'ghost-bad', entry.type);
    if (!fits) return;
    /* 지금 놓으면 어느 줄이 사라지는지 미리 보인다. "우연히 터졌다"가 아니라
     * "노려서 터뜨렸다"가 되어야 다음 수를 계획한다. */
    const preview = [...cells];
    for (const cell of targets) preview[cell] = entry.type;
    for (let line = 0; line < GRID; line++) {
      const rowFull = Array.from({ length: GRID }, (_, c) => preview[cellIndex(line, c)]).every(Boolean);
      const colFull = Array.from({ length: GRID }, (_, r) => preview[cellIndex(r, line)]).every(Boolean);
      if (rowFull) for (let c = 0; c < GRID; c++) paint(cellIndex(line, c), 'will-clear');
      if (colFull) for (let r = 0; r < GRID; r++) paint(cellIndex(r, line), 'will-clear');
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
    const targets = indices.map((index) => cellEls[index]).filter(Boolean);
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
      cellEls[index]?.classList.add('matched', command.kind, ...(command.size >= 4 ? ['jackpot'] : []));
    }
    showBeam(indices, command.route, command.kind);
  }

  /* 정리 연출이 도는 동안에도 다음 조각은 고를 수 있다. 고르기는 판을 건드리지
   * 않으므로 막을 이유가 없었고, 아이가 느끼는 대기의 절반은 여기서 났다.
   * (연출 뒤 트레이가 새로 오면 refillTray가 선택을 지우므로, 본 것과 다른
   * 조각이 놓이는 일은 없다.) */
  function pick(slot) {
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
    }, resolveBeatMs());
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
  buildBoard();
  draw();
  /* 리스너는 판과 트레이에 하나씩만 단다. 트레이는 조각이 바뀔 때마다 다시
   * 그리므로, 버튼마다 달면 그릴 때마다 리스너가 쌓인다. */
  board.addEventListener('pointerleave', clearGhost);
  trayBox.addEventListener('click', (event) => {
    const slot = event.target?.closest?.('button[data-s]')?.dataset.s;
    if (slot != null) pick(Number(slot));
  });
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
        cellEls[index]?.classList.add('guided-to');
      }
      trayBox.querySelector(`button[data-s="${picked}"]`)?.classList.add('guided-from');
      status.textContent = '첫 지휘 · 빛나는 자리에 조각을 놓아 가운데 길에 유성을 내리세요.';
      return true;
    },
  };
}
