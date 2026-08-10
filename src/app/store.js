/* =====================================================
 * 기기 저장소(localStorage) — 판이 아니라 기기에 속하는 것들.
 * 별조각 · 별의 축복 · 최고 기록 · 그래픽/이야기 설정 · 자동 저장 · 별지기 꾸미기.
 * ===================================================== */
import * as D from '../data.js';

const PREFIX = 'constellation-defense.';
const LEGACY_PREFIX = 'mathdef_';
const key = (name) => PREFIX + name;

/* 한 번만 기존 전투 기록을 새 이름으로 옮긴다. 수학 풀이 기록은 현재 게임에서
 * 의미가 없으므로 의도적으로 승계하지 않는다. */
function migrate(name, legacyName = name) {
  const next = key(name);
  if (localStorage.getItem(next) != null) return;
  const legacy = LEGACY_PREFIX + legacyName;
  const value = localStorage.getItem(legacy);
  if (value == null) return;
  localStorage.setItem(next, value);
  localStorage.removeItem(legacy);
}
[
  'shards', 'meta', 'diff', 'gfx', 'decor_off', 'story_off', 'autosave', 'champ',
  'victories', 'trial_clears', 'codex', 'achievements', 'coach',
].forEach(name => migrate(name));
['easy', 'normal', 'hard'].forEach(diff => migrate(`best.${diff}`, `best_${diff}`));
localStorage.removeItem(`${LEGACY_PREFIX}mathlog`);

const text = (name, fallback = null) => localStorage.getItem(key(name)) ?? fallback;
const number = (name) => Number(text(name, '0')) || 0;
const json = (name, fallback) => {
  try { return JSON.parse(text(name, 'null')) || fallback; } catch { return fallback; }
};

export const store = {
  get shards() { return number('shards'); },
  set shards(v) { localStorage.setItem(key('shards'), String(v)); },
  get meta() { return json('meta', {}); },
  set meta(v) { localStorage.setItem(key('meta'), JSON.stringify(v)); },
  get diff() { return text('diff', 'normal'); },
  set diff(v) { localStorage.setItem(key('diff'), v); },
  best(diff) { return number(`best.${diff}`); },
  setBest(diff, w) { localStorage.setItem(key(`best.${diff}`), String(w)); },
  get gfx() { return text('gfx'); },
  set gfx(v) { localStorage.setItem(key('gfx'), v); },
  /* 배경 장식 끄기 — 너무 느린 기기에서 한 번 켜지면 계속 유지된다.
   * 장식을 켜고 끄는 건 지형·카메라까지 바뀌는 일이라 실행 중엔 못 바꾼다.
   * 그래서 "다음에 켤 때부터"로 미룬다. */
  get decorOff() { return text('decor_off') === '1'; },
  set decorOff(v) { localStorage.setItem(key('decor_off'), v ? '1' : '0'); },
  get storyOff() { return text('story_off') === '1'; },
  set storyOff(v) { localStorage.setItem(key('story_off'), v ? '1' : '0'); },
  /* 자동 저장 슬롯 (웨이브가 끝날 때마다 갱신, 함락되면 삭제) */
  get autosave() { return json('autosave', null); },
  set autosave(v) {
    if (v == null) localStorage.removeItem(key('autosave'));
    else localStorage.setItem(key('autosave'), JSON.stringify(v));
  },
  /* 별지기 꾸미기(이름·옷장) — 판이 아니라 기기에 속한다. 판이 끝나도 "내 캐릭터"는 남는다 */
  get champCfg() { return json('champ', {}); },
  set champCfg(v) { localStorage.setItem(key('champ'), JSON.stringify(v)); },
  /* 서른 번째 아침(승리) 횟수 — [n]번째 원소 = n회차에서의 클리어 수가 아니라 총합만 센다 */
  get victories() { return number('victories'); },
  set victories(v) { localStorage.setItem(key('victories'), String(v)); },
  get trialClears() { return number('trial_clears'); },
  set trialClears(v) { localStorage.setItem(key('trial_clears'), String(v)); },
};

/* 별지기의 지금 이름 — 토스트·이야기가 전부 이걸 부른다 */
export const heroName = () => D.champNameOf(store.champCfg.name);

/* =====================================================
 * 누적 기록 — 도감 · 업적 (전부 기기 저장)
 * 처치마다 localStorage에 쓰면 아깝다: 메모리에 들고 있다가
 * flushRecords()로 미룬다 (autoSave와 같은 타이밍 + pagehide).
 * ===================================================== */
const load = (name, dflt) => {
  try { return Object.assign(dflt, JSON.parse(text(name, 'null')) || {}); }
  catch { return dflt; }
};

/* 도감: 만들어 본 용사(직업:등급 → 횟수) · 물리친 몬스터(종류 → 마릿수) */
export const codex = load('codex', { heroes: {}, kills: {} });
/* 업적: 달성한 key → 1. 한 번 달성하면 영원히 남는다 */
export const earned = load('achievements', {});

let dirty = false;
export function markDirty() { dirty = true; }
export function flushRecords() {
  if (!dirty) return;
  dirty = false;
  localStorage.setItem(key('codex'), JSON.stringify(codex));
  localStorage.setItem(key('achievements'), JSON.stringify(earned));
}

export function codexAddHero(cls, tier) {
  const key = `${cls}:${tier}`;
  codex.heroes[key] = (codex.heroes[key] || 0) + 1;
  dirty = true;
}
export function codexAddKill(type) {
  codex.kills[type] = (codex.kills[type] || 0) + 1;
  dirty = true;
}
