/* =====================================================
 * UI (DOM 패널/모달) — 상태를 그리고, 입력을 핸들러로 전달
 * ===================================================== */
import * as D from './data.js';
import * as E from './engine.js';

const $ = (id) => document.getElementById(id);

/* 사거리 등급 라벨 — 숫자만으론 감이 안 오니 말로도 알려준다 */
function rangeLabel(range) {
  if (range >= 240) return { text: '초장거리', cls: 'r4' };
  if (range >= 180) return { text: '장거리', cls: 'r3' };
  if (range >= 140) return { text: '중거리', cls: 'r2' };
  return { text: '근접', cls: 'r1' };
}

/* 조합 결과 미리보기용 가상 용사 (상태를 바꾸지 않는다) */
function previewHero(cls, tier, state) {
  const s = D.heroStats(cls, tier);
  return {
    id: -1, cls, tier, padIndex: -1,
    dmg: Math.round(s.dmg * (state ? state.dmgMul : 1)),
  };
}

/* 용사 상세 정보(툴팁/패널 공용) */
export function describeHero(hero, state, preview) {
  const C = D.CLASSES[hero.cls];
  const T = D.TIERS[hero.tier];
  const m = E.heroMods(hero);
  const rl = rangeLabel(m.range);
  const rows = [];
  rows.push(`⚔ 공격력 <b>${hero.dmg}</b>${m.hits > 1 ? ` × ${m.hits}타` : ''}`);
  rows.push(`⏱ 공격속도 <b>${m.spd.toFixed(2)}</b>/초 · 초당 <b>${E.heroDps(hero)}</b>`);
  if (m.crit) rows.push(`💥 <b>치명타 ${Math.round(m.crit.chance * 100)}%</b> · 피해 <b>×${m.crit.mul}</b>`);
  if (m.block) rows.push(`🛡️ <b>방패 장벽</b>: ${m.block.period}초마다 사거리 안 적을 <b>${m.block.dur}초 정지</b>`);
  if (m.slowOnHit) rows.push(`❄ 맞은 적 <b>${Math.round((1 - m.slowOnHit.mul) * 100)}% 감속</b> ${m.slowOnHit.dur}초`);
  if (m.aura) rows.push(`❄ <b>결계</b>: 사거리 안 모든 적 상시 ${Math.round((1 - m.aura) * 100)}% 감속`);
  if (m.splash) rows.push(`💥 <b>범위 폭발</b> 반경 ${Math.round(m.splash)}`);
  if (m.splashSlow) rows.push(`🧊 폭발에 맞은 적 ${Math.round((1 - m.splashSlow.mul) * 100)}% 감속`);
  if (m.burn) rows.push(`🔥 <b>화상</b>: 초당 공격력의 ${Math.round(m.burn * 100)}% (${D.BURN_DUR}초)`);
  if (m.pierce > 1) rows.push(`🎯 <b>관통</b> ${m.pierce}명`);
  if (m.cleave) rows.push(`🌀 <b>회전베기</b>: 사거리 안 전부 타격`);
  if (m.healOnKill) rows.push(`💚 처치 시 성 회복 <b>+${m.healOnKill}</b>`);

  let ability = '';
  const MA = hero.tier >= 4 ? D.MYTHIC_ABILITIES[hero.cls] : null;
  const LA = D.LEGEND_ABILITIES[hero.cls];
  if (MA) ability = `<div class="tt-mythic">🌌 ${MA.name} — ${MA.desc}</div>`;
  else if (hero.tier === 3 && LA) ability = `<div class="tt-legend">⭐ ${LA.name} — ${LA.desc}</div>`;
  let recipe = '';
  if (C.recipe) {
    const [a, b] = C.recipe;
    const label = C.mythic ? '🌌 신화 조합 전용' : '✨ 조합 전용 특수 용사';
    recipe = `<div class="tt-recipe">${label} (${D.CLASSES[a].emoji}+${D.CLASSES[b].emoji})</div>`;
  }
  const barPct = Math.round((m.range / D.RANGE_MAX) * 100);
  const onField = hero.padIndex >= 0;
  const cap = D.maxTierOf(hero.cls);
  const capNote = hero.tier >= cap
    ? `🔒 최고 등급(${D.TIERS[cap].name})`
    : `⬆ ${D.TIERS[cap].name}까지 성장 가능`;
  const foot = preview
    ? '🔮 조합하면 이렇게 나와요 (미리보기)'
    : `${onField ? '배치됨 · 발판 클릭으로 이동(다른 용사면 교환) · 우클릭 회수' : '벤치 · 발판을 눌러 배치(찬 자리면 교환)'} · ${capNote}`;

  return `
    <div class="tt-head">
      ${preview ? '<span class="tt-preview">미리보기</span>' : ''}
      <span class="tt-emoji">${C.emoji}</span>
      <span class="tt-name">${C.name}</span>
      <span class="tt-tier" style="background:${T.color}">${T.name}</span>
    </div>
    <div class="tt-range">
      <span class="tt-rlabel ${rl.cls}">${rl.text}</span>
      <span class="tt-rnum">🎯 사거리 ${m.range}</span>
      <div class="tt-rbar"><div class="tt-rfill ${rl.cls}" style="width:${barPct}%"></div></div>
    </div>
    <div class="tt-rows">${rows.map(r => `<div>${r}</div>`).join('')}</div>
    ${ability}${recipe}
    <div class="tt-desc">${C.desc}</div>
    <div class="tt-foot">${foot}</div>
  `;
}

export class UI {
  constructor() {
    this.el = {};
    [
      'bestWave', 'shards', 'metaBtn', 'castleText', 'castleFill', 'castleGhost',
      'scene3d', 'hitFlash', 'lowHpVignette', 'bossBanner', 'comboChip', 'waveInfo', 'remainN',
      'waveBtn', 'coachChip', 'toasts', 'gold', 'waveNo', 'speedBtn',
      'summonBtn', 'benchHint', 'bench', 'combineRows', 'sfxBtn', 'bgmBtn',
      'placeBar', 'placeBarText', 'placeBarCancel',
      'castleRows', 'heroPanel', 'hpTitle', 'hpInfo', 'recallBtn', 'sellBtn', 'moveHint',
      'diffRow',
      'storyModal', 'storyIcon', 'storyTitle', 'storyLines', 'storyNext', 'storyOff',
      'demoBtn', 'spectateBtn', 'demoBar', 'demoCaption', 'demoDetail', 'demoExit',
      'revealModal', 'revealCard', 'revealTier', 'revealArt', 'revealName', 'revealDesc',
      'wavePreview', 'bossBar', 'bossBarFill', 'bossBarName', 'bossWarnBanner',
      'saveBtn', 'loadBtn', 'loadFile',
      'sellModeBtn', 'sellInfo', 'sellAllBtn', 'sellGoBtn',
      'startModal', 'continueInfo', 'continueBtn', 'newGameBtn',
      'overModal', 'overStats', 'overShards', 'restartBtn', 'shareBtn', 'overMetaBtn',
      'metaModal', 'metaShards', 'metaRows', 'metaClose', 'tooltip',
      'bookBtn', 'bookDot', 'bookModal', 'bookTabs', 'bookBody', 'bookClose',
      'victoryModal', 'victoryTitle', 'victoryStats', 'victoryShards', 'victoryMsg',
      'victoryTrialBtn', 'victoryContinueBtn', 'victoryShareBtn', 'loopChip',
      'revealCard', 'rarityFlash',
      'tabs', 'heroDot', 'combineDot', 'helpBtn', 'helpBox',
      'champChip', 'champFace', 'champName', 'champLv', 'champKoTag', 'champHpFill', 'champXpFill',
      'spellBtn', 'spellCdFill', 'ultBtn', 'ultFill', 'skillBtn', 'spBadge',
      'skillModal', 'skillTitle', 'skillPts', 'skillCols', 'skillClose',
      'closetModal', 'closetPreview', 'closetName', 'closetRows', 'closetSave', 'closetClose',
    ].forEach(id => this.el[id] = $(id));
    this._lastKnow = -1;
    this._lastProbSig = '';
    this._tab = 'combine';
    this._tabBefore = null;
  }

  /* ---------- 오른쪽 패널 탭 ----------
   * 세 패널을 세로로 쌓으면 화면 두 배 길이가 된다 — 한 번에 하나만 보여 준다. */
  showTab(name) {
    this._tab = name;
    this.el.tabs.querySelectorAll('button').forEach(b =>
      b.classList.toggle('on', b.dataset.tab === name));
    document.querySelectorAll('.tabbody .pane').forEach(p =>
      p.classList.toggle('hidden', p.dataset.pane !== name));
    if (name === 'hero') this.el.heroDot.classList.add('hidden');
    if (name === 'combine') this.el.combineDot.classList.add('hidden');
  }
  /* ---------- 배치 중 안내 ----------
   * 전장 위 UI(웨이브 버튼 · 별지기 칩)가 하필 아래쪽 발판을 덮고 있어서,
   * 배치하는 동안에는 .placing 으로 비켜 준다. 안내 바는 전장 아래에 둔다 —
   * 위에 얹으면 또 발판을 가리니 안내가 방해가 된다.
   * hero 가 null 이면 배치 중이 아니다. */
  setPlacing(hero, label) {
    const on = !!hero;
    const stage = this.el.scene3d.parentElement;
    if (stage) stage.classList.toggle('placing', on);
    /* 바는 나타났다 사라지지 않는다 — 늘 같은 자리를 차지하고 문구만 바뀐다.
     * 배치할 때만 띄웠더니, 카드를 누르는 순간 벤치가 70px 아래로 밀려
     * 방금 누른 카드가 손가락 밑에서 도망갔다. 고치려던 문제를 새로 만든 셈. */
    this.el.placeBar.classList.toggle('on', on);
    this.el.placeBarText.textContent = on
      ? label
      : '🎲 용사를 소환하고, 카드를 눌러 배치하세요';
  }

