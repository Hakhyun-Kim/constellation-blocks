/* =====================================================
 * 별자리 전술판 — 실시간 3매치가 곧 전장 조준이다.
 * 보드는 UI가 갖되, 실제 피해·감속·회복은 순수 엔진 castTactic으로만 낸다.
 * 저장/불러오기로 퍼즐을 리롤하지 못하게 게임 난수(state.rng)를 쓴다.
 * ===================================================== */
import * as E from '../engine.js';

const N = 6;
const TYPES = ['flare', 'tide', 'bloom'];
const ICON = { flare: '☄️', tide: '❄️', bloom: '🛡️' };
const LABEL = { flare: '유성 포격', tide: '서리 결계', bloom: '수호 성좌' };

export function createTacticFlow({ getState, onCast, toast }) {
  const board = document.getElementById('tacticBoard');
  const status = document.getElementById('tacticStatus');
  let cells = [];
  let selected = null;
  const pick = () => TYPES[Math.floor(getState().rng() * TYPES.length)];
  const ix = (r, c) => r * N + c;

  function groups() {
    const hit = new Set();
    for (let r = 0; r < N; r++) for (let c = 0; c < N; c++) {
      const type = cells[ix(r, c)]; let h = [ix(r, c)], v = [ix(r, c)];
      for (let x = c + 1; x < N && cells[ix(r, x)] === type; x++) h.push(ix(r, x));
      for (let y = r + 1; y < N && cells[ix(y, c)] === type; y++) v.push(ix(y, c));
      if (h.length >= 3) h.forEach(i => hit.add(i));
      if (v.length >= 3) v.forEach(i => hit.add(i));
    }
    return [...hit];
  }
  function make() {
    cells = Array.from({ length: N * N }, pick);
    while (groups().length) cells = Array.from({ length: N * N }, pick);
    draw();
  }
  function draw() {
    board.innerHTML = cells.map((type, i) => `<button class="tactic-star ${type}${selected === i ? ' picked' : ''}" data-i="${i}" aria-label="${LABEL[type]}">${ICON[type]}</button>`).join('');
    board.querySelectorAll('button').forEach(b => b.addEventListener('click', () => choose(Number(b.dataset.i))));
  }
  function laneOf(hit) {
    const avg = hit.reduce((s, i) => s + (i % N), 0) / hit.length;
    return Math.min(2, Math.floor(avg / 2));
  }
  function choose(i) {
    const state = getState();
    if (state.phase !== 'wave') { toast('전술판은 웨이브가 시작되면 깨어나요 — 지금은 진형을 준비해요.'); return; }
    if (selected == null) { selected = i; draw(); return; }
    const a = selected; selected = null;
    const ar = Math.floor(a / N), ac = a % N, br = Math.floor(i / N), bc = i % N;
    if (Math.abs(ar - br) + Math.abs(ac - bc) !== 1) { selected = i; draw(); return; }
    [cells[a], cells[i]] = [cells[i], cells[a]];
    const hit = groups();
    if (!hit.length) { [cells[a], cells[i]] = [cells[i], cells[a]]; status.textContent = '별자리가 이어지지 않아요 — 이웃한 별을 다시 바꿔 보세요.'; draw(); return; }
    resolve(hit);
  }
  function resolve(hit) {
    const type = cells[hit[0]], lane = laneOf(hit), size = Math.min(5, hit.length);
    const result = E.castTactic(getState(), lane, type, size);
    hit.forEach(i => { cells[i] = pick(); });
    if (result.ok) {
      status.textContent = `${['왼쪽', '가운데', '오른쪽'][lane]} 길 · ${LABEL[type]} ${size >= 5 ? '별똥별!' : size === 4 ? '폭발!' : '발동!'}`;
      onCast(result, type, lane, size);
    } else status.textContent = '그 길엔 아직 적이 없어요 — 다른 성좌를 준비하세요.';
    draw();
    /* 연쇄는 새 입력 없이도 하나의 전술적 보상이다. */
    setTimeout(() => { const chain = groups(); if (chain.length) resolve(chain); }, 220);
  }
  make();
  return { reset: make };
}
