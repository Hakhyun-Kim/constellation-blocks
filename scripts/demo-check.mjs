import { demo } from '../src/demo.js';

let failures = 0;
const check = (condition, message) => {
  if (condition) console.log(`✅ demo: ${message}`);
  else { failures++; console.error(`❌ demo: ${message}`); }
};

const state = { phase: 'over', wave: 7 };
let restarts = 0;
let caption = '';
demo.attach({
  getState: () => state,
  isStoryOpen: () => false,
  isRevealOpen: () => false,
  onStart: () => {},
  onStop: () => {},
  onCaption: (text) => { caption = text; },
  newGame: () => { restarts++; state.phase = 'journey'; },
});

demo.start('초보');
demo.step(0.1);
check(restarts === 0 && demo.overSeen && demo.t === 12, 'game over starts a full twelve-second recap window');
check(caption.includes('결과를 확인'), 'recap caption asks the viewer to inspect the result');
demo.step(11.5);
check(restarts === 0 && demo.t > 0, 'spectate does not restart before the recap window ends');
demo.step(0.6);
check(restarts === 1 && !demo.overSeen, 'spectate restarts once after the recap window');
demo.stop();

if (failures) process.exitCode = 1;
else console.log('Demo flow checks passed.');
