import * as D from '../data.js';

export function createSquadHero(state, spec) {
  const hero = {
    id: state.nextId++,
    heroKey: spec.key || spec.cls,
    cls: spec.cls,
    name: spec.name || D.CLASSES[spec.cls].name,
    tier: 0,
    level: 1,
    xp: 0,
    sp: 0,
    skills: {},
    dmg: 0,
    padIndex: -1,
    x: 0,
    y: 0,
    cd: 0,
    activeCd: 0,
  };
  refreshHeroDamage(state, hero);
  return hero;
}

export const heroKillXp = (enemy) =>
  enemy.boss ? D.HERO_XP.boss : enemy.midBoss ? D.HERO_XP.midBoss : enemy.elite ? D.HERO_XP.elite : D.HERO_XP.kill;

export function refreshHeroDamage(state, hero) {
  const levelMul = 1 + D.HERO_XP.dmgPerLevel * Math.max(0, (hero.level || 1) - 1);
  const focus = hero.skills?.knight_vow || hero.skills?.archer_focus || 0;
  hero.dmg = Math.round(D.CLASSES[hero.cls].dmg * D.HERO_XP.baseDmgMul * levelMul * (1 + focus * (hero.cls === 'archer' ? 0.14 : 0.10)) * state.dmgMul);
  return hero.dmg;
}

export function heroGrowthMods(hero) {
  const skills = hero.skills || {};
  const C = D.CLASSES[hero.cls];
  if (hero.cls === 'knight') {
    const baseCrit = C.crit || { chance: 0, mul: 1 };
    return {
      crit: { ...baseCrit, chance: baseCrit.chance + 0.12 * (skills.knight_edge || 0) },
      cleave: (skills.knight_arc || 0) > 0,
    };
  }
  if (hero.cls === 'guard') {
    const slow = C.slowOnHit;
    return {
      blockPeriodMul: Math.pow(0.82, skills.guard_wall || 0),
      slowOnHit: slow ? { mul: Math.max(0.35, slow.mul - 0.07 * (skills.guard_tide || 0)), dur: slow.dur + 0.25 * (skills.guard_tide || 0) } : null,
      healOnKill: skills.guard_mend || 0,
    };
  }
  if (hero.cls === 'archer') return {
    pierce: (C.pierce || 1) + (skills.archer_pierce || 0),
    hits: 1 + (skills.archer_volley || 0),
  };
  if (hero.cls === 'mage') return {
    splashMul: 1 + 0.18 * (skills.mage_nova || 0),
    burn: (C.burn || 0) + 0.10 * (skills.mage_ember || 0),
    splashSlow: (skills.mage_frost || 0) > 0 ? { mul: 0.62, dur: 1.1 } : null,
  };
  return {};
}

/* Town specializations also shape the live board commands.  These bonuses are
 * intentionally small but behavioral: builds change which color is valuable,
 * not only the hero-card DPS number. */
export function squadTacticMods(state) {
  const total = (key) => (state?.field || []).reduce((sum, hero) => sum + (hero.skills?.[key] || 0), 0);
  return {
    flareDamageMul: 1 + total('knight_edge') * 0.08 + total('mage_nova') * 0.08,
    flareTargetBonus: total('archer_pierce'),
    tideDurationMul: 1 + total('guard_tide') * 0.12 + total('mage_frost') * 0.18,
    bloomHealBonus: total('guard_mend') * 4,
    bloomPushBonus: total('knight_vow') * 8,
  };
}

export function gainHeroXp(state, hero, amount, events = []) {
  if (!hero || !(amount > 0) || hero.level >= D.HERO_XP.maxLevel) return;
  hero.xp += amount;
  let need = D.heroXpNeed(hero.level);
  while (hero.xp >= need && hero.level < D.HERO_XP.maxLevel) {
    hero.xp -= need;
    hero.level++;
    hero.sp++;
    refreshHeroDamage(state, hero);
    events.push({ type: 'heroLevel', heroId: hero.id, cls: hero.cls, name: hero.name, level: hero.level, x: hero.x, y: hero.y });
    need = D.heroXpNeed(hero.level);
  }
}

export function grantSquadWaveXp(state, events = []) {
  const amount = D.HERO_XP.clear(state.wave);
  for (const hero of state.field) gainHeroXp(state, hero, amount, events);
  return amount;
}

export function takeHeroSkill(state, heroId, key) {
  const hero = state.field.find((entry) => entry.id === heroId);
  const skill = D.HERO_SKILLS[key];
  if (!hero || !skill || skill.cls !== hero.cls) return { ok: false, reason: 'hero' };
  if (state.squad) {
    const chapter = state.journey && D.JOURNEY_CHAPTERS.find((entry) => entry.id === state.journey.chapter);
    const node = chapter?.nodes.find((entry) => entry.id === state.journey.current);
    const facility = D.facilityForHero(hero.heroKey);
    if (state.phase !== 'journey' || node?.kind !== 'town' || !node.facilities?.includes(facility)) {
      return { ok: false, reason: 'facility', facility };
    }
  }
  const rank = hero.skills[key] || 0;
  if (rank >= skill.max) return { ok: false, reason: 'max' };
  if (hero.sp < 1) return { ok: false, reason: 'sp' };
  if (hero.level < skill.level) return { ok: false, reason: 'level', level: skill.level };
  hero.sp--;
  hero.skills[key] = rank + 1;
  refreshHeroDamage(state, hero);
  return { ok: true, hero, skill, rank: rank + 1 };
}