  /* 용사를 고르면 잠깐 용사 탭으로 넘어갔다가, 선택을 풀면 원래 보던 탭으로 돌아온다 */
  showHeroTab() {
    if (this._tab === 'hero') return;
    this._tabBefore = this._tab;
    this.showTab('hero');
  }
  restoreTab() {
    if (this._tab !== 'hero') return;
    this.showTab(this._tabBefore || 'combine');
    this._tabBefore = null;
  }

  bind(h) {
    this.h = h;
    const el = this.el;
    el.waveBtn.addEventListener('click', h.onWaveStart);
    el.summonBtn.addEventListener('click', h.onSummon);
    el.placeBarCancel.addEventListener('click', h.onCancelPlace);
    el.speedBtn.addEventListener('click', h.onSpeed);
    el.sfxBtn.addEventListener('click', h.onToggleSfx);
    el.bgmBtn.addEventListener('click', h.onToggleBgm);
    el.metaBtn.addEventListener('click', h.onMetaOpen);
    el.overMetaBtn.addEventListener('click', h.onMetaOpen);
    el.metaClose.addEventListener('click', () => this.hideMeta());
    /* 도감·기록 */
    el.bookBtn.addEventListener('click', () => h.onBookOpen());
    el.bookClose.addEventListener('click', () => this.hideBook());
    el.bookTabs.querySelectorAll('button').forEach(b => {
      b.addEventListener('click', () => {
        this._bookTab = b.dataset.btab;
        el.bookTabs.querySelectorAll('button').forEach(v => v.classList.toggle('on', v === b));
        this._renderBookBody();
      });
    });
    /* 서른 번째 아침 (승리) */
    el.victoryTrialBtn.addEventListener('click', () => h.onTrial());
    el.victoryContinueBtn.addEventListener('click', () => h.onVictoryContinue());
    el.victoryShareBtn.addEventListener('click', h.onShare);
    el.restartBtn.addEventListener('click', h.onRestart);
    el.shareBtn.addEventListener('click', h.onShare);
    el.recallBtn.addEventListener('click', () => h.onRecall());
    el.sellBtn.addEventListener('click', () => h.onSell());
    /* 저장/불러오기 — "간단한 파일" 하나로 오간다 */
    el.saveBtn.addEventListener('click', () => h.onSave());
    el.loadBtn.addEventListener('click', () => el.loadFile.click());
    el.loadFile.addEventListener('change', () => {
      const f = el.loadFile.files && el.loadFile.files[0];
      el.loadFile.value = '';               // 같은 파일을 다시 골라도 change가 오게
      if (!f) return;
      f.text()
        .then(t => { let d = null; try { d = JSON.parse(t); } catch { /* 형식 오류 */ } h.onLoad(d); })
        .catch(() => h.onLoad(null));
    });
    /* 여러 명 판매 */
    el.sellModeBtn.addEventListener('click', () => h.onSellMode());
    el.sellAllBtn.addEventListener('click', () => h.onSellAll());
    el.sellGoBtn.addEventListener('click', () => h.onSellGo());
    /* 시작 메뉴 (이어하기 / 처음부터) */
    el.continueBtn.addEventListener('click', () => h.onContinue());
    el.newGameBtn.addEventListener('click', () => h.onStartNew());
    /* 별지기 */
    el.spellBtn.addEventListener('click', () => h.onSpell());
    el.ultBtn.addEventListener('click', () => h.onUlt());
    el.skillBtn.addEventListener('click', () => h.onSkillOpen());
    el.skillClose.addEventListener('click', () => this.hideSkills());
    /* 옷장 — 초상을 누르면 열린다 */
    el.champFace.addEventListener('click', () => h.onClosetOpen());
    el.closetSave.addEventListener('click', () => h.onClosetSave());
    el.closetClose.addEventListener('click', () => h.onClosetClose());
    /* 이름 입력창의 키는 게임 단축키로 새면 안 된다 (Esc만 통과시킨다) */
    el.closetName.addEventListener('keydown', (ev) => {
      if (ev.key !== 'Escape') ev.stopPropagation();
      if (ev.key === 'Enter') h.onClosetSave();
    });
    el.demoBtn.addEventListener('click', h.onDemoToggle);
    el.spectateBtn.addEventListener('click', h.onDemoToggle);
    el.demoExit.addEventListener('click', h.onDemoToggle);
    el.storyNext.addEventListener('click', h.onStoryClose);
    el.storyOff.addEventListener('click', h.onStoryOff);
    el.revealModal.addEventListener('click', h.onRevealClose);
    el.diffRow.querySelectorAll('button').forEach(b => {
      b.addEventListener('click', () => h.onDiff(b.dataset.d));
    });
    el.tabs.querySelectorAll('button').forEach(b => {
      b.addEventListener('click', () => { this._tabBefore = null; this.showTab(b.dataset.tab); });
    });
    /* 조작법은 접어 둔다 — 필요할 때만 펼치고, 평소엔 전장이 그만큼 커진다 */
    el.helpBtn.addEventListener('click', () => {
      const open = el.helpBox.classList.toggle('hidden');
      el.helpBtn.classList.toggle('on', !open);
    });

    /* 3D 씬 입력 */
    const scene = el.scene3d;
    scene.addEventListener('click', (ev) => {
      /* 드래그를 끝낸 직후에도 click이 한 번 더 온다 — 그건 무시한다 */
      if (this._afterDrag) return;
      h.onSceneClick(ev.clientX, ev.clientY);
    });
    scene.addEventListener('contextmenu', (ev) => {
      ev.preventDefault();                 // 우클릭 = 즉시 회수
      h.onSceneRightClick(ev.clientX, ev.clientY);
    });
    scene.addEventListener('mousemove', (ev) => {
      if (this._drag) return;              // 드래그 중에는 onDragMove가 담당
      h.onSceneMove(ev.clientX, ev.clientY);
    });
    scene.addEventListener('mouseleave', () => { if (!this._drag) h.onSceneMove(null, null); });

    /* --- 끌어서 옮기기 / 자리 바꾸기 ---
     * 배치된 용사를 집어서 다른 발판에 놓으면 이동하고, 이미 용사가 있으면 서로 자리를 바꾼다.
     * pointer 이벤트라 마우스·터치·펜이 모두 같은 코드로 동작한다. */
    scene.addEventListener('pointerdown', (ev) => {
      if (ev.button !== 0) return;
      this._down = { x: ev.clientX, y: ev.clientY, ok: false, moved: false };
    });
    window.addEventListener('pointermove', (ev) => {
      const d = this._down;
      if (!d) return;
      if (!d.moved && Math.hypot(ev.clientX - d.x, ev.clientY - d.y) > 6) {
        d.moved = true;
        d.ok = h.onDragStart(d.x, d.y);    // 집은 지점 기준으로 판정
        if (d.ok) { this._drag = true; scene.classList.add('dragging'); this.hideTooltip(); }
      }
      if (d.ok) h.onDragMove(ev.clientX, ev.clientY);
    });
    window.addEventListener('pointerup', (ev) => {
      const d = this._down;
      this._down = null;
      if (!d || !d.ok) return;
      this._drag = false;
      scene.classList.remove('dragging');
      h.onDragEnd(ev.clientX, ev.clientY);
      /* 이어서 날아오는 click 한 번만 삼킨다 */
      this._afterDrag = true;
      setTimeout(() => { this._afterDrag = false; }, 0);
    });
    /* 창 밖으로 나가거나 터치가 취소돼도 "잡은 채로" 남지 않게 */
    window.addEventListener('pointercancel', () => {
      if (!this._down) return;
      this._down = null;
      this._drag = false;
      scene.classList.remove('dragging');
      h.onDragEnd(null, null);
    });
  }

