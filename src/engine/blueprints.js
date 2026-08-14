/* Monster-blueprint commands are pure engine operations. UI and bots call
 * the same command, while combat.js only advances the resulting summon. */
import * as D from '../data.js';

const aliveOnRoute = (state, route) => state.enemies
  .filter((enemy) => !enemy.dead && enemy.route === route);

const enemyPressure = (enemy) => 1 + (enemy.s / D.ROUTE_LENS[enemy.route]) * 2.5
  + (enemy.boss ? 4 : enemy.midBoss ? 2 : enemy.elite ? .5 : 0);

export function availableMonsterBlueprint(state) {
  const spec = D.monsterBlueprintSpec();
  return state?.journey?.flags?.['alignment-hub'] === spec?.routeFlag ? spec : null;
}

export function monsterBlueprintTargetRoute(state) {
  let best = null;
  for (let route = 0; route < D.ROUTES.length; route++) {
    const enemies = aliveOnRoute(state, route);
    if (!enemies.length) continue;
    const score = enemies.reduce((sum, enemy) => sum + enemyPressure(enemy), 0);
    if (!best || score > best.score || (score === best.score && route < best.route)) best = { route, score };
  }
  return best;
}

export function canCastMonsterBlueprint(state) {
  const spec = availableMonsterBlueprint(state);
  if (!spec) return { ok: false, reason: 'locked' };
  if (state.phase !== 'wave') return { ok: false, reason: 'phase', spec };
  if (state.blueprintUsedWave === state.wave) return { ok: false, reason: 'charge', spec };
  const target = monsterBlueprintTargetRoute(state);
  if (!target) return { ok: false, reason: 'none', spec };
  return { ok: true, spec, target };
}

export function castMonsterBlueprint(state, route = null) {
  const available = canCastMonsterBlueprint(state);
  if (!available.ok) return available;
  const target = route == null ? available.target : { route };
  if (!Number.isInteger(target.route) || target.route < 0 || target.route >= D.ROUTES.length) {
    return { ok: false, reason: 'route', spec: available.spec };
  }
  if (!aliveOnRoute(state, target.route).length) return { ok: false, reason: 'none', spec: available.spec };

  const spec = available.spec;
  const point = D.routePoint(target.route, D.ROUTE_LENS[target.route] * spec.deployProgress);
  const summon = {
    id: state.nextId++, blueprint: spec.key, route: target.route,
    x: point.x, y: point.y, life: spec.duration, attackCd: .15, attacks: 0,
  };
  state.blueprintSummons.push(summon);
  state.blueprintUsedWave = state.wave;
  state.blueprintCasts = (state.blueprintCasts || 0) + 1;
  return {
    ok: true, spec, summon,
    events: [{
      type: 'blueprintSummon', summonId: summon.id, blueprint: spec.key,
      name: spec.summonName, emoji: spec.emoji, route: summon.route, x: summon.x, y: summon.y,
    }],
  };
}

export function updateMonsterBlueprints(state, dt, events) {
  for (const summon of state.blueprintSummons) {
    summon.life -= dt;
    summon.attackCd -= dt;
    if (summon.life <= 0) {
      events.push({ type: 'blueprintDismiss', summonId: summon.id, x: summon.x, y: summon.y });
      continue;
    }
    if (summon.attackCd > 0) continue;
    const spec = D.monsterBlueprintSpec(summon.blueprint);
    const target = aliveOnRoute(state, summon.route)
      .sort((a, b) => enemyPressure(b) - enemyPressure(a) || a.id - b.id)[0];
    if (!spec || !target) {
      summon.attackCd = .2;
      continue;
    }
    summon.attackCd = spec.attackPeriod;
    summon.attacks++;
    state.projectiles.push({
      id: state.nextId++, kind: 'blueprint', x: summon.x, y: summon.y,
      srcX: summon.x, srcY: summon.y, target, dmg: spec.damage,
      spd: spec.projectileSpeed, dead: false, splash: 0, pierce: 1,
    });
    events.push({
      type: 'blueprintAttack', summonId: summon.id, blueprint: spec.key,
      x: summon.x, y: summon.y, tx: target.x, ty: target.y,
    });
  }
  state.blueprintSummons = state.blueprintSummons.filter((summon) => summon.life > 0);
}
