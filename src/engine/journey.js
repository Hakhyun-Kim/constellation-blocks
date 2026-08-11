import * as D from '../data.js';
import { createSquadHero } from './squad.js';

const chapter = () => D.JOURNEY_CHAPTER;
export const journeyNode = (id) => chapter().nodes.find((node) => node.id === id) || null;

export function createJourney() {
  const start = chapter().start;
  return {
    chapter: chapter().id,
    current: start,
    visited: [start],
    cleared: [],
    pendingRecruit: null,
    activeBattle: null,
    wavesInBattle: 0,
    complete: false,
  };
}

export function journeyChoices(state) {
  const journey = state.journey;
  const current = journey && journeyNode(journey.current);
  if (!journey || !current || journey.pendingRecruit || journey.activeBattle || journey.complete) return [];
  return current.next.map(journeyNode).filter(Boolean);
}

/* UI·봇 모두 "이 노드의 몇 번째 방어인가"를 같은 순수 상태에서 읽는다. */
export function journeyBattleProgress(state) {
  const node = journeyNode(state?.journey?.activeBattle);
  if (!node || (node.kind !== 'battle' && node.kind !== 'boss')) return null;
  const total = Math.max(1, Math.round(node.waves || 1));
  const step = Math.max(1, Math.min(total, Math.round(state.journey.wavesInBattle || 0) + 1));
  return { node, step, total };
}

const markVisited = (journey, id) => {
  if (!journey.visited.includes(id)) journey.visited.push(id);
};

function applySupply(state, node) {
  const gold = Math.max(0, Math.round(node.gold || 0));
  const heal = Math.max(0, Math.round(node.heal || 0));
  state.gold += gold;
  state.castleHp = Math.min(state.castleMax, state.castleHp + heal);
  return { gold, heal };
}

export function travelJourney(state, id) {
  if (!state.journey || state.phase !== 'journey') return { ok: false, reason: 'phase' };
  const from = journeyNode(state.journey.current);
  const node = journeyNode(id);
  if (!from || !node || !from.next.includes(id)) return { ok: false, reason: 'path' };

  state.journey.current = id;
  markVisited(state.journey, id);
  if (node.kind === 'battle' || node.kind === 'boss') {
    state.journey.activeBattle = id;
    state.journey.wavesInBattle = 0;
    return { ok: true, type: 'battle', node };
  }
  if (node.kind === 'town' || node.kind === 'recruit') {
    state.journey.pendingRecruit = id;
    return { ok: true, type: 'recruit', node };
  }
  return { ok: true, type: 'supply', node, ...applySupply(state, node) };
}

export function recruitJourneyHero(state, key) {
  const journey = state.journey;
  const node = journey && journeyNode(journey.pendingRecruit);
  const spec = D.squadSpec(key);
  if (!journey || !node || !spec || !node.offers?.includes(key)) return { ok: false, reason: 'offer' };
  if (state.field.some((hero) => hero.heroKey === key)) return { ok: false, reason: 'owned' };
  if (state.field.length >= D.SQUAD_MAX) return { ok: false, reason: 'full' };
  const hero = createSquadHero(state, spec);
  const used = new Set(state.field.map((entry) => entry.padIndex));
  const pad = !used.has(spec.pad) ? spec.pad : D.PADS.findIndex((_, index) => !used.has(index));
  if (pad < 0) return { ok: false, reason: 'pad' };
  hero.padIndex = pad;
  hero.x = D.PADS[pad].x;
  hero.y = D.PADS[pad].y;
  state.field.push(hero);
  journey.pendingRecruit = null;
  return { ok: true, hero, node };
}

export function beginJourneyBattle(state) {
  const node = journeyNode(state.journey?.activeBattle);
  if (!node || (node.kind !== 'battle' && node.kind !== 'boss')) return { ok: false, reason: 'node' };
  state.wave = node.threat;
  state.phase = 'prep';
  return { ok: true, node };
}

export function completeJourneyWave(state) {
  const journey = state.journey;
  const node = journeyNode(journey?.activeBattle);
  if (!journey || !node) return { complete: false };
  journey.wavesInBattle++;
  if (journey.wavesInBattle < node.waves) return { complete: false, node };
  if (!journey.cleared.includes(node.id)) journey.cleared.push(node.id);
  journey.activeBattle = null;
  journey.wavesInBattle = 0;
  state.phase = 'journey';
  if (node.kind === 'boss') journey.complete = true;
  return { complete: true, chapterComplete: journey.complete, node };
}

export function serializeJourney(journey) {
  if (!journey) return null;
  return {
    chapter: journey.chapter,
    current: journey.current,
    visited: [...journey.visited],
    cleared: [...journey.cleared],
    pendingRecruit: journey.pendingRecruit,
    activeBattle: journey.activeBattle,
    wavesInBattle: journey.wavesInBattle,
    complete: !!journey.complete,
  };
}

export function restoreJourney(raw) {
  const fresh = createJourney();
  if (!raw || typeof raw !== 'object' || raw.chapter !== fresh.chapter) return fresh;
  const valid = (id) => typeof id === 'string' && !!journeyNode(id);
  fresh.current = valid(raw.current) ? raw.current : fresh.current;
  fresh.visited = Array.isArray(raw.visited) ? [...new Set(raw.visited.filter(valid))] : [fresh.current];
  if (!fresh.visited.includes(fresh.current)) fresh.visited.push(fresh.current);
  fresh.cleared = Array.isArray(raw.cleared) ? [...new Set(raw.cleared.filter(valid))] : [];
  fresh.pendingRecruit = valid(raw.pendingRecruit) ? raw.pendingRecruit : null;
  fresh.activeBattle = valid(raw.activeBattle) ? raw.activeBattle : null;
  fresh.wavesInBattle = Math.max(0, Math.min(9, Math.round(raw.wavesInBattle || 0)));
  fresh.complete = !!raw.complete;
  return fresh;
}
