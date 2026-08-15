import { WEEKLY_RULES, createWeeklyChallenge, createPlacementReplay, normalizeWeeklyId, seededRandom, weeklyId } from '../src/challenges/weekly.js';
import { createEmptyBoard, drawTray, legalPlacements } from '../src/blocks/board.js';

let failures = 0;
const check = (condition, message) => condition ? console.log(`✅ weekly: ${message}`) : (failures++, console.error(`FAIL weekly: ${message}`));

check(weeklyId(new Date('2026-08-12T00:00:00Z')) === '2026-W33', 'UTC date maps to a stable ISO week');
check(normalizeWeeklyId('bad') === null, 'invalid challenge ids are rejected');
const challenge = createWeeklyChallenge('2026-W33');
check(challenge.endsAfterChapter === 'dawn-road' && WEEKLY_RULES.defenses === 7
  && challenge.targetMinutes.join('-') === '10-15', 'weekly scope is the seven-defense first chapter and 10-15 minute target');
const trayA = drawTray(seededRandom(challenge.seed), createEmptyBoard());
const trayB = drawTray(seededRandom(challenge.seed), createEmptyBoard());
check(JSON.stringify(trayA) === JSON.stringify(trayB), 'same challenge id deals the same opening pieces');
const firstMove = legalPlacements(createEmptyBoard(), trayA)[0];
check(!!firstMove, 'weekly opening exposes a legal player placement');
const replay = createPlacementReplay(challenge.id);
replay.record({ wave: 1, time: 1.234, slot: firstMove.slot, row: firstMove.row, col: firstMove.col, lines: firstMove.lines, combo: 0 });
const exported = replay.export();
check(exported.version === 2 && exported.challengeId === challenge.id, 'replay is versioned and tied to its challenge');
check(exported.actions[0].at === 1.23 && Number.isInteger(exported.actions[0].row),
  'replay records a compact legal placement');
exported.actions[0].row = 99;
check(replay.export().actions[0].row === firstMove.row, 'exported replay cannot mutate the recorder');

if (failures) process.exitCode = 1;
else console.log('Weekly Constellation checks passed.');
