/* =====================================================
 * 성좌 공명 순수 규칙 — DOM/렌더러 없이 조합 합·목표·보너스를 결정한다.
 * ===================================================== */
import * as D from '../data.js';

export const laneName = (lane) => ['왼쪽', '가운데', '오른쪽'][lane] || '알 수 없는';

export function createResonance(wave) {
  const patterns = D.RESONANCE_TARGETS;
  const index = Math.max(0, Math.floor(wave || 1) - 1) % patterns.length;
  return { targets: [...patterns[index]], active: [false, false, false] };
}

export const heroStarValue = (cls) => D.HERO_STAR_VALUE[cls] || 0;

/* listCombos가 주는 공개 조합 정보만으로 합을 낸다. */
export function comboStarValue(combo) {
  if (!combo) return 0;
  if (combo.kind === 'rankup') return heroStarValue(combo.cls) * 2;
  return heroStarValue(combo.a) + heroStarValue(combo.b);
}

export function matchingResonanceLanes(state, comboOrValue) {
  const value = typeof comboOrValue === 'number' ? comboOrValue : comboStarValue(comboOrValue);
  const targets = state?.resonance?.targets || [];
  return targets.reduce((lanes, target, lane) => {
    if (target === value) lanes.push(lane);
    return lanes;
  }, []);
}

/* 조합 결과는 항상 정상 탄생한다. 합이 맞으면 아직 켜지지 않은 길 하나를 켠다. */
export function activateResonance(state, value) {
  if (!state.resonance) state.resonance = createResonance(state.wave);
  const lanes = matchingResonanceLanes(state, value);
  const lane = lanes.find(index => !state.resonance.active[index]);
  if (lane == null) return { matched: lanes.length > 0, activated: false, value, lane: lanes[0] };
  state.resonance.active[lane] = true;
  state.resonanceCasts = (state.resonanceCasts || 0) + 1;
  return { matched: true, activated: true, value, lane };
}

export function resonanceDamageMul(state, lane) {
  return state?.resonance?.active?.[lane] ? D.RESONANCE_DAMAGE_MUL : 1;
}

/* 저장은 준비 단계에서만 가능하다. 목표 수는 웨이브로 결정적 재생성하고,
 * 이미 켠 길만 복원해 사용자 편집 저장으로 목표가 바뀌지 않게 한다. */
export function restoreResonance(state, record) {
  state.resonance = createResonance(state.wave);
  if (!record || !Array.isArray(record.active)) return;
  state.resonance.active = state.resonance.active.map((_, lane) => record.active[lane] === true);
}
