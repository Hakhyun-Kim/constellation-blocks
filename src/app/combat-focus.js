/* Combat HUD projection only. The engine remains the source of truth; this
 * module turns public enemy positions into three compact, testable readouts. */
import * as D from '../data.js';

const LANE_NAMES = ['왼쪽', '가운데', '오른쪽'];
const clamp01 = (value) => Math.max(0, Math.min(1, value));

export function combatLanePressure(state) {
  const lanes = LANE_NAMES.map((name, route) => ({
    route, name, count: 0, maxProgress: 0, score: 0, boss: false, midBoss: false,
  }));

  for (const enemy of state?.enemies || []) {
    if (enemy.dead || !lanes[enemy.route]) continue;
    const routeLength = D.ROUTE_LENS[enemy.route] || 1;
    const progress = clamp01((Number(enemy.s) || 0) / routeLength);
    const lane = lanes[enemy.route];
    lane.count += 1;
    lane.maxProgress = Math.max(lane.maxProgress, progress);
    lane.boss ||= !!enemy.boss;
    lane.midBoss ||= !!enemy.midBoss;
    lane.score += 1 + progress * 2.5 + (enemy.boss ? 4 : enemy.midBoss ? 2 : enemy.elite ? .5 : 0);
  }

  return lanes.map((lane) => {
    let tier = 'clear';
    let label = '안전';
    if (lane.count) {
      tier = 'watch';
      label = '접근';
      if (lane.maxProgress >= .55 || lane.score >= 4 || lane.midBoss) {
        tier = 'pressed';
        label = lane.midBoss ? '지휘관' : '압박';
      }
      if (lane.maxProgress >= .82 || lane.score >= 8 || lane.boss) {
        tier = 'critical';
        label = lane.boss ? '대보스' : '성문 앞';
      }
    }
    const fill = lane.boss ? 100 : lane.count
      ? Math.round(clamp01(lane.maxProgress * .72 + Math.min(lane.score, 10) / 10 * .28) * 100)
      : 0;
    return { ...lane, score: Number(lane.score.toFixed(2)), fill, tier, label };
  });
}
