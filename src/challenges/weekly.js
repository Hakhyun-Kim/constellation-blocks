const WEEK_RE = /^\d{4}-W\d{2}$/;

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
  for (const char of `constellation-defense:${id}`) {
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
  return Object.freeze({ id: normalized, seed, label: `Weekly Constellation · ${normalized}` });
}

export function createSwapReplay(challengeId) {
  const actions = [];
  return {
    record({ wave, time, from, to, groups }) {
      actions.push({
        n: actions.length + 1,
        wave: Math.max(1, Math.round(wave || 1)),
        at: Math.max(0, Math.round((time || 0) * 100) / 100),
        from,
        to,
        groups: (groups || []).map(group => [...group]),
      });
    },
    clear() { actions.length = 0; },
    export() { return { version: 1, challengeId, actions: actions.map(action => ({ ...action, groups: action.groups.map(group => [...group]) })) }; },
  };
}