  /* ---------- HUD ---------- */
  updateHud(state, shards, best) {
    const el = this.el;
    el.gold.textContent = state.gold;
    el.waveNo.textContent = state.wave;
    /* 별의 시련 회차 — 1회차(첫 여정)에는 조용히 숨긴다 */
    const loop = state.loop || 0;
    if (this._loopN !== loop) {
      this._loopN = loop;
      el.loopChip.classList.toggle('hidden', !loop);
      el.loopChip.textContent = loop ? `🌟${loop + 1}회차` : '';
      el.loopChip.title = loop ? `별의 시련 ${loop + 1}회차 — 몬스터 체력 ×${D.loopHpMul(loop).toFixed(2)}` : '';
    }
    el.shards.textContent = shards;
    el.bestWave.textContent = best || '-';
    el.castleText.textContent = `${state.castleHp} / ${state.castleMax}`;
    const pct = state.castleMax ? (state.castleHp / state.castleMax) * 100 : 0;
    el.castleFill.style.width = `${pct}%`;
    el.castleGhost.style.width = `${pct}%`;
    /* 소환 버튼도 "왜 안 눌리는지"를 버튼 얼굴에 적는다 — 회색이 된 이유가 돈인지 자리인지 보이게 */
    const canPay = state.gold >= D.SUMMON_COST;
    const benchFull = state.bench.length >= D.BENCH_MAX;
    el.summonBtn.disabled = !canPay || benchFull || state.phase === 'over';
    el.summonBtn.classList.toggle('lack', !canPay && !benchFull);
    el.summonBtn.textContent = benchFull
      ? '🧺 벤치가 가득 찼어요 — 배치하거나 팔아요'
      : canPay ? `🎲 용사 소환 (💰 ${D.SUMMON_COST} · S)`
        : `💰${D.SUMMON_COST - state.gold} 더 모으면 소환! (💰${D.SUMMON_COST} 필요 · 지금 💰${state.gold})`;

  }

  setWaveUI(state) {
    const el = this.el;
    if (state.phase === 'prep') {
      el.waveBtn.textContent = `▶ ${state.wave}웨이브 시작!${D.isBossWave(state.wave) ? ' 🐉' : ''} (Space)`;
      el.waveBtn.classList.remove('hidden');
      el.waveInfo.classList.add('hidden');
    } else if (state.phase === 'wave') {
      el.waveBtn.classList.add('hidden');
      el.wavePreview.classList.add('hidden');
      el.waveInfo.classList.remove('hidden');
      el.remainN.textContent = `남은 몬스터 ${E.remainingEnemies(state)}`;
    } else {
      el.waveBtn.classList.add('hidden');
      el.wavePreview.classList.add('hidden');
      el.waveInfo.classList.add('hidden');
    }
    /* 난이도는 게임 시작 전(1웨이브 준비)에만 변경 가능 */
    const canDiff = state.phase === 'prep' && state.wave === 1;
    this.el.diffRow.querySelectorAll('button').forEach(b => {
      b.disabled = !canDiff;
      b.classList.toggle('on', b.dataset.d === state.difficulty);
    });
  }

  /* 콤보 칩 — 매 프레임 호출되므로 "값이 바뀔 때만" 다시 그린다.
   * (전에는 프레임마다 pop 애니메이션을 재시작해 글자가 계속 떨려 보였다) */
  comboChip(count, mul) {
    const el = this.el.comboChip;
    if (count >= 2) {
      if (this._comboCount !== count || this._comboMul !== mul) {
        this._comboCount = count;
        this._comboMul = mul;
        el.textContent = mul > 1 ? `🔥 콤보 ${count} · 골드 ${mul}배!` : `🔥 콤보 ${count}`;
        el.classList.remove('hidden');
        el.classList.toggle('boost', mul > 1);
        /* 배율이 올라가는 순간에만 튀어오르게 */
        if (this._comboMul !== this._popMul) {
          this._popMul = this._comboMul;
          el.classList.remove('pop');
          void el.offsetWidth;
          el.classList.add('pop');
        }
      }
    } else if (this._comboCount != null) {
      this._comboCount = null;
      this._comboMul = null;
      this._popMul = null;
      el.classList.add('hidden');
      el.classList.remove('pop', 'boost');
    }
  }

  /* ---------- 벤치 ----------
   * sell(Set)이 오면 판매 모드: 카드가 체크박스가 된다 — 가격을 크게, 고르면 ✓ */
  renderBench(state, selId, sell = null) {
    const el = this.el.bench;
    if (!state.bench.length) {
      el.innerHTML = '<div class="empty-msg">벤치가 비어 있어요.<br>용사를 소환해 보세요!</div>';
      this.el.benchHint.classList.add('hidden');
      return;
    }
    el.innerHTML = '';
    for (const hero of state.bench) {
      const C = D.CLASSES[hero.cls], T = D.TIERS[hero.tier];
      const d = document.createElement('div');
      const selling = !!sell && sell.has(hero.id);
      d.className = `hcard t${hero.tier}` + (selId === hero.id ? ' sel' : '') + (C.special ? ' sp' : '')
        + (sell ? ' sellable' : '') + (selling ? ' sellsel' : '');
      const m = E.heroMods(hero);
      const rl = rangeLabel(m.range);
      /* 사거리를 카드에 직접 표시 — 배치 판단의 핵심 정보 */
      const badges = [
        m.crit ? '<span class="bdg">💥</span>' : '',
        m.block ? '<span class="bdg">🛡️</span>' : '',
        m.splash ? '<span class="bdg">✹</span>' : '',
      ].join('');
      d.innerHTML =
        `<div class="em">${C.emoji}${badges ? `<span class="bdgs">${badges}</span>` : ''}</div>` +
        `<div class="nm">${C.name}</div>` +
        (sell
          ? `<div class="sellprice">💰${D.SELL_PRICE[hero.tier]}</div>`
          : `<div class="rg ${rl.cls}">🎯${m.range}</div>`) +
        `<div class="tr">${T.name}</div>` +
        (selling ? '<div class="sellcheck">✓</div>' : '');
      d.addEventListener('click', () =>
        sell ? this.h.onSellToggle(hero.id) : this.h.onBenchSelect(hero.id));
      d.addEventListener('mouseenter', (ev) => this.showTooltip(hero, state, ev.clientX, ev.clientY));
      d.addEventListener('mousemove', (ev) => this.moveTooltip(ev.clientX, ev.clientY));
      d.addEventListener('mouseleave', () => this.hideTooltip());
      el.appendChild(d);
    }
    this.el.benchHint.classList.toggle('hidden', sell != null || selId == null);
  }

  /* 판매 모드 바 — 고른 인원과 받을 골드를 항상 보여 준다 */
  renderSellBar(state, on, sel) {
    const el = this.el;
    el.sellModeBtn.textContent = on ? '✕ 판매 끝내기 (Esc)' : '💰 여러 명 판매';
    el.sellModeBtn.classList.toggle('on', on);
    el.sellInfo.classList.toggle('hidden', !on);
    el.sellAllBtn.classList.toggle('hidden', !on);
    el.sellGoBtn.classList.toggle('hidden', !on);
    if (!on) return;
    const picked = state.bench.filter(h => sel.has(h.id));
    const total = picked.reduce((s, h) => s + D.SELL_PRICE[h.tier], 0);
    el.sellInfo.textContent = picked.length
      ? `${picked.length}명 선택 · 💰${total}`
      : '카드를 눌러 골라요';
    const allPicked = state.bench.length > 0 && picked.length === state.bench.length;
    el.sellAllBtn.textContent = allPicked ? '전체 해제' : '전체 선택';
    el.sellGoBtn.textContent = picked.length ? `💰${total} 받고 팔기` : '팔기';
    el.sellGoBtn.disabled = !picked.length;
  }

  /* 부족한 재료가 "조합으로만 나오는 직업"일 때, 그 레시피 줄로 데려다 준다.
   * 말로 "마검사부터 만드세요"라고 쓰는 것보다 눈으로 짚어 주는 편이 확실하다. */
  gotoRecipe(cls) {
    const row = [...this.el.combineRows.querySelectorAll('.combine-row.recipe')]
      .find(el => { const p = el.querySelector('.peek'); return p && p.dataset.cls === cls; });
    if (!row) return;
    row.scrollIntoView({ block: 'center', behavior: 'smooth' });
    row.classList.remove('flash');
    void row.offsetWidth;
    row.classList.add('flash');
  }

