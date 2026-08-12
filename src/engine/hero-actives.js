/* Named squad combat actives. These are pure engine commands: UI, bots, and
 * keyboard input all call this same function and receive presentation events. */
import * as D from '../data.js';
import { applySlow, applyStun, damageEnemy } from './effects.js';

const progress = (enemy) => enemy.s / D.ROUTE_LENS[enemy.route];
const danger = (enemy) => progress(enemy) + (enemy.boss ? 4 : enemy.midBoss ? 2 : enemy.elite ? .5 : 0);

function dangerousFirst(a, b) {
  return danger(b) - danger(a) || a.id - b.id;
}

function pressureRoute(enemies) {
  const pressure = [0, 0, 0];
  for (const enemy of enemies) pressure[enemy.route] += 1 + progress(enemy) * 2.5
    + (enemy.boss ? 4 : enemy.midBoss ? 2 : 0);
  let route = 0;
  for (let index = 1; index < pressure.length; index++) {
    if (pressure[index] > pressure[route]) route = index;
  }
  return route;
}

export function castHeroActive(state, heroId) {
  const hero = state?.field?.find((entry) => entry.id === heroId);
  const spec = D.heroActiveSpec(hero?.heroKey);
  if (!hero || !spec) return { ok: false, reason: 'hero' };
  if (state.phase !== 'wave') return { ok: false, reason: 'phase', hero, spec };
  if ((hero.activeCd || 0) > 0) return { ok: false, reason: 'cd', left: hero.activeCd, hero, spec };
  const alive = state.enemies.filter((enemy) => !enemy.dead);
  if (!alive.length) return { ok: false, reason: 'none', hero, spec };

  const ordered = [...alive].sort(dangerousFirst);
  const anchor = ordered[0];
  const route = pressureRoute(alive);
  let targets = [];
  if (spec.kind === 'strike') targets = [anchor];
  else if (spec.kind === 'nova') targets = alive.filter((enemy) =>
    Math.hypot(enemy.x - anchor.x, enemy.y - anchor.y) <= spec.radius).sort(dangerousFirst);
  else if (spec.kind === 'ward' || spec.kind === 'frost') {
    targets = alive.filter((enemy) => enemy.route === route).sort(dangerousFirst);
  } else if (spec.kind === 'volley') {
    targets = alive.filter((enemy) => enemy.route === route).sort(dangerousFirst).slice(0, spec.targets);
  }
  if (!targets.length) return { ok: false, reason: 'none', hero, spec };

  hero.activeCd = spec.cooldown;
  state.heroActiveCasts = (state.heroActiveCasts || 0) + 1;
  const events = [{
    type: 'heroActive', heroId: hero.id, heroKey: hero.heroKey,
    heroName: hero.name, ability: spec.name, emoji: spec.emoji, kind: spec.kind,
    x: hero.x, y: hero.y, route,
    hits: targets.map((enemy) => ({ x: enemy.x, y: enemy.y })),
  }];
  const damage = Math.max(1, Math.round(hero.dmg * spec.damageMul));
  for (const enemy of targets) {
    damageEnemy(state, enemy, damage, events, 'active', 0, null, hero.id);
    if (enemy.dead) continue;
    if (spec.kind === 'strike') applyStun(enemy, .45);
    if (spec.stun) applyStun(enemy, spec.stun);
    if (spec.slow) applySlow(enemy, spec.slow);
  }
  return { ok: true, hero, spec, route, targets: targets.length, events };
}
