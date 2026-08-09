const $ = (s) => document.querySelector(s);
const boardEl = $('#board');
const lanesEl = [$('#lane0'), $('#lane1'), $('#lane2')];
const colors = ['flare', 'tide', 'bloom'];
const icons = { flare: '✦', tide: '✧', bloom: '✿' };

const state = { board: [], selected: null, enemies: [], laneLevel: [1, 1, 1], gold: 120, castle: 100, wave: 1, active: false, spawnLeft: 0, spawnClock: 0, combo: 0, last: performance.now() };
const rand = (n) => Math.floor(Math.random() * n);
const tile = () => colors[rand(colors.length)];

function makeBoard() { state.board = Array.from({ length: 36 }, tile); while (findMatches().length) state.board = Array.from({ length: 36 }, tile); }
function at(r, c) { return r * 6 + c; }
function findMatches() {
  const groups = []; const used = new Set();
  for (let r = 0; r < 6; r++) for (let c = 0; c < 6; c++) {
    const type = state.board[at(r, c)]; let h = [at(r, c)], v = [at(r, c)];
    for (let x = c + 1; x < 6 && state.board[at(r, x)] === type; x++) h.push(at(r, x));
    for (let y = r + 1; y < 6 && state.board[at(y, c)] === type; y++) v.push(at(y, c));
    if (h.length >= 3) h.forEach(i => used.add(i)); if (v.length >= 3) v.forEach(i => used.add(i));
  }
  if (used.size) groups.push([...used]); return groups;
}
function renderBoard() {
  boardEl.innerHTML = state.board.map((type, i) => `<button class="star ${type}${state.selected === i ? ' selected' : ''}" data-i="${i}" role="gridcell" aria-label="${type} star">${icons[type]}</button>`).join('');
  boardEl.querySelectorAll('.star').forEach(el => el.addEventListener('click', () => pick(+el.dataset.i)));
}
function laneFor(indices) { const avg = indices.reduce((sum, i) => sum + (i % 6), 0) / indices.length; return Math.min(2, Math.floor(avg / 2)); }
function log(message) { $('#eventLog').textContent = message; $('#battleMessage').textContent = message; }
function pick(i) {
  if (state.selected == null) { state.selected = i; renderBoard(); return; }
  const a = state.selected; state.selected = null;
  const ar = Math.floor(a / 6), ac = a % 6, br = Math.floor(i / 6), bc = i % 6;
  if (Math.abs(ar - br) + Math.abs(ac - bc) !== 1) { state.selected = i; renderBoard(); return; }
  [state.board[a], state.board[i]] = [state.board[i], state.board[a]];
  const matches = findMatches();
  if (!matches.length) { [state.board[a], state.board[i]] = [state.board[i], state.board[a]]; log('That constellation cannot hold. Try another swap.'); renderBoard(); return; }
  resolve(matches);
}
function resolve(groups) {
  const cells = groups.flat(), type = state.board[cells[0]], lane = laneFor(cells), count = cells.length;
  cells.forEach(i => state.board[i] = tile()); state.combo++;
  cast(type, lane, count); renderBoard();
  setTimeout(() => { const chain = findMatches(); if (chain.length) resolve(chain); else state.combo = 0; }, 320);
}
function cast(type, lane, count) {
  const targets = state.enemies.filter(e => e.lane === lane && e.x > 4);
  const power = count === 3 ? 28 : count === 4 ? 62 : 140;
  if (type === 'flare') targets.forEach(e => e.hp -= power);
  if (type === 'tide') targets.forEach(e => { e.freeze = count === 3 ? 2.2 : 4.5; e.hp -= count >= 4 ? 16 : 0; });
  if (type === 'bloom') { state.castle = Math.min(100, state.castle + count * 2); state.laneLevel[lane] += count >= 4 ? 1 : 0; }
  const kind = count >= 5 ? 'STARFALL' : count === 4 ? 'NOVA' : 'TACTIC';
  log(`${kind}: ${type.toUpperCase()} answers ${['AURORA', 'COMET', 'NEBULA'][lane]}.`);
  beam(lane, type); updateHud();
}
function beam(lane, type) { const laneEl = lanesEl[lane]; const el = document.createElement('i'); el.className = `shot ${type}`; el.style.left = '0'; el.style.width = '83%'; laneEl.append(el); setTimeout(() => el.remove(), 300); }
function startWave() { if (state.active) return; state.active = true; state.spawnLeft = 7 + state.wave * 2; state.spawnClock = 0; $('#waveBtn').textContent = 'WAVE IN PROGRESS'; log(`Wave ${state.wave}: the void is moving.`); updateHud(); }
function spawn() { state.enemies.push({ id: Math.random(), lane: rand(3), x: 100, hp: 45 + state.wave * 15, freeze: 0 }); }
function update(dt) {
  if (state.active) { state.spawnClock -= dt; if (state.spawnLeft && state.spawnClock <= 0) { spawn(); state.spawnLeft--; state.spawnClock = Math.max(.38, 1.1 - state.wave * .035); }
    state.enemies.forEach(e => { const defenderPower = state.laneLevel[e.lane] * (9 + state.wave * .4); e.hp -= defenderPower * dt; if (e.freeze > 0) e.freeze -= dt; else e.x -= (2.2 + state.wave * .16) * dt; });
    state.enemies.filter(e => e.x <= 0).forEach(e => { e.hp = 0; state.castle -= 9; log('The citadel takes a hit — match faster!'); });
    state.enemies = state.enemies.filter(e => e.hp > 0);
    if (!state.spawnLeft && !state.enemies.length) { state.active = false; state.gold += 38 + state.wave * 8; state.wave++; $('#waveBtn').textContent = 'BEGIN NEXT WAVE'; log(`Wave cleared. +${38 + (state.wave - 1) * 8} stardust.`); }
  }
  if (state.castle <= 0) { state.castle = 100; state.active = false; state.enemies = []; state.wave = 1; state.gold = 120; state.laneLevel = [1,1,1]; $('#waveBtn').textContent = 'BEGIN AGAIN'; log('The constellation reforms. Defend again.'); }
  renderEnemies(); updateHud();
}
function renderEnemies() { lanesEl.forEach((el, lane) => { el.innerHTML = state.enemies.filter(e => e.lane === lane).map(e => `<span class="enemy${e.freeze > 0 ? ' frozen' : ''}" style="left:${Math.max(0, e.x)}%">☄</span>`).join(''); }); }
function updateHud() { $('#castleFill').style.width = `${Math.max(0, state.castle)}%`; $('#castleLabel').textContent = `${Math.ceil(state.castle)} / 100`; $('#goldLabel').textContent = `${state.gold} stardust`; $('#waveLabel').textContent = `WAVE ${state.wave} · ${state.active ? 'DEFEND' : 'PREPARE'}`; $('#comboLabel').textContent = `×${state.combo}`; state.laneLevel.forEach((lv, i) => { $(`#defender${i} b`).textContent = lv; const btn = document.querySelector(`.upgrade[data-lane="${i}"]`); btn.innerHTML = `${['AURORA','COMET','NEBULA'][i]} <span>LV ${lv} · ${55 + (lv - 1) * 30}</span>`; }); }
document.querySelectorAll('.upgrade').forEach(btn => btn.addEventListener('click', () => { const lane = +btn.dataset.lane, cost = 55 + (state.laneLevel[lane] - 1) * 30; if (state.active) return log('Upgrade between waves — keep your hands on the board.'); if (state.gold < cost) return log('Not enough stardust. Clear a wave first.'); state.gold -= cost; state.laneLevel[lane]++; log(`${['Aurora','Comet','Nebula'][lane]} guardian ascends to level ${state.laneLevel[lane]}.`); updateHud(); }));
$('#waveBtn').addEventListener('click', startWave); $('#helpBtn').addEventListener('click', () => $('#help').showModal()); $('#closeHelp').addEventListener('click', () => $('#help').close()); $('#startHelp').addEventListener('click', () => { $('#help').close(); startWave(); });
function loop(now) { const dt = Math.min(.05, (now - state.last) / 1000); state.last = now; update(dt); requestAnimationFrame(loop); }
makeBoard(); renderBoard(); updateHud(); requestAnimationFrame(loop);
