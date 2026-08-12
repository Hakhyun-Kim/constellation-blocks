/* Fixed, named defenders.  Their class never changes; only their build does. */
export const SQUAD = [
  { key: 'arin', cls: 'knight', name: '아린', pad: 0, role: '전방 처형', starts: true },
  { key: 'luna', cls: 'mage', name: '루나', pad: 3, role: '별자리 마도사', starts: true },
  { key: 'doyun', cls: 'guard', name: '도윤', pad: 1, role: '길 저지' },
  { key: 'sera', cls: 'archer', name: '세라', pad: 2, role: '원거리 관통' },
  { key: 'yuna', cls: 'mage', name: '유나', pad: 4, role: '범위 제어' },
];

export const SQUAD_MAX = 5;
export const STARTING_SQUAD_KEYS = SQUAD.filter((hero) => hero.starts).map((hero) => hero.key);
export const squadSpec = (key) => SQUAD.find((hero) => hero.key === key) || null;

export const HERO_XP = {
  kill: 1,
  elite: 3,
  midBoss: 6,
  boss: 12,
  clear: (wave) => 9 + Math.round(wave * 2.5),
  maxLevel: 12,
  baseDmgMul: 2.1,
  dmgPerLevel: 0.36,
};

export const heroXpNeed = (level) => Math.round(18 * Math.pow(1.22, level - 1));

/* One point per level.  A hero can deepen at most one of these three themes. */
export const HERO_SKILLS = {
  knight_edge: { cls: 'knight', branch: 'attack', name: '별날', emoji: '⚔️', level: 2, max: 2, per: '치명타 +12% · Flare +8%', desc: '강한 단일 대상 공격과 유성 전술' },
  knight_arc: { cls: 'knight', branch: 'control', name: '초승 베기', emoji: '🌙', level: 4, max: 1, per: '근접 범위 베기', desc: '주변 적을 함께 벤다' },
  knight_vow: { cls: 'knight', branch: 'guard', name: '수호 맹세', emoji: '🛡️', level: 6, max: 2, per: '피해 +10% · Bloom 후퇴 +8', desc: '위기에도 화력과 수호 전술을 유지한다' },

  guard_wall: { cls: 'guard', branch: 'guard', name: '성벽 자세', emoji: '🛡️', level: 2, max: 2, per: '저지 재사용 -18%', desc: '길을 더 자주 멈춘다' },
  guard_tide: { cls: 'guard', branch: 'control', name: '파도 방패', emoji: '🌊', level: 4, max: 2, per: '타격 감속 · Tide +12%', desc: '다음 화력 시간을 만든다' },
  guard_mend: { cls: 'guard', branch: 'support', name: '별빛 수리', emoji: '✨', level: 6, max: 2, per: '처치 회복 +1 · Bloom +4', desc: '막아낸 만큼 성과 수호 전술을 보수한다' },

  archer_focus: { cls: 'archer', branch: 'attack', name: '성좌 조준', emoji: '🏹', level: 2, max: 2, per: '피해 +14%', desc: '먼 길의 핵심 적을 노린다' },
  archer_pierce: { cls: 'archer', branch: 'control', name: '관통 성시', emoji: '☄️', level: 4, max: 2, per: '관통 +1 · Flare 대상 +1', desc: '화살과 유성이 한 줄을 가른다' },
  archer_volley: { cls: 'archer', branch: 'support', name: '쌍성 연사', emoji: '✦', level: 6, max: 1, per: '연속 사격', desc: '한 번 더 쏜다' },

  mage_nova: { cls: 'mage', branch: 'attack', name: '성운 폭발', emoji: '💥', level: 2, max: 2, per: '폭발 범위 +18% · Flare +8%', desc: '뭉친 적과 유성 전술을 크게 친다' },
  mage_ember: { cls: 'mage', branch: 'control', name: '여운 불꽃', emoji: '🔥', level: 4, max: 2, per: '화상 +10%', desc: '지나간 적도 계속 태운다' },
  mage_frost: { cls: 'mage', branch: 'support', name: '성운 냉기', emoji: '❄️', level: 6, max: 1, per: '폭발 감속 · Tide +18%', desc: '폭발과 서리 전술로 시간을 번다' },
};

export const HERO_SKILL_KEYS = Object.keys(HERO_SKILLS);

/* Experience is earned in battle, but specialization is chosen at the
 * matching town facility.  This turns a level-up point into a route and
 * timing decision instead of another combat-screen button. */
export const HERO_FACILITIES = {
  forge: { name: '별무기 대장간', emoji: '🔨', heroes: ['arin', 'doyun'], desc: '전방 영웅의 전투 기술을 벼립니다.' },
  shrine: { name: '별빛 신전', emoji: '☾', heroes: ['luna', 'yuna'], desc: '마도사의 별자리 전문화를 엽니다.' },
  guild: { name: '탐험가 길드', emoji: '🏹', heroes: ['sera'], desc: '궁수의 사격 전술을 전수합니다.' },
};

export const facilityForHero = (heroKey) =>
  Object.entries(HERO_FACILITIES).find(([, facility]) => facility.heroes.includes(heroKey))?.[0] || null;
