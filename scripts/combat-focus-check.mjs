import { combatLanePressure } from '../src/app/combat-focus.js';

let failed = 0;
function check(label, condition, detail = '') {
  console.log(`${condition ? '✅' : '❌'} ${label}${detail ? ` · ${detail}` : ''}`);
  if (!condition) failed++;
}

const state = {
  enemies: [
    { id: 1, route: 0, s: 0, dead: false },
    { id: 2, route: 1, s: 330, dead: false },
    { id: 3, route: 1, s: 360, dead: false, midBoss: true },
    { id: 4, route: 2, s: 999999, dead: false, boss: true },
    { id: 5, route: 0, s: 999999, dead: true },
    { id: 6, route: 7, s: 10, dead: false },
  ],
};

const lanes = combatLanePressure(state);
check('always returns the three public defense lanes', lanes.length === 3 && lanes.every((lane, index) => lane.route === index));
check('dead and invalid-route enemies are ignored', lanes[0].count === 1 && lanes.reduce((sum, lane) => sum + lane.count, 0) === 4);
check('an opening spawn reads as approach, not danger', lanes[0].tier === 'watch' && lanes[0].fill > 0 && lanes[0].fill < 40, JSON.stringify(lanes[0]));
check('mid-boss composition is explicitly identified', lanes[1].tier === 'pressed' && lanes[1].label === '지휘관', JSON.stringify(lanes[1]));
check('great boss route is critical and clamped', lanes[2].tier === 'critical' && lanes[2].label === '대보스' && lanes[2].fill === 100, JSON.stringify(lanes[2]));
check('empty state is stable and clear', combatLanePressure({ enemies: [] }).every((lane) => lane.tier === 'clear' && lane.fill === 0));

if (failed) process.exit(1);
console.log('Combat focus checks passed.');
