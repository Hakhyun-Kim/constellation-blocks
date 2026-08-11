/* Fixed, named defenders.  Their class never changes; only their build does. */
export const SQUAD = [
  { cls: 'knight', name: '아린', pad: 0, role: '전방 처형' },
  { cls: 'guard', name: '도윤', pad: 1, role: '길 저지' },
  { cls: 'archer', name: '세라', pad: 2, role: '원거리 관통' },
  { cls: 'mage', name: '유나', pad: 3, role: '범위 제어' },
];

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
  knight_edge: { cls: 'knight', branch: 'attack', name: '별날', emoji: '⚔️', level: 2, max: 2, per: '치명타 +12%', desc: '강한 단일 대상 공격' },
  knight_arc: { cls: 'knight', branch: 'control', name: '초승 베기', emoji: '🌙', level: 4, max: 1, per: '근접 범위 베기', desc: '주변 적을 함께 벤다' },
  knight_vow: { cls: 'knight', branch: 'guard', name: '수호 맹세', emoji: '🛡️', level: 6, max: 2, per: '피해 +10%', desc: '위기에도 화력을 유지한다' },

  guard_wall: { cls: 'guard', branch: 'guard', name: '성벽 자세', emoji: '🛡️', level: 2, max: 2, per: '저지 재사용 -18%', desc: '길을 더 자주 멈춘다' },
  guard_tide: { cls: 'guard', branch: 'control', name: '파도 방패', emoji: '🌊', level: 4, max: 2, per: '타격 감속 강화', desc: '다음 화력 시간을 만든다' },
  guard_mend: { cls: 'guard', branch: 'support', name: '별빛 수리', emoji: '✨', level: 6, max: 2, per: '처치 시 성 회복 +1', desc: '막아낸 만큼 성을 보수한다' },

  archer_focus: { cls: 'archer', branch: 'attack', name: '성좌 조준', emoji: '🏹', level: 2, max: 2, per: '피해 +14%', desc: '먼 길의 핵심 적을 노린다' },
  archer_pierce: { cls: 'archer', branch: 'control', name: '관통 성시', emoji: '☄️', level: 4, max: 2, per: '관통 +1', desc: '한 발로 줄을 가른다' },
  archer_volley: { cls: 'archer', branch: 'support', name: '쌍성 연사', emoji: '✦', level: 6, max: 1, per: '연속 사격', desc: '한 번 더 쏜다' },

  mage_nova: { cls: 'mage', branch: 'attack', name: '성운 폭발', emoji: '💥', level: 2, max: 2, per: '폭발 범위 +18%', desc: '뭉친 적을 크게 친다' },
  mage_ember: { cls: 'mage', branch: 'control', name: '여운 불꽃', emoji: '🔥', level: 4, max: 2, per: '화상 +10%', desc: '지나간 적도 계속 태운다' },
  mage_frost: { cls: 'mage', branch: 'support', name: '성운 냉기', emoji: '❄️', level: 6, max: 1, per: '폭발 감속', desc: '폭발 뒤 적을 느리게 한다' },
};

export const HERO_SKILL_KEYS = Object.keys(HERO_SKILLS);
