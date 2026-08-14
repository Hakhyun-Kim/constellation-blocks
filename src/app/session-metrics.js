import {
  evaluateEarlyAccessScope,
  normalizePlaytestExperience,
  summarizePlaytestSessions,
} from './playtest-analysis.js';

export const PLAYTEST_SCHEMA_VERSION = 1;
export const PLAYTEST_STORAGE_KEY = 'constellation-defense.playtest-sessions';
export const PLAYTEST_LIMIT = 40;

const ACTION_KEYS = Object.freeze([
  'waveStarts', 'tacticSwaps', 'tacticCasts', 'heroActives',
  'blueprintCasts', 'journeyMoves', 'recruits', 'restarts',
]);

const freshActions = () => Object.fromEntries(ACTION_KEYS.map((key) => [key, 0]));
const roundMs = (value) => Math.max(0, Math.round(Number(value) || 0));
const clone = (value) => JSON.parse(JSON.stringify(value));

function safeIso(value) {
  try { return new Date(value).toISOString(); }
  catch { return new Date(0).toISOString(); }
}

export function createSessionMeter({
  mode = 'campaign',
  challengeId = null,
  difficulty = 'normal',
  experience = 'unspecified',
  startKind = 'new',
  retryOf = null,
  clock = () => performance.now(),
  epoch = () => Date.now(),
} = {}) {
  const startedEpoch = epoch();
  const record = {
    schemaVersion: PLAYTEST_SCHEMA_VERSION,
    mode: mode === 'weekly' ? 'weekly' : 'campaign',
    challengeId: challengeId || null,
    difficulty,
    experience: normalizePlaytestExperience(experience),
    startKind: ['new', 'continue', 'retry'].includes(startKind) ? startKind : 'new',
    retryOf: Number.isInteger(retryOf) ? retryOf : null,
    startedAt: safeIso(startedEpoch),
    completedAt: null,
    outcome: 'in-progress',
    elapsedMs: 0,
    activeMs: 0,
    phaseMs: {},
    actions: freshActions(),
    checkpoints: {},
    chapter: null,
    node: null,
    maxWave: 1,
  };
  let lastClock = Number(clock()) || 0;
  let lastView = { active: false, phase: 'idle' };
  let finished = false;

  const applyContext = (context = {}) => {
    if (context.chapter) record.chapter = context.chapter;
    if (context.node) record.node = context.node;
    if (Number.isFinite(context.wave)) record.maxWave = Math.max(record.maxWave, Math.round(context.wave));
  };

  const flush = (now = clock()) => {
    const current = Number(now);
    const delta = Number.isFinite(current) ? Math.max(0, current - lastClock) : 0;
    lastClock = Number.isFinite(current) ? current : lastClock;
    record.elapsedMs += delta;
    if (lastView.active) {
      record.activeMs += delta;
      record.phaseMs[lastView.phase] = (record.phaseMs[lastView.phase] || 0) + delta;
    }
  };

  const checkpoint = (key, context = {}, now = clock()) => {
    if (finished || !key || record.checkpoints[key]) return false;
    flush(now);
    applyContext(context);
    record.checkpoints[key] = {
      elapsedMs: roundMs(record.elapsedMs),
      activeMs: roundMs(record.activeMs),
      chapter: context.chapter || record.chapter,
      node: context.node || record.node,
      wave: Number.isFinite(context.wave) ? Math.round(context.wave) : record.maxWave,
    };
    return true;
  };

  return {
    observe(view = {}, now = clock()) {
      if (finished) return;
      flush(now);
      applyContext(view);
      lastView = {
        active: !!view.active,
        phase: String(view.phase || 'unknown'),
      };
    },
    action(key, amount = 1) {
      if (finished || !Object.hasOwn(record.actions, key)) return false;
      record.actions[key] += Math.max(0, Math.round(Number(amount) || 0));
      return true;
    },
    checkpoint,
    finish(outcome, context = {}, now = clock()) {
      if (finished) return null;
      flush(now);
      applyContext(context);
      finished = true;
      record.outcome = String(outcome || 'abandon');
      record.completedAt = safeIso(epoch());
      return this.snapshot();
    },
    snapshot() {
      const out = clone(record);
      out.elapsedMs = roundMs(out.elapsedMs);
      out.activeMs = roundMs(out.activeMs);
      out.phaseMs = Object.fromEntries(Object.entries(out.phaseMs).map(([key, value]) => [key, roundMs(value)]));
      return out;
    },
    get finished() { return finished; },
  };
}

export function createLocalPlaytestLog(storage = globalThis.localStorage, {
  limit = PLAYTEST_LIMIT,
  now = () => Date.now(),
} = {}) {
  const read = () => {
    try {
      const value = JSON.parse(storage?.getItem(PLAYTEST_STORAGE_KEY) || '[]');
      return Array.isArray(value) ? value.filter((entry) => entry?.schemaVersion === PLAYTEST_SCHEMA_VERSION) : [];
    } catch { return []; }
  };
  const write = (records) => {
    try {
      storage?.setItem(PLAYTEST_STORAGE_KEY, JSON.stringify(records.slice(-limit)));
      return !!storage;
    } catch { return false; }
  };
  return {
    append(record) {
      if (!record || record.outcome === 'in-progress') return null;
      const records = read();
      const sequence = Math.max(0, ...records.map((entry) => Number(entry.sequence) || 0)) + 1;
      const stored = { ...clone(record), sequence };
      records.push(stored);
      return write(records) ? clone(stored) : null;
    },
    records: () => clone(read()),
    export() {
      const sessions = clone(read());
      const summary = summarizePlaytestSessions(sessions);
      return {
        schemaVersion: PLAYTEST_SCHEMA_VERSION,
        exportedAt: safeIso(now()),
        privacy: 'Stored locally; no network telemetry and no personal identifier.',
        evidence: {
          qualification: 'unverified-local',
          participantCount: null,
          note: 'Count participants only when these sessions were collected under the documented human playtest protocol.',
        },
        analysis: {
          summary,
          earlyAccess: evaluateEarlyAccessScope(summary),
        },
        sessions,
      };
    },
    clear: () => write([]),
  };
}

export const formatPlayMinutes = (milliseconds) => `${(roundMs(milliseconds) / 60000).toFixed(1)}분`;
