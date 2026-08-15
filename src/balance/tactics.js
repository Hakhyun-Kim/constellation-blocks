/* =====================================================
 * 별자리 전술 밸런스 — 보드가 아니라 방어선에 적용되는 수치만 둔다.
 * 퍼즐 UI(3매치 → 블록)가 바뀌어도 여기와 engine/tactics.js는 그대로 재사용한다.
 * 등급 3·4·5는 이제 '동시에 지운 줄 수 + 연속 정리'가 정한다(balance/blocks.js).
 * ===================================================== */

export const TACTICS = {
  flare: {
    baseDamage: 46,
    waveDamage: 8,
    targetCount: { 3: 3, 4: 5, 5: Infinity },
    impactRadius: { 3: 38, 4: 64, 5: 64 },
  },
  tide: {
    slow: {
      3: { mul: 0.52, dur: 2.7 },
      4: { mul: 0.35, dur: 2.7 },
      5: { mul: 0.18, dur: 4.5 },
    },
  },
  bloom: {
    baseHeal: 5,
    healPerStar: 2,
    pushCount: { 3: 2, 4: 4, 5: 4 },
    pushDistance: { 3: 48, 4: 48, 5: 100 },
  },
};

export const tacticPower = (size) => (size >= 5 ? 1.9 : size === 4 ? 1.35 : 1);