  /* ---------- 조합 (3세대 도감: 등급업 / 특수 / 신화) ---------- */
  renderCombine(state) {
    const combos = E.listCombos(state);
    /* 다른 탭을 보고 있어도 "지금 조합할 수 있다"를 놓치지 않게 점을 찍는다 */
    this.el.combineDot.classList.toggle('hidden',
      this._tab === 'combine' || !combos.some(c => c.affordable));
    const byResult = new Map(combos.filter(c => c.kind === 'recipe').map(c => [c.result, c]));
    let html = '';

    /* 지금 당장 되는 것을 맨 위에 모은다 — 아이는 스크롤하지 않는다.
     * "확실히 알고, 되면 착착"의 핵심이라 규칙 안내보다도 위에 둔다. */
    const ready = combos.filter(c => c.affordable);
    if (ready.length) {
      html += `<div class="combine-now"><div class="now-title">⚡ 지금 바로 조합!</div>`;
      for (const c of ready) {
        const R = D.CLASSES[c.result];
        const what = c.kind === 'rankup'
          ? `${D.CLASSES[c.cls].emoji} ${D.CLASSES[c.cls].name} ${D.TIERS[c.tier].name}×2`
          : `${D.CLASSES[c.a].emoji}+${D.CLASSES[c.b].emoji}`;
        html += `<button class="now-btn" data-kind="${c.kind}"
          ${c.kind === 'rankup' ? `data-cls="${c.cls}" data-tier="${c.tier}"` : `data-result="${c.result}"`}
          style="border-color:${D.TIERS[c.resultTier].color}">
          <span class="now-what">${what}</span>
          <span class="now-arrow">→</span>
          <span class="now-res" style="color:${D.TIERS[c.resultTier].color}">${R.emoji} ${D.TIERS[c.resultTier].name} ${R.name}</span>
          <span class="now-cost">💰${c.cost}</span>
        </button>`;
      }
      html += `</div>`;
    }

    /* 규칙을 화면에 못 박아 둔다 — 헷갈리면 조합을 안 하게 된다 */
    html += `<div class="combine-rule">
      <b>규칙</b> 조합은 <b>같은 등급 2명</b>끼리만! ① 같은 직업 = 등급 UP ② 다른 직업 = 새 직업(등급 UP)<br>
      <b>모든 직업이 신화까지</b> 올라요 — 전설 2명이면 신화! 그중에서도 ⚡😇🌌 신화 용사가 최강<br>
      <b>🌌 전술판</b>은 전투 중에만 작동해요. 별을 맞춘 <b>열</b>이 길을 고르고, 별의 <b>색</b>이 유성·서리·수호 전술을 정해요.<br>
      조합은 준비 단계에서 <b>골드만</b> 내면 바로 완성돼요 — 전투 중엔 별자리로 진형을 지키세요
    </div>`;

    /* 돈이 모자란 줄이 "지금 된다"처럼 보이면 안 된다.
     * 얼마가 모자란지 동전으로 적어 주고(버튼 옆), 버튼은 아예 잠근다 —
     * 눌러 봤자 토스트만 뜨는 버튼은 "되는 줄 알았는데"라는 실망만 남긴다. */
    const shortBadge = (cost) => state.gold >= cost ? ''
      : `<span class="gshort" title="골드가 💰${cost - state.gold} 모자라요 (필요 💰${cost} · 지금 💰${state.gold})">💰${cost - state.gold} 부족</span>`;

    /* ① 등급업 — 같은 용사 2명 */
    const rankups = combos.filter(c => c.kind === 'rankup');
    html += `<div class="combine-sub">⬆ 등급업 <span class="cnt">같은 용사·같은 등급 2명 (배치된 용사도 재료 OK)</span></div>`;
    if (!rankups.length) {
      html += `<div class="combine-empty">같은 직업·같은 등급 용사 2명을 모아 보세요</div>`;
    }
    /* 전설에서 막힌 용사가 있으면 왜 막혔는지 알려준다 */
    const capped = [...new Set([...state.bench, ...state.field]
      .filter(h => h.tier >= D.maxTierOf(h.cls) && !D.CLASSES[h.cls].mythic)
      .map(h => h.cls))];
    if (capped.length) {
      html += `<div class="combine-empty">${capped.map(c => D.CLASSES[c].emoji).join('')} 전설은 최고 등급이에요 —
        <b>신화</b>가 되려면 아래 <b>신화 조합</b>으로 신화 용사를 만들어야 해요</div>`;
    }
    for (const c of rankups) {
      const C = D.CLASSES[c.cls];
      html += `<div class="combine-row${c.affordable ? ' ready' : ' broke'}">
        <span class="peek" data-cls="${c.cls}" data-rtier="${c.resultTier}">${C.emoji}</span> ${C.name}
        <span class="cnt" style="color:${D.TIERS[c.tier].color}">${D.TIERS[c.tier].name}×2</span>
        ${shortBadge(c.cost)}
        <button data-kind="rankup" data-cls="${c.cls}" data-tier="${c.tier}"
          class="${!c.affordable ? 'lack' : ''}" ${!c.affordable ? 'disabled' : ''}>⚗ ${D.TIERS[c.resultTier].name} 💰${c.cost}</button>
      </div>`;
    }

    /* ②③ 레시피 도감 — 특수(2세대) / 신화(3세대)
     * "재료 하나 더"라고만 쓰면 무엇이 모자란지 알 수가 없다.
     * 부족한 재료를 크게 그리고, 그 자리에서 바로 할 행동(소환/선행 조합)을 준다. */
    const RECIPE_STATE_LABEL = {
      ready: '', gold: '골드 부족', material: '재료 필요', cap: '등급 천장', gap: '등급 안 맞음',
    };
    const renderRecipes = (gen) => {
      let out = '';
      for (const r of D.RECIPES.filter(x => x.gen === gen)) {
        const A = D.CLASSES[r.a], B = D.CLASSES[r.b], R = D.CLASSES[r.result];
        const c = byResult.get(r.result);
        const made = state.discovered && state.discovered.has(r.result);
        const st = E.recipeStatus(state, r, c ? c.cost : null);
        const rtier = c ? c.resultTier : (st.resultTier != null ? st.resultTier : (gen === 3 ? 3 : 1));
        const ta = st.ta, tb = st.tb;

        let right;
        if (st.state === 'ready' || st.state === 'gold') {
          /* 골드가 모자라면 얼마가 모자란지 적고 버튼을 잠근다 — 재료는 다 모았다는 표시(초록 재료)는 그대로다 */
          const broke = st.state === 'gold';
          right = `${shortBadge(st.cost)}<button data-kind="recipe" data-result="${r.result}"
            class="${broke ? 'lack' : ''}" ${broke ? 'disabled' : ''}>⚗ ${D.TIERS[rtier].name} 💰${st.cost}</button>`;
        } else if (st.state === 'cap') {
          right = `<span class="cnt need">더 안 올라요 — 🌌 신화 조합으로</span>`;
        } else if (st.state === 'gap') {
          /* 두 직업 다 있는데 같은 등급 짝이 없다 — 무엇의 등급을 맞추면 되는지 알려준다 */
          const L = D.CLASSES[st.low];
          right = `<span class="cnt need" title="조합은 같은 등급 2명끼리만 돼요 — 등급을 맞춰 주세요">
            ⚖️ 같은 등급끼리만! ${L.emoji} ${L.name} 등급을 맞춰요</span>`;
        } else {
          /* 부족한 재료를 어떻게 구하는가로 버튼이 갈린다:
           *   기본 4직업 → 소환하면 나온다 · 조합으로만 나오는 직업 → 그 레시피로 보낸다 */
          const need = st.missing[0];
          const N = D.CLASSES[need];
          const byCombine = D.RECIPES.some(x => x.result === need);
          /* 소환도 돈이 든다 — 뽑을 돈이 없으면 "뽑으러 가기"도 잠근다 */
          const canSummon = state.gold >= D.SUMMON_COST;
          right = byCombine
            ? `<button data-goto="${need}" class="need">${N.emoji} ${N.name}부터 만들기</button>`
            : `${shortBadge(D.SUMMON_COST)}<button data-need="${need}"
                class="need${canSummon ? '' : ' lack'}" ${canSummon ? '' : 'disabled'}>🎲 ${N.emoji} ${N.name} 뽑으러 가기</button>`;
        }

        /* 재료 등급을 배지로 — 조합이 되는 줄은 "실제로 쓸 재료", 아니면 "보유 최고" */
        const usedNow = st.state === 'ready' || st.state === 'gold';
        const tierBadge = (t) => t == null || t < 0 ? ''
          : `<span class="ingt" style="background:${D.TIERS[t].color}">${D.TIERS[t].name[0]}</span>`;
        const ing = (cls, C, t) => {
          const have = t >= 0;
          const note = have
            ? ` (${usedNow ? '재료로 쓸 등급' : '보유 최고'}: ${D.TIERS[t].name})`
            : ' — 아직 없어요';
          return `<span class="ing${have ? ' have' : ' lack'}" title="${C.name}${note}">${C.emoji}${have ? tierBadge(t) : '<span class="ingx">?</span>'}</span>`;
        };
        out += `<div class="combine-row recipe s-${st.state}${gen === 3 ? ' mythic' : ''}">
          ${ing(r.a, A, ta)}+${ing(r.b, B, tb)}
          <span class="rarrow">→</span>
          <span class="peek" data-cls="${r.result}" data-rtier="${rtier}">${R.emoji} <b>${R.name}</b>${made ? ' <span class="found">✓</span>' : ''}</span>
          ${right}
        </div>`;
      }
      return out;
    };

    html += `<div class="combine-sub">✨ 특수 조합 <span class="cnt">서로 다른 두 직업 · 같은 등급 2명 → 등급 +1</span></div>`;
    html += renderRecipes(2);
    html += `<div class="combine-sub mythic">🌌 신화 조합 <span class="cnt">특수 2종 → 신화 용사 · 재료가 <b>전설</b>이면 결과가 <b>신화</b>!</span></div>`;
    html += renderRecipes(3);

    this.el.combineRows.innerHTML = html;
    /* 버튼은 세 종류다 — 조합(data-kind) / 소환하러(data-need) / 선행 조합으로(data-goto).
     * 셀렉터를 좁히지 않으면 새 버튼이 onCombine으로 잘못 흘러가 아무 일도 안 일어난다. */
    this.el.combineRows.querySelectorAll('button[data-kind]').forEach(b => {
      b.addEventListener('click', () => this.h.onCombine({ ...b.dataset }));
    });
    this.el.combineRows.querySelectorAll('button[data-need]').forEach(b => {
      b.addEventListener('click', () => this.h.onNeedHero(b.dataset.need));
    });
    this.el.combineRows.querySelectorAll('button[data-goto]').forEach(b => {
      b.addEventListener('click', () => this.gotoRecipe(b.dataset.goto));
    });
    /* 결과 캐릭터에 커서를 올리면 "무엇이 나올지" 미리 보여준다 */
    this.el.combineRows.querySelectorAll('.peek').forEach(sp => {
      const cls = sp.dataset.cls;
      const tier = Number(sp.dataset.rtier);
      sp.addEventListener('mouseenter', (ev) =>
        this.showTooltip(previewHero(cls, tier, state), state, ev.clientX, ev.clientY, true));
      sp.addEventListener('mousemove', (ev) => this.moveTooltip(ev.clientX, ev.clientY));
      sp.addEventListener('mouseleave', () => this.hideTooltip());
    });
  }

