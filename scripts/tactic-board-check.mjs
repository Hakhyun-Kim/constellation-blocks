import * as Board from '../src/tactics/board.js';

let failures = 0;
function check(condition, message) {
  if (condition) return;
  failures++;
  console.error(`FAIL: ${message}`);
}

function mulberry32(seed) {
  return () => {
    let value = seed += 0x6D2B79F5;
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

const stable = Board.createStableBoard(mulberry32(20260810));
check(stable.length === Board.BOARD_SIZE ** 2, 'stable board has 36 cells');
check(Board.findMatchGroups(stable).length === 0, 'stable board has no automatic match');

const source = Array.from({ length: 36 }, (_, index) => `cell-${index}`);
const swapped = Board.swapCells(source, 0, 1);
check(source[0] === 'cell-0' && source[1] === 'cell-1', 'swap does not mutate the source board');
check(swapped[0] === 'cell-1' && swapped[1] === 'cell-0', 'swap exchanges requested cells');
check(Board.areNeighbors(0, 1), 'horizontal neighbors are accepted');
check(Board.areNeighbors(0, 6), 'vertical neighbors are accepted');
check(!Board.areNeighbors(0, 2), 'non-neighbors are rejected');

const legalSource = Array.from({ length: 36 }, (_, index) => `cell-${index}`);
legalSource[0] = 'flare'; legalSource[1] = 'tide'; legalSource[2] = 'flare'; legalSource[7] = 'flare';
const legalMoves = Board.findLegalSwaps(legalSource);
const legal = legalMoves.find(move => move.from === 1 && move.to === 7);
check(!!legal, 'legal swaps include an adjacent swap that creates a match');
check(legal && legal.groups.some(group => group.length === 3 && legal.cells[group[0]] === 'flare'),
  'legal swap reports its matched type and group');
check(legalSource[1] === 'tide' && legalSource[7] === 'flare', 'legal-swap search does not mutate its source board');

const separate = Array.from({ length: 36 }, (_, index) => `cell-${index}`);
[0, 1, 2].forEach(index => { separate[index] = 'flare'; });
[9, 15, 21].forEach(index => { separate[index] = 'tide'; });
const separateGroups = Board.findMatchGroups(separate);
check(separateGroups.length === 2, 'independent matches remain separate groups');
check(separateGroups.some(group => group.length === 3 && separate[group[0]] === 'flare'), 'flare group is preserved');
check(separateGroups.some(group => group.length === 3 && separate[group[0]] === 'tide'), 'tide group is preserved');
check(Board.laneForGroup([0, 1, 2]) === 0, 'left group maps to left lane');
check(Board.laneForGroup([9, 15, 21]) === 1, 'middle group maps to middle lane');

const cross = Array.from({ length: 36 }, (_, index) => `cell-${index}`);
[1, 6, 7, 8, 13].forEach(index => { cross[index] = 'bloom'; });
const crossGroups = Board.findMatchGroups(cross);
check(crossGroups.length === 1 && crossGroups[0].length === 5, 'cross-shaped match is one connected group');

const refilled = Board.refillCells(source, [0, 5], () => 0);
check(source[0] === 'cell-0' && source[5] === 'cell-5', 'refill does not mutate the source board');
check(refilled[0] === 'flare' && refilled[5] === 'flare', 'refill uses the injected random source');

if (failures) process.exitCode = 1;
else console.log('Tactic board checks passed.');
