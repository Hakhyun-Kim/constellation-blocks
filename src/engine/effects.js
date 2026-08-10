/* =====================================================
 * 전투 공통 효과 — 피해·상태이상
 *
 * 기본 전투, 별지기, 별자리 전술이 같은 처치 보상·상태 이상 규칙을 공유한다.
 * 전술 모듈이 combat.js 내부 함수에 의존하지 않게 분리한 낮은 계층이다.
 * ===================================================== */
import * as D from '../data.js';
import { champKillXp, gainChampXp, chargeUlt } from './champion.js';

export function damageEnemy(state, enemy, dmg, events, kind = 'hit', healOnKill = 0) {
  if (enemy.dead) return;
  enemy.hp -= dmg;
  events.push({ type: 'enemyHit', x: enemy.x, y: enemy.y - enemy.size / 2, dmg, kind });
  if (enemy.hp > 0) return;

  enemy.dead = true;
  state.kills++;
  if (enemy.boss) state.bossKills++;
  if (enemy.midBoss) state.midBossKills++;
  state.combo.count++;
  state.combo.timer = D.COMBO.window;
  const mul = state.combo.count >= D.COMBO.x3At ? 3 : state.combo.count >= D.COMBO.x2At ? 2 : 1;
  const gold = enemy.gold * mul;
  state.gold += gold;
  state.goldEarned += gold;
  events.push({
    type: 'kill', x: enemy.x, y: enemy.y, gold, etype: enemy.type,
    boss: enemy.boss, midBoss: enemy.midBoss, name: enemy.name,
    combo: state.combo.count, mul,
  });
  if (healOnKill > 0 && state.castleHp < state.castleMax) {
    state.castleHp = Math.min(state.castleMax, state.castleHp + healOnKill);
    events.push({ type: 'castleHeal', amount: healOnKill, x: enemy.x, y: enemy.y });
  }
  if (state.champ) {
    gainChampXp(state, champKillXp(enemy), events);
    chargeUlt(state,
      enemy.boss ? D.ULT.boss : enemy.midBoss ? D.ULT.mid : enemy.elite ? D.ULT.elite : D.ULT.kill, events);
  }
}

export function applyBurn(enemy, dmg, ratio) {
  enemy.burn = { dps: Math.max(1, Math.round(dmg * ratio)), t: D.BURN_DUR };
}

export function applySlow(enemy, slow) {
  if (enemy.slowT > 0) enemy.slowMul = Math.min(enemy.slowMul, slow.mul);
  else enemy.slowMul = slow.mul;
  enemy.slowT = Math.max(enemy.slowT, slow.dur);
}

export function applyStun(enemy, dur) {
  if (enemy.stunImmuneT > 0) return false;
  const actual = dur * ((enemy.boss || enemy.midBoss) ? D.STUN_BOSS_MUL : 1);
  enemy.stunT = actual;
  enemy.stunImmuneT = actual + D.STUN_IMMUNE;
  return true;
}