  /* ---------- 성 업그레이드 ---------- */
  renderCastlePanel(state) {
    let html = '';
    const hotkeys = { repair: '7', fortify: '8', tower: '9' };
    for (const [key, U] of Object.entries(D.CASTLE_UPGRADES)) {
      const n = key === 'repair' ? 0 : state.castle[key];
      const maxed = U.max && n >= U.max;
      const cost = U.cost(n);
      const full = key === 'repair' && state.castleHp >= state.castleMax;
      /* 못 누르는 이유가 셋이다 — MAX / 이미 가득 / 돈 부족.
       * 회색 버튼만 두면 셋이 구분이 안 되니 돈 부족은 동전으로 따로 적어 준다. */
      const broke = !maxed && !full && state.gold < cost;
      const disabled = maxed || full || broke || state.phase === 'over';
      const lvLabel = U.max && key !== 'repair' ? ` <span class="cnt">${n}/${U.max}</span>` : '';
      html += `<div class="combine-row${broke ? ' broke' : ''}">
        <span>${U.emoji}</span> ${U.name}<span class="kbd">${hotkeys[key]}</span>${lvLabel}
        <span class="cdesc">${U.desc}</span>
        ${broke ? `<span class="gshort" title="골드가 💰${cost - state.gold} 모자라요 (필요 💰${cost} · 지금 💰${state.gold})">💰${cost - state.gold} 부족</span>` : ''}
        <button data-key="${key}" class="${broke ? 'lack' : ''}" ${disabled ? 'disabled' : ''}>${maxed ? 'MAX' : full ? '가득' : `💰${cost}`}</button>
      </div>`;
    }
    /* 잔치 — 돈을 태워 랜덤 승급. 준비 단계에 한 번뿐이라 "이번엔 끝"을 분명히 보여 준다 */
    const fCost = D.feastCost(state.wave);
    const fDone = state.feastWave === state.wave;
    const fCands = [...state.bench, ...state.field].some(h => h.tier < D.maxTierOf(h.cls));
    const fBroke = !fDone && fCands && state.gold < fCost;
    const fDisabled = fDone || !fCands || fBroke || state.phase !== 'prep';
    html += `<div class="combine-row feast${fBroke ? ' broke' : ''}">
      <span>🎉</span> 잔치 벌이기
      <span class="cdesc">${fDone ? '이번 준비엔 벌써 즐겼어요 — 다음 웨이브에 또!'
        : !fCands ? '전원 신화라 승급할 용사가 없어요!'
        : '병사들과 한바탕! 용사 하나가 <b>랜덤 승급</b>해요 (준비마다 1번)'}</span>
      ${fBroke ? `<span class="gshort" title="골드가 💰${fCost - state.gold} 모자라요">💰${fCost - state.gold} 부족</span>` : ''}
      <button data-key="feast" class="${fBroke ? 'lack' : ''}" ${fDisabled ? 'disabled' : ''}>${fDone ? '🎉 완료' : `💰${fCost}`}</button>
    </div>`;
    this.el.castleRows.innerHTML = html;
    this.el.castleRows.querySelectorAll('button').forEach(b => {
      b.addEventListener('click', () =>
        b.dataset.key === 'feast' ? this.h.onFeast() : this.h.onCastle(b.dataset.key));
    });
  }

  /* ---------- 용사 패널 (벤치/필드 공용) ---------- */
  renderHeroPanel(state, heroId) {
    const el = this.el;
    const hero = state.field.find(v => v.id === heroId) || state.bench.find(v => v.id === heroId);
    /* 탭 안에 있으므로 패널 자체는 숨기지 않는다 — 고른 용사가 없으면 안내만 띄운다 */
    if (!hero) {
      el.heroDot.classList.add('hidden');
      el.hpTitle.textContent = '🧍 선택한 용사';
      el.hpInfo.innerHTML = '<div class="empty-msg">전장의 용사나 벤치 카드를 클릭하면<br>자세한 정보가 여기 나와요.</div>';
      el.moveHint.classList.add('hidden');
      el.recallBtn.classList.add('hidden');
      el.sellBtn.classList.add('hidden');
      return;
    }
    el.sellBtn.classList.remove('hidden');
    if (this._tab !== 'hero') el.heroDot.classList.remove('hidden');
    const C = D.CLASSES[hero.cls], T = D.TIERS[hero.tier];
    const onField = hero.padIndex >= 0;
    el.hpTitle.textContent = onField ? '🧍 선택한 용사 (배치됨)' : '🧍 선택한 용사 (벤치)';
    el.hpInfo.innerHTML = describeHero(hero, state);
    el.recallBtn.textContent = '↩ 회수 (R / 우클릭)';
    el.recallBtn.classList.toggle('hidden', !onField);
    el.sellBtn.textContent = `💰 판매 +${D.SELL_PRICE[hero.tier]} (X)`;
    el.moveHint.classList.toggle('hidden', !onField);
  }

  /* ---------- 상세 정보 툴팁 ---------- */
  showTooltip(hero, state, cx, cy, preview) {
    const tt = this.el.tooltip;
    tt.innerHTML = describeHero(hero, state, preview);
    tt.classList.toggle('preview', !!preview);
    tt.classList.remove('hidden');
    this.moveTooltip(cx, cy);
  }
  moveTooltip(cx, cy) {
    const tt = this.el.tooltip;
    if (tt.classList.contains('hidden')) return;
    const r = tt.getBoundingClientRect();
    let x = cx + 16, y = cy + 14;
    if (x + r.width > window.innerWidth - 8) x = cx - r.width - 16;
    if (y + r.height > window.innerHeight - 8) y = Math.max(8, cy - r.height - 14);
    tt.style.left = `${Math.max(8, x)}px`;
    tt.style.top = `${Math.max(8, y)}px`;
  }
  hideTooltip() { this.el.tooltip.classList.add('hidden'); }

  /* ---------- 다음 웨이브 미리보기 ---------- */
  renderWavePreview(state, counts) {
    const el = this.el.wavePreview;
    if (state.phase !== 'prep') { el.classList.add('hidden'); return; }
    const chips = Object.entries(counts)
      .map(([type, n]) => {
        const T = D.ENEMY_TYPES[type];
        const cls = T.boss ? ' boss' : (T.midBoss ? ' midboss' : '');
        return `<span class="wchip${cls}">${T.emoji}×${n}</span>`;
      })
      .join('');
    /* 신화 용사를 데리고 있으면 몬스터가 그만큼 단단해진다 — 시작 전에 알려 준다.
     * 말없이 체력만 올리면 "왜 갑자기 안 죽지?"가 되고, 그건 버그처럼 느껴진다. */
    const press = E.mythicCount(state);
    const warn = press > 0
      ? `<span class="wchip myth" title="신화 용사 ${press}명 — 몬스터 체력 +${Math.round((D.mythicHpMul(press) - 1) * 100)}% · 골드 +${Math.round((D.mythicGoldMul(press) - 1) * 100)}%">🌌 체력 +${Math.round((D.mythicHpMul(press) - 1) * 100)}% · 💰 +${Math.round((D.mythicGoldMul(press) - 1) * 100)}%</span>`
      : '';
    el.innerHTML = `<span class="wlabel">다음 웨이브</span>${chips}${warn}`;
    el.classList.remove('hidden');
  }

  /* ---------- 보스 체력바 (이름 + 등급별 색) ---------- */
  setBossBar(info) {
    const el = this.el.bossBar;
    if (!info) { el.classList.add('hidden'); this._bossBarKey = null; return; }
    el.classList.remove('hidden');
    const key = `${info.name}|${info.great}`;
    if (this._bossBarKey !== key) {
      this._bossBarKey = key;
      this.el.bossBarName.textContent = `${info.emoji} ${info.name}`;
      el.classList.toggle('great', !!info.great);
      el.classList.toggle('mid', !info.great);
    }
    el.classList.toggle('enraged', !!info.enraged);
    this.el.bossBarFill.style.width = `${Math.max(0, info.ratio * 100)}%`;
  }

  /* 등장 경고 배너 */
  bossWarn(tier, name, emoji) {
    const el = this.el.bossWarnBanner;
    const great = tier === 'great';
    el.textContent = great ? `⚠️ 대보스 ${emoji} ${name} 접근!!` : `⚠️ 중간보스 ${emoji} ${name} 접근!`;
    el.classList.toggle('great', great);
    el.classList.remove('hidden');
    clearTimeout(this._warnT);
    this._warnT = setTimeout(() => el.classList.add('hidden'), 2600);
    /* 화면 가장자리 붉은 경고 점멸 */
    const stage = this.el.scene3d.parentElement;
    stage.classList.add('warning');
    clearTimeout(this._warnStageT);
    this._warnStageT = setTimeout(() => stage.classList.remove('warning'), 2600);
  }

