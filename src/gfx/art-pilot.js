/* 푸른 초원 한 장면에만 적용하는 외부 아트 슬롯. 전투 규칙과 무관한 순수 선택표다. */
export const ART_PILOT_REGION = 'verdant-dawn';

const BLOB_TYPES = new Set(['goblin', 'wolf']);

export function heroPilotSlot(regionId, hero) {
  if (regionId !== ART_PILOT_REGION || hero?.heroKey !== 'arin') return null;
  return Object.freeze({
    id: 'quaternius-warrior',
    height: 1.72,
    idle: ['Idle_Attacking', 'Idle_Weapon', 'Idle'],
    attack: ['Sword_Attack', 'Sword_Attack2', 'Punch'],
  });
}

export function enemyPilotSlot(regionId, enemy) {
  if (regionId !== ART_PILOT_REGION || !enemy || enemy.boss) return null;
  if (enemy.midBoss) return Object.freeze({
    id: 'quaternius-yeti',
    heightMul: 0.82,
    yawOffset: Math.PI,
    idle: ['Walk', 'Idle'],
    attack: ['Bite_Front'],
  });
  if (BLOB_TYPES.has(enemy.type)) return Object.freeze({
    id: 'quaternius-green-blob',
    heightMul: 0.78,
    yawOffset: Math.PI,
    idle: ['Walk', 'Idle'],
    attack: ['Bite_Front'],
  });
  return Object.freeze({
    id: 'quaternius-demon',
    heightMul: 0.88,
    yawOffset: Math.PI,
    hover: 0.18,
    idle: ['Flying_Idle'],
    attack: ['Flying_Idle'],
  });
}
