const WEEK_RE = /^\d{4}-W\d{2}$/;

export const WEEKLY_RULES = Object.freeze({
  endsAfterChapter: 'dawn-road',
  defenses: 7,
  targetMinutes: Object.freeze([10, 15]),
});

export function weeklyId(date = new Date()) {
  const utc = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = utc.getUTCDay() || 7;
  utc.setUTCDate(utc.getUTCDate() + 4 - day);
  const yearStart = new Date(Date.UTC(utc.getUTCFullYear(), 0, 1));
  const week = Math.ceil((((utc - yearStart) / 86400000) + 1) / 7);
  return `${utc.getUTCFullYear()}-W${String(week).padStart(2, '0')}`;
}

export function normalizeWeeklyId(value, now = new Date()) {
  if (value == null || value === '' || value === '1' || value === 'current') return weeklyId(now);
  return WEEK_RE.test(value) ? value : null;
}

export function seedForChallenge(id) {
  let hash = 2166136261;
  for (const char of `constellation-blocks:${id}`) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

export function seededRandom(seed) {
  let value = seed >>> 0;
  return () => {
    value += 0x6D2B79F5;
    let out = value;
    out = Math.imul(out ^ (out >>> 15), out | 1);
    out ^= out + Math.imul(out ^ (out >>> 7), out | 61);
    return ((out ^ (out >>> 14)) >>> 0) / 4294967296;
  };
}

export function createWeeklyChallenge(id) {
  const normalized = normalizeWeeklyId(id);
  if (!normalized) return null;
  const seed = seedForChallenge(normalized);
  return Object.freeze({
    id: normalized,
    seed,
    label: `Weekly Constellation · ${normalized}`,
    endsAfterChapter: WEEKLY_RULES.endsAfterChapter,
    targetMinutes: WEEKLY_RULES.targetMinutes,
  });
}

/* 리플레이는 "무엇을 놓았는가"만 남긴다. 판 전체를 저장하지 않아도
 * 같은 시드에서 같은 조각이 나오므로 배치 순서만으로 재생된다. */
export function createPlacementReplay(challengeId) {
  const actions = [];
  return {
    record({ wave, time, slot, row, col, lines = 0, combo = 0 }) {
      actions.push({
        n: actions.length + 1,
        wave: Math.max(1, Math.round(wave || 1)),
        at: Math.max(0, Math.round((time || 0) * 100) / 100),
        slot,
        row,
        col,
        lines,
        combo,
      });
    },
    clear() { actions.length = 0; },
    export() { return { version: 2, challengeId, actions: actions.map(action => ({ ...action })) }; },
  };
}