  /* 보스 등장/분노 배너 */
  showBossBanner(tier, name, emoji) {
    const el = this.el.bossBanner;
    const great = tier === 'great';
    el.textContent = great ? `${emoji} ${name} 등장!!` : `${emoji} ${name} 등장!`;
    el.classList.toggle('mid', !great);
    el.classList.remove('hidden');
    clearTimeout(this._bossT);
    this._bossT = setTimeout(() => el.classList.add('hidden'), 2400);
  }
  showEnrage(name) {
    const el = this.el.bossBanner;
    el.textContent = `🔥 ${name} 분노!! 더 빨라졌어요!`;
    el.classList.remove('mid');
    el.classList.remove('hidden');
    clearTimeout(this._bossT);
    this._bossT = setTimeout(() => el.classList.add('hidden'), 2200);
  }
  /* 보스 전투 중 화면 분위기 */
  setBossAtmosphere(level) {
    const stage = this.el.scene3d.parentElement;
    stage.classList.toggle('boss-mid', level === 1);
    stage.classList.toggle('boss-great', level === 2);
  }

  /* ---------- 별의 축복 (메타) ---------- */
  renderMeta(shards, levels) {
    this.el.metaShards.textContent = shards;
    let html = '';
    for (const [key, M] of Object.entries(D.META_UPGRADES)) {
      const lv = levels[key] || 0;
      const maxed = lv >= M.max;
      const cost = M.cost(lv);
      html += `<div class="meta-row">
        <span class="memoji">${M.emoji}</span>
        <div class="minfo"><b>${M.name}</b> <span class="cnt">Lv ${lv}/${M.max}</span><br>
        <span class="cdesc">레벨당 ${M.per}</span></div>
        <button data-key="${key}" ${maxed || shards < cost ? 'disabled' : ''}>${maxed ? 'MAX' : `✨${cost}`}</button>
      </div>`;
    }
    this.el.metaRows.innerHTML = html;
    this.el.metaRows.querySelectorAll('button').forEach(b => {
      b.addEventListener('click', () => this.h.onMetaBuy(b.dataset.key));
    });
  }
  showMeta() { this.el.metaModal.classList.remove('hidden'); }
  hideMeta() { this.el.metaModal.classList.add('hidden'); }

  /* ---------- 도감 · 기록 ----------
   * 데이터는 열 때 main이 통째로 넘긴다(renderBook). 탭 전환은 넘겨받은 데이터로
   * 다시 그리기만 한다 — 게임이 멈춰 있는 동안 값이 변하지 않으므로 안전하다. */
  renderBook(data) {
    this._bookData = data;
    if (!this._bookTab) this._bookTab = 'heroes';
    this.el.bookTabs.querySelectorAll('button').forEach(b =>
      b.classList.toggle('on', b.dataset.btab === this._bookTab));
    this._renderBookBody();
  }
  _renderBookBody() {
    const d = this._bookData;
    if (!d) return;
    const tab = this._bookTab || 'heroes';
    let html = '';
    if (tab === 'heroes') html = this._bookHeroes(d);
    else if (tab === 'enemies') html = this._bookEnemies(d);
    else if (tab === 'ach') html = this._bookAch(d);
    else html = this._bookTactics(d);
    this.el.bookBody.innerHTML = html;
  }

  _bookHeroes(d) {
    const filled = Object.keys(d.codex.heroes).filter(k => d.codex.heroes[k] > 0).length;
    let html = `<div class="book-progress">채운 칸 <b>${filled}</b> / ${D.CODEX_HERO_CELLS}
      <span class="cnt">용사를 만들면 칸이 채워져요 — 소환·조합·잔치 모두!</span></div>`;
    for (const cls of D.CLASS_KEYS) {
      const C = D.CLASSES[cls];
      const min = D.minTierOf(cls);
      const known = Object.keys(d.codex.heroes).some(k => k.startsWith(cls + ':') && d.codex.heroes[k] > 0);
      let cells = '';
      for (let t = min; t <= D.MAX_TIER; t++) {
        const n = d.codex.heroes[`${cls}:${t}`] || 0;
        cells += n > 0
          ? `<span class="bkcell on" style="background:${D.TIERS[t].color}" title="${D.TIERS[t].name} ${C.name} — ${n}번 만들었어요">${D.TIERS[t].name[0]}</span>`
          : `<span class="bkcell" title="${D.TIERS[t].name} ${C.name} — 아직 못 만들었어요">?</span>`;
      }
      const tag = C.mythic ? '<span class="bktag mythic">신화</span>'
        : C.special ? '<span class="bktag sp">특수</span>' : '';
      html += `<div class="book-row${known ? '' : ' unknown'}">
        <span class="bkemoji">${known ? C.emoji : '❓'}</span>
        <span class="bkname">${known ? C.name : '???'}${tag}</span>
        <span class="bkcells">${cells}</span>
      </div>`;
    }
    return html;
  }

  _bookEnemies(d) {
    const types = Object.keys(D.ENEMY_TYPES);
    const met = types.filter(t => (d.codex.kills[t] || 0) > 0).length;
    let html = `<div class="book-progress">물리친 종류 <b>${met}</b> / ${types.length}
      <span class="cnt">한 번이라도 물리치면 도감에 실려요</span></div>`;
    for (const t of types) {
      const E2 = D.ENEMY_TYPES[t];
      const n = d.codex.kills[t] || 0;
      const tag = E2.boss ? '<span class="bktag boss">대보스</span>'
        : E2.midBoss ? '<span class="bktag mid">중간보스</span>' : '';
      html += n > 0
        ? `<div class="book-row"><span class="bkemoji">${E2.emoji}</span>
            <span class="bkname">${E2.name}${tag}</span>
            <span class="bkkills">⚔️ ${n.toLocaleString()}마리</span></div>`
        : `<div class="book-row unknown"><span class="bkemoji">❓</span>
            <span class="bkname">???${tag}</span>
            <span class="bkkills">아직 못 만났어요</span></div>`;
    }
    return html;
  }

  _bookAch(d) {
    const done = D.ACHIEVEMENTS.filter(a => d.earned[a.key]).length;
    let html = `<div class="book-progress">달성 <b>${done}</b> / ${D.ACHIEVEMENTS.length}
      <span class="cnt">달성하면 ✨별조각을 받아요 — 🪞 표시는 옷장이 열려요!</span></div>`;
    for (const a of D.ACHIEVEMENTS) {
      const got = !!d.earned[a.key];
      const wardrobe = a.unlocks
        ? `<span class="bkunlock">🪞 ${D.CHAMP_WARDROBE[a.unlocks.axis].name}: ${D.CHAMP_WARDROBE[a.unlocks.axis].options[a.unlocks.key].name}</span>`
        : '';
      html += `<div class="book-row ach${got ? ' done' : ''}">
        <span class="bkemoji">${a.emoji}</span>
        <div class="bkach">
          <div class="bkname">${a.name} ${got ? '<span class="bkdone">✓ 달성!</span>' : ''}</div>
          <div class="bkdesc">${a.desc}</div>
        </div>
        <span class="bkreward">✨${a.shards}${wardrobe}</span>
      </div>`;
    }
    return html;
  }

  _bookTactics() {
    return `<div class="tactic-summary">
      <div class="msbox"><b>☄️</b><span>유성 성좌</span></div>
      <div class="msbox"><b>❄️</b><span>서리 성좌</span></div>
      <div class="msbox"><b>🛡️</b><span>수호 성좌</span></div>
    </div>
    <div class="combine-empty">전투 중 6×6 별자리 전술판에서 이웃한 별을 바꾸세요. 3개를 맞추면 그 열의 길에 전술이 내려가고, 4개와 5개는 더 큰 성좌가 됩니다.</div>`;
  }

  showBook() { this.el.bookModal.classList.remove('hidden'); this.el.bookDot.classList.add('hidden'); }
  hideBook() { this.el.bookModal.classList.add('hidden'); }
  isBookOpen() { return !this.el.bookModal.classList.contains('hidden'); }
  /* 새 업적을 딴 순간 도감 버튼에 점을 찍는다 — 열면 사라진다 */
  pingBook() { if (!this.isBookOpen()) this.el.bookDot.classList.remove('hidden'); }

  /* ---------- 서른 번째 아침 (승리) ---------- */
  showVictory({ loop, shards, state }) {
    const el = this.el;
    const run = (loop || 0) + 1;
    el.victoryTitle.textContent = run > 1 ? `서른 번째 아침 — ${run}번째 여정` : '🌅 서른 번째 아침';
    el.victoryStats.innerHTML =
      `🌊 <b>30웨이브</b>를 지켜냈어요! (${D.DIFFICULTIES[state.difficulty].name}${run > 1 ? ` · ${run}회차` : ''})<br>
       👾 물리친 몬스터 <b>${state.kills}</b> · 🌌 신화 <b>${state.mythicsMade}</b> ·
       🌌 전술판으로 길을 지키며 별의 시련을 이어가요<br>
       🌠 별지기 <b>Lv ${state.champ ? state.champ.level : 1}</b> — 다음 여정에도 그대로 함께해요`;
    el.victoryShards.textContent = `✨ 별조각 +${shards} 획득!`;
    el.victoryTrialBtn.textContent = `🌟 별의 시련 — ${run + 1}회차 도전!`;
    el.victoryModal.classList.remove('hidden');
    setTimeout(() => el.victoryContinueBtn.focus(), 30);
  }
  hideVictory() { this.el.victoryModal.classList.add('hidden'); }
  isVictoryOpen() { return !this.el.victoryModal.classList.contains('hidden'); }

