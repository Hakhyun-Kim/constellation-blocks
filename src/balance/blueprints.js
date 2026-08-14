/* One Act 2 monster blueprint pilot. The market route records an enemy as a
 * temporary defender without creating a second combat ruleset. */
export const MONSTER_BLUEPRINTS = Object.freeze({
  'clerk-goblin': Object.freeze({
    key: 'clerk-goblin',
    name: '김대리의 교정 도장',
    summonName: '고블린 김대리',
    emoji: '👺',
    desc: '가장 위험한 방어로에 나타나 12초 동안 교정탄을 발사합니다.',
    routeFlag: 'market',
    duration: 12,
    attackPeriod: 1.35,
    damage: 58,
    projectileSpeed: 460,
    deployProgress: .78,
  }),
});

export const DEFAULT_MONSTER_BLUEPRINT = 'clerk-goblin';
export const monsterBlueprintSpec = (key = DEFAULT_MONSTER_BLUEPRINT) => MONSTER_BLUEPRINTS[key] || null;
