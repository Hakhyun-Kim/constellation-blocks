import { WEEKLY_RULES, createWeeklyChallenge, createSwapReplay, normalizeWeeklyId, seededRandom, weeklyId } from '../src/challenges/weekly.js';
import { createStableBoard, findLegalSwaps } from '../src/tactics/board.js';

let failures = 0;
const check = (condition, message) => condition ? console.log(`✅ weekly: ${message}`) : (failures++, console.error(`FAIL weekly: ${message}`));

check(weeklyId(new Date('2026-08-12T00:00:00Z')) === '2026-W33', 'UTC date maps to a stable ISO week');
check(normalizeWeeklyId('bad') === null, 'invalid challenge ids are rejected');
const challenge = createWeeklyChallenge('2026-W33');
check(challenge.endsAfterChapter === 'dawn-road' && WEEKLY_RULES.defenses === 7
  && challenge.targetMinutes.join('-') === '10-15', 'weekly scope is the seven-defense first chapter and 10-15 minute target');
const boardA = createStableBoard(seededRandom(challenge.seed));
const boardB = createStableBoard(seededRandom(challenge.seed));
check(JSON.stringify(boardA) === JSON.stringify(boardB), 'same challenge id creates the same opening board');
const firstMove = findLegalSwaps(boardA)[0];
check(!!firstMove, 'weekly opening exposes a legal player move');
const replay = createSwapReplay(challenge.id);
replay.record({ wave: 1, time: 1.234, from: firstMove.from, to: firstMove.to, groups: firstMove.groups });
const exported = replay.export();
check(exported.version === 1 && exported.challengeId === challenge.id, 'replay is versioned and tied to its challenge');
check(exported.actions[0].at === 1.23 && exported.actions[0].groups.length > 0, 'replay records a compact legal-swap result');
exported.actions[0].groups[0].push(99);
check(!replay.export().actions[0].groups[0].includes(99), 'exported replay cannot mutate the recorder');

if (failures) process.exitCode = 1;
else console.log('Weekly Constellation checks passed.');