  /* ---------- 별지기 칩 ----------
   * 매 프레임 불리므로 "값이 바뀔 때만" DOM을 만진다 (comboChip과 같은 규칙). */
  setChampFace(url) {
    if (!url) return;                      // 초상 생성 실패 → 이모지 그대로
    this.el.champFace.innerHTML = `<img src="${url}" alt="별지기 루나">`;
  }
  updateChampChip(state) {
    const c = state.champ;
    const el = this.el;
    if (!c) { el.champChip.classList.add('hidden'); return; }
    const S = E.champStats(state);
    const wave = state.phase === 'wave';

    if (this._chLv !== c.level) {
      this._chLv = c.level;
      el.champLv.textContent = `Lv ${c.level}`;
      el.champLv.classList.remove('pop');
      void el.champLv.offsetWidth;
      el.champLv.classList.add('pop');
    }
    if (this._chKo !== c.ko) {
      this._chKo = c.ko;
      el.champChip.classList.toggle('ko', c.ko);
      el.champKoTag.classList.toggle('hidden', !c.ko);
    }
    const hpPct = Math.round(c.maxHp ? (c.hp / c.maxHp) * 100 : 0);
    if (this._chHp !== hpPct) {
      this._chHp = hpPct;
      el.champHpFill.style.width = `${hpPct}%`;
      el.champHpFill.className = hpPct < 30 ? 'low' : hpPct < 60 ? 'mid' : '';
    }
    const need = D.champXpNeed(c.level);
    const xpPct = c.level >= D.CHAMP_XP.maxLevel ? 100 : Math.min(100, Math.round((c.xp / need) * 100));
    if (this._chXp !== xpPct) {
      this._chXp = xpPct;
      el.champXpFill.style.width = `${xpPct}%`;
    }
    /* 별똥별 — 쿨다운이 차오르는 게이지 (가득 = 준비 완료) */
    const cdPct = Math.round(c.spellCd > 0 ? (1 - c.spellCd / S.starCd) * 100 : 100);
    const spellSig = `${cdPct}|${wave}|${c.ko}`;
    if (this._chSpell !== spellSig) {
      this._chSpell = spellSig;
      el.spellCdFill.style.height = `${100 - cdPct}%`;
      el.spellBtn.disabled = !wave || c.ko || c.spellCd > 0;
      el.spellBtn.classList.toggle('ready', wave && !c.ko && c.spellCd <= 0);
    }
    const ultPct = Math.round(c.ult * 100);
    const ultSig = `${ultPct}|${wave}|${c.ko}`;
    if (this._chUlt !== ultSig) {
      this._chUlt = ultSig;
      el.ultFill.style.height = `${ultPct}%`;
      el.ultBtn.disabled = !wave || c.ko || c.ult < 1;
      el.ultBtn.classList.toggle('full', c.ult >= 1 && !c.ko);
      el.ultBtn.title = c.ult >= 1
        ? '은하수 — 지금이에요! 모든 적을 때리고 얼려요 (E)'
        : `은하수 — 충전 ${ultPct}% (처치할수록 차요)`;
    }
    if (this._chSp !== c.sp) {
      this._chSp = c.sp;
      el.spBadge.textContent = c.sp;
      el.spBadge.classList.toggle('hidden', c.sp <= 0);
      el.skillBtn.classList.toggle('has-sp', c.sp > 0);
    }
  }

  /* ---------- 별자리 (스킬트리) ---------- */
  renderSkills(state) {
    const c = state.champ;
    this.el.skillPts.textContent = c.sp;
    let html = '';
    for (const [bk, B] of Object.entries(D.CHAMP_BRANCHES)) {
      html += `<div class="skill-branch"><h3>${B.emoji} ${B.name}</h3>`;
      for (const [key, SK] of Object.entries(D.CHAMP_SKILLS)) {
        if (SK.branch !== bk) continue;
        const rank = c.skills[key] || 0;
        const spent = E.branchSpent(c, bk);
        const locked = spent < SK.need;
        const maxed = rank >= SK.max;
        const can = !locked && !maxed && c.sp > 0;
        const pips = '★'.repeat(rank) + '☆'.repeat(SK.max - rank);
        html += `<button class="skill-node${maxed ? ' maxed' : ''}${locked ? ' locked' : ''}${can ? ' can' : ''}"
            data-key="${key}" ${(!can) ? 'disabled' : ''} title="${SK.desc}">
          <span class="semoji">${SK.emoji}</span>
          <div class="sinfo">
            <div class="sname">${SK.name} <span class="spips">${pips}</span></div>
            <div class="sper">${maxed ? 'MAX! ' : ''}${SK.per}</div>
            ${locked ? `<div class="slock">🔒 ${B.name}에 ${SK.need}포인트 필요 (지금 ${spent})</div>` : ''}
          </div>
        </button>`;
      }
      html += `</div>`;
    }
    this.el.skillCols.innerHTML = html;
    this.el.skillCols.querySelectorAll('button[data-key]').forEach(b => {
      b.addEventListener('click', () => this.h.onSkillPick(b.dataset.key));
    });
  }
  showSkills() { this.el.skillModal.classList.remove('hidden'); }
  hideSkills() { this.el.skillModal.classList.add('hidden'); }
  isSkillOpen() { return !this.el.skillModal.classList.contains('hidden'); }

  /* ---------- 별지기의 옷장 ---------- */
  setChampName(name) {
    this.el.champName.textContent = name;
    this.el.skillTitle.textContent = `✨ ${name}의 별자리`;
  }
  /* isLocked(axis, key) → 잠근 업적 정의 또는 falsy. 잠긴 옷은 업적 이름을 알려 주며 잠긴 채 보여 준다 —
   * 숨기면 "열 게 있다"는 것 자체를 모른다. */
  renderCloset(look, name, isLocked = null) {
    this.el.closetName.value = name;
    let html = '';
    for (const [axis, A] of Object.entries(D.CHAMP_WARDROBE)) {
      html += `<div class="closet-axis"><span class="claxis">${A.emoji} ${A.name}</span><div class="clopts">`;
      for (const [key, O] of Object.entries(A.options)) {
        const lock = isLocked && isLocked(axis, key);
        const sw = O.color != null
          ? `<span class="clswatch" style="background:#${O.color.toString(16).padStart(6, '0')}"></span>` : '';
        html += lock
          ? `<button class="clopt locked" disabled
              title="업적 [${lock.emoji} ${lock.name}]을 달성하면 열려요 — ${lock.desc}">${sw}🔒 ${O.name}</button>`
          : `<button class="clopt${look[axis] === key ? ' on' : ''}" data-axis="${axis}" data-key="${key}">${sw}${O.name}</button>`;
      }
      html += `</div></div>`;
    }
    this.el.closetRows.innerHTML = html;
    this.el.closetRows.querySelectorAll('button[data-axis]').forEach(b => {
      b.addEventListener('click', () => this.h.onClosetPick(b.dataset.axis, b.dataset.key));
    });
  }
  setClosetPreview(url) {
    this.el.closetPreview.innerHTML = url
      ? `<img src="${url}" alt="미리보기">`
      : '<span class="closet-emoji">🌠</span>';
  }
  readClosetName() { return this.el.closetName.value; }
  showCloset() { this.el.closetModal.classList.remove('hidden'); }
  hideCloset() { this.el.closetModal.classList.add('hidden'); }
  isClosetOpen() { return !this.el.closetModal.classList.contains('hidden'); }
  /* ---------- 데모 ----------
   * 데모 중임을 항상 화면에 밝힌다. 사용자가 자기 조작이 안 먹는다고
   * 오해하지 않게 하고, 나가는 길도 늘 보이게 둔다. */
  setDemoMode(on, profile) {
    this.el.demoBar.classList.toggle('hidden', !on);
    this.el.demoBtn.classList.toggle('on', !!on);
    this.el.spectateBtn.classList.toggle('on', !!on);
    this.el.demoBtn.textContent = on ? '⏹ 관전 끝' : '🎬 관전';
    this.el.spectateBtn.innerHTML = on
      ? '⏹ 관전 끝 <span>D</span>'
      : '🎬 AI 관전 <span>D</span>';
    document.body.classList.toggle('demo-on', !!on);
    this.el.demoDetail.textContent = on
      ? '실제 스왑 · 실제 전술 · 실제 방어 규칙'
      : '밸런스 봇과 같은 실제 플레이 규칙';
    if (on && profile) this.setDemoCaption(`🤖 ${profile} AI 관전 중`);
  }
  setDemoCaption(text) {
    const el = this.el.demoCaption;
    if (el.textContent === text) return;      // 같은 글자를 다시 넣어 애니메이션을 재시작하지 않는다
    el.textContent = text;
    el.classList.remove('pop');
    void el.offsetWidth;
    el.classList.add('pop');
  }

