/* =====================================================
 * Named squad card presentation
 *
 * This is deliberately an app-layer view model: it reads the pure engine's
 * effective modifiers, but never changes combat rules or progression.
 * Keeping the markup here prevents the fixed-party screen from growing
 * another block of display-only conditionals inside ui.js.
 * ===================================================== */
import * as D from '../data.js';
import * as E from '../engine.js';

const IDENTITY = {
  arin: {
    crest: '⚔', constellation: '✦', title: '새벽의 검', accent: '#ef926b', deep: '#873d5c',
    identity: '전방 처형', ability: '성광 일섬', hint: '치명타로 길목을 끊습니다.',
  },
  luna: {
    crest: '✦', constellation: '☾', title: '별빛의 현자', accent: '#a687f3', deep: '#47539b',
    identity: '별자리 마도사', ability: '성운 폭발', hint: '범위 마법으로 적 무리를 엽니다.',
  },
  doyun: {
    crest: '🛡', constellation: '◈', title: '파도의 방벽', accent: '#6cb9c9', deep: '#286781',
    identity: '길 저지', ability: '수호 장벽', hint: '장벽과 감속으로 시간을 법니다.',
  },
  sera: {
    crest: '🏹', constellation: '✧', title: '바람의 눈', accent: '#e8b566', deep: '#8b5a3e',
    identity: '원거리 관통', ability: '유성 연사', hint: '먼 길부터 관통 사격합니다.',
  },
  yuna: {
    crest: '❄', constellation: '✺', title: '겨울의 별', accent: '#8eaee9', deep: '#455a9c',
    identity: '범위 제어', ability: '서리 성운', hint: '폭발과 냉기로 길을 묶습니다.',
  },
};

const FALLBACK = {
  crest: '✦', constellation: '·', title: '별의 수호자', accent: '#9a8fe8', deep: '#4e4d91',
  identity: '수호 영웅', ability: '별빛 수호', hint: '별자리를 따라 성을 지킵니다.',
};

const escapeHtml = (value) => String(value ?? '')
  .replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#039;');

function combatReadout(hero, mods) {
  if (hero.cls === 'knight' && mods.crit) return `치명 ${Math.round(mods.crit.chance * 100)}% · ×${mods.crit.mul}`;
  if (hero.cls === 'guard' && mods.block) return `장벽 ${mods.block.dur.toFixed(1)}초 · ${mods.block.period.toFixed(1)}초마다`;
  if (hero.cls === 'archer') return `관통 ${mods.pierce}명 · ${mods.hits > 1 ? `${mods.hits}연사` : '정밀 사격'}`;
  if (hero.cls === 'mage' && mods.splash) return `범위 ${Math.round(mods.splash)} · ${mods.splashSlow ? '냉기 폭발' : '성운 폭발'}`;
  return '전장을 지키는 별빛';
}

export function heroCardMarkup(hero) {
  const identity = IDENTITY[hero.heroKey] || FALLBACK;
  const C = D.CLASSES[hero.cls];
  const mods = E.heroMods(hero);
  const need = D.heroXpNeed(hero.level);
  const xp = Math.max(0, Math.min(100, Math.round(((hero.xp || 0) / need) * 100)));
  const name = escapeHtml(hero.name || C.name);
  const role = escapeHtml(identity.identity || C.name);
  const point = hero.sp > 0 ? `전문화 ${hero.sp}P 준비` : `다음 포인트까지 ${Math.max(0, need - Math.round(hero.xp || 0))} XP`;
  const ability = escapeHtml(combatReadout(hero, mods));

  return `
    <span class="hero-card-art" aria-hidden="true">
      <i class="hero-card-constellation">${identity.constellation}</i>
      <i class="hero-card-crest">${identity.crest}</i>
      <i class="hero-card-spark spark-a">✦</i><i class="hero-card-spark spark-b">·</i>
    </span>
    <span class="hero-card-copy">
      <span class="hero-card-role">${role}</span>
      <b class="hero-card-name">${name}</b>
      <small class="hero-card-title">${escapeHtml(identity.title)} · ${escapeHtml(C.name)}</small>
    </span>
    <span class="hero-card-ability">
      <i aria-hidden="true">${identity.crest}</i>
      <span><small>${escapeHtml(identity.ability)}</small><b>${ability}</b></span>
    </span>
    <span class="hero-card-stats" aria-label="영웅 능력치">
      <span><small>피해</small><b>${hero.dmg}</b></span>
      <span><small>DPS</small><b>${E.heroDps(hero)}</b></span>
      <span><small>사거리</small><b>${mods.range}</b></span>
    </span>
    <span class="hero-card-growth">
      <span><b>Lv ${hero.level}</b><small>${escapeHtml(point)}</small></span>
      <i><i style="width:${xp}%"></i></i>
    </span>
  `;
}

export function heroCardClass(hero, selected = false) {
  const identity = IDENTITY[hero.heroKey] || FALLBACK;
  return {
    className: `hero-card${selected ? ' sel' : ''}${hero.sp > 0 ? ' ready' : ''}`,
    style: `--hero-card-accent:${identity.accent};--hero-card-deep:${identity.deep};`,
    ariaLabel: `${hero.name || D.CLASSES[hero.cls].name}, ${identity.identity}, 레벨 ${hero.level}, 피해 ${hero.dmg}`,
  };
}
