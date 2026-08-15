/* =====================================================
 * 별자리 블록 밸런스 — 퍼즐이 방어선에 얼마나 세게 닿는지만 정한다.
 *
 * 여기에는 "무엇이 발동하는가"(engine/tactics.js)나 "어떻게 놓이는가"
 * (blocks/board.js)를 넣지 않는다. 판 크기·조각 모양 같은 구조는 퍼즐 규칙이고,
 * 등급·연쇄 보너스·조각 등장 확률은 밸런스다. 둘을 섞으면 난이도를 만질 때마다
 * 규칙 파일을 열어야 한다.
 * ===================================================== */

export const TRAY_SIZE = 3;

/* 한 번의 배치로 동시에 지운 줄 수 → 전술 등급(3·4·5).
 * 등급은 balance/tactics.js의 기존 3·4·5 표를 그대로 쓴다. 퍼즐이 바뀌어도
 * 방어선 수치는 한 곳에만 남는다. */
export const CLEAR_TIERS = Object.freeze({ 1: 3, 2: 4, 3: 5 });

/* 연속으로 줄을 지운 횟수가 이 값에 닿으면 한 등급 위로 올라간다.
 * "계속 정리하는 사람"에게 주는 보상이며, 한 번 실패하면 0으로 돌아간다. */
export const COMBO_BONUS_AT = 3;

/* 가로줄은 세 방어로에 나눠 퍼지므로 한 등급 낮게 친다.
 * 세로줄 하나 = 한 길에 집중, 가로줄 하나 = 세 길에 얕게. 이 비대칭이
 * "어디를 지울까"를 실제 선택으로 만든다. */
export const ROW_SPREAD_PENALTY = 1;

/* 트레이가 판에 하나도 안 들어갈 때 다시 뽑는 횟수.
 * 디펜스는 멈추면 안 되므로 막힘은 게임오버가 아니라 템포 손실로 처리한다. */
export const DEADLOCK_REDRAWS = 8;

/* 조각 등장 가중치 — 초3~6이 대상이라 1~4칸 조각을 넉넉히 준다.
 * 5칸·3×3은 판을 크게 정리할 수 있지만 잘못 놓으면 바로 막히므로 낮게 둔다. */
export const PIECE_WEIGHTS = Object.freeze({
  dot: 5,
  duo: 7, duoV: 7,
  tri: 6, triV: 6,
  quad: 3, quadV: 3,
  penta: 1, pentaV: 1,
  square: 5,
  bigSquare: 1,
  cornerNE: 4, cornerSE: 4, cornerSW: 4, cornerNW: 4,
  bigCornerNE: 2, bigCornerSE: 2, bigCornerSW: 2, bigCornerNW: 2,
  teeN: 2, teeE: 2, teeS: 2, teeW: 2,
  zigH: 1, zigV: 1,
});

/* 조각 색(전술 종류) 가중치. 회복(bloom)이 너무 흔하면 방어가 헐거워진다. */
export const TYPE_WEIGHTS = Object.freeze({ flare: 4, tide: 3, bloom: 3 });

export const blockTier = (lines, combo = 0) => {
  const base = CLEAR_TIERS[Math.min(3, Math.max(1, lines))] || 3;
  return Math.min(5, base + (combo >= COMBO_BONUS_AT ? 1 : 0));
};