  /* ---------- 막간 이야기 ---------- */
  showStory(beat) {
    const el = this.el;
    el.storyIcon.textContent = beat.icon || '📜';
    el.storyTitle.textContent = beat.title || '';
    el.storyLines.textContent = '';
    /* 줄을 하나씩 요소로 — 빈 줄이 문단 간격이 된다 (타이핑 연출은 넣지 않는다: 아이는 안 기다린다) */
    for (const line of beat.lines) {
      const d = document.createElement('div');
      d.className = line ? 'story-line' : 'story-gap';
      d.textContent = line;
      el.storyLines.appendChild(d);
    }
    el.storyModal.classList.remove('hidden');
    setTimeout(() => el.storyNext.focus(), 30);
  }
  hideStory() { this.el.storyModal.classList.add('hidden'); }
  isStoryOpen() { return !this.el.storyModal.classList.contains('hidden'); }

  /* ---------- 전설·신화 탄생 연출 ---------- */
  showReveal({ tierName, tierColor, name, emoji, desc, art, short }) {
    const el = this.el;
    el.revealTier.textContent = tierName;
    el.revealTier.style.color = tierColor;
    el.revealCard.style.setProperty('--tier', tierColor);
    el.revealName.textContent = name;
    el.revealDesc.textContent = short ? '' : (desc || '');
    el.revealArt.innerHTML = '';
    if (art) {
      const img = document.createElement('img');
      img.src = art;
      img.alt = name;
      el.revealArt.appendChild(img);
    } else {
      el.revealArt.textContent = emoji;      // 초상 생성 실패 시 이모지로
    }
    el.revealCard.classList.toggle('short', !!short);
    el.revealModal.classList.remove('hidden');
    el.revealCard.classList.remove('pop');
    void el.revealCard.offsetWidth;
    el.revealCard.classList.add('pop');
  }
  hideReveal() { this.el.revealModal.classList.add('hidden'); }
  isRevealOpen() { return !this.el.revealModal.classList.contains('hidden'); }

  isMetaOpen() { return !this.el.metaModal.classList.contains('hidden'); }

  /* ---------- 시작 메뉴 (자동 저장이 있을 때: 이어하기 / 처음부터) ---------- */
  showStart(save) {
    const el = this.el;
    const heroes = (Array.isArray(save.bench) ? save.bench.length : 0)
      + (Array.isArray(save.field) ? save.field.length : 0);
    const diff = D.DIFFICULTIES[save.difficulty];
    el.continueInfo.innerHTML =
      `지난 모험이 자동 저장돼 있어요<br><b>${save.wave}웨이브</b> · ${diff ? diff.emoji + ' ' + diff.name : '⚔️ 보통'} 난이도 · 🧍 용사 ${heroes}명`;
    el.continueBtn.textContent = `⏩ 이어하기 — ${save.wave}웨이브부터 (Enter)`;
    el.startModal.classList.remove('hidden');
    setTimeout(() => el.continueBtn.focus(), 30);
  }
  hideStart() { this.el.startModal.classList.add('hidden'); }
  isStartOpen() { return !this.el.startModal.classList.contains('hidden'); }
  /* ---------- 게임 오버 ---------- */
  showOver(state) {
    this.el.overStats.innerHTML =
      `🌊 도달한 웨이브: <b>${state.wave}웨이브</b> (${D.DIFFICULTIES[state.difficulty].name})<br>
       👾 물리친 몬스터: <b>${state.kills}마리</b>${state.midBossKills ? ` · 👿 중간보스 ${state.midBossKills}` : ''}${state.bossKills ? ` · 🐉 대보스 ${state.bossKills}` : ''}<br>
       🎲 소환 <b>${state.summons}</b> · ⚗️ 조합 <b>${state.combos}</b> · ✨ 특수 <b>${state.specialsMade}</b> · 🌌 신화 <b>${state.mythicsMade}</b><br>
       🌌 별자리 전술판으로 세 갈래 길을 지켰어요<br>
       ${state.champ ? `<br>🌠 별지기: <b>Lv ${state.champ.level}</b> · 직접 처치 <b>${state.champKills || 0}</b> · ☄️ 별똥별 ${state.starCasts || 0}회${state.ultCasts ? ` · 🌌 은하수 ${state.ultCasts}회` : ''}${state.perfectWaves ? ` · 🛡️ 완벽 방어 ${state.perfectWaves}번` : ''}${state.feasts ? ` · 🎉 잔치 ${state.feasts}번` : ''}` : ''}`;
    this.el.overShards.textContent = `✨ 별조각 +${state.shardsEarned} 획득!`;
    this.el.overModal.classList.remove('hidden');
  }
  hideOver() { this.el.overModal.classList.add('hidden'); }

  /* ---------- 소환/조합 연출 ---------- */
  summonReveal(hero, tier) {
    const C = D.CLASSES[hero.cls], T = D.TIERS[tier];
    const el = this.el.revealCard;
    el.className = `reveal t${tier}`;
    el.innerHTML =
      `<div class="rv-em">${C.emoji}</div>` +
      `<div class="rv-tier" style="color:${T.color}">${T.name}</div>` +
      `<div class="rv-name">${C.name}</div>`;
    el.classList.remove('hidden');
    void el.offsetWidth;
    el.classList.add('pop');
    clearTimeout(this._revealT);
    this._revealT = setTimeout(() => { el.classList.add('hidden'); el.classList.remove('pop'); },
      tier >= 3 ? 1800 : tier >= 2 ? 1500 : 900);
    if (tier >= 2) this.flashScreen(tier >= 4 ? 'mythic' : tier === 3 ? 'legend' : 'hero');
  }

  flashCombine(tier) { this.flashScreen(tier >= 4 ? 'mythic' : tier === 3 ? 'legend' : 'hero'); }

  flashScreen(kind) {
    const el = this.el.rarityFlash;
    el.className = kind;
    void el.offsetWidth;
    el.classList.add('on');
    clearTimeout(this._flashT);
    this._flashT = setTimeout(() => el.classList.remove('on'), 900);
  }

  /* ---------- 연출 ---------- */
  toast(msg, kind = '') {
    const d = document.createElement('div');
    d.className = `toast ${kind}`;
    d.textContent = msg;
    this.el.toasts.appendChild(d);
    setTimeout(() => d.remove(), 2700);
  }
  flashHit() {
    const el = this.el.hitFlash;
    el.classList.remove('on');
    void el.offsetWidth;
    el.classList.add('on');
  }
  setLowHp(on) { this.el.lowHpVignette.classList.toggle('on', on); }
  coachChip() {
    if (localStorage.getItem('constellation-defense.coach')) return;
    localStorage.setItem('constellation-defense.coach', '1');
    const el = this.el.coachChip;
    el.classList.remove('hidden');
    setTimeout(() => el.classList.add('hidden'), 9000);
  }
  setSpeedLabel(s) { this.el.speedBtn.textContent = `⏩ x${s} (Q)`; }
  /* 음소거 버튼 상태 — 꺼진 건 한눈에 보이게 (아이콘 + 회색 처리) */
  setSoundLabels(sfxOff, bgmOff) {
    this.el.sfxBtn.textContent = sfxOff ? '🔇 효과음' : '🔊 효과음';
    this.el.sfxBtn.classList.toggle('off', sfxOff);
    this.el.bgmBtn.textContent = bgmOff ? '🔇 배경음' : '🎵 배경음';
    this.el.bgmBtn.classList.toggle('off', bgmOff);
  }

  /* ---------- 기록 카드 (공유용 PNG) ---------- */
  makeShareCard(state, best) {
    const c = document.createElement('canvas');
    c.width = 720; c.height = 960;
    const g = c.getContext('2d');
    const bg = g.createLinearGradient(0, 0, 0, 960);
    bg.addColorStop(0, '#1c2b4a'); bg.addColorStop(1, '#2b4a72');
    g.fillStyle = bg;
    g.fillRect(0, 0, 720, 960);
    g.textAlign = 'center';
    g.font = '64px "Segoe UI Emoji"';
    g.fillText('🏰', 360, 150);
    g.fillStyle = '#ffd93d';
    g.font = 'bold 52px "Malgun Gothic", sans-serif';
    g.fillText('CONSTELLATION DEFENSE', 360, 240);
    g.fillStyle = '#ffffff';
    g.font = 'bold 88px "Malgun Gothic", sans-serif';
    g.fillText(`${state.wave}웨이브 도달!`, 360, 400);
    g.font = '34px "Malgun Gothic", sans-serif';
    g.fillStyle = '#cfe3ff';
    const lines = [
      `난이도: ${D.DIFFICULTIES[state.difficulty].name}`,
      `물리친 몬스터 ${state.kills}마리`,
      `별자리 전술 ${state.tacticCasts || 0}회 발동`,
      `최고 기록 ${best}웨이브`,
    ];
    lines.forEach((s, i) => g.fillText(s, 360, 520 + i * 60));
    g.font = '28px "Malgun Gothic", sans-serif';
    g.fillStyle = '#8fb4e8';
    g.fillText(new Date().toLocaleDateString('ko-KR'), 360, 860);
    const a = document.createElement('a');
    a.download = `constellation-defense_${state.wave}wave.png`;
    a.href = c.toDataURL('image/png');
    a.click();
  }
}
