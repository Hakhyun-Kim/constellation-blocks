export const PREFERENCES_SCHEMA_VERSION = 1;

export const KEY_ACTIONS = Object.freeze([
  Object.freeze({ id: 'spell', label: '별똥별', defaultCode: 'KeyA' }),
  Object.freeze({ id: 'ultimate', label: '은하수', defaultCode: 'KeyE' }),
  Object.freeze({ id: 'skills', label: '별지기 별자리', defaultCode: 'KeyV' }),
  Object.freeze({ id: 'codex', label: '도감·기록', defaultCode: 'KeyB' }),
  Object.freeze({ id: 'squad', label: '영웅 성장 탭', defaultCode: 'KeyS' }),
  Object.freeze({ id: 'combine', label: '빠른 조합', defaultCode: 'KeyC' }),
  Object.freeze({ id: 'spectate', label: 'AI 관전', defaultCode: 'KeyD' }),
  Object.freeze({ id: 'mute', label: '전체 음소거', defaultCode: 'KeyM' }),
  Object.freeze({ id: 'speed', label: '게임 속도', defaultCode: 'KeyQ' }),
  Object.freeze({ id: 'cycleHero', label: '배치 영웅 선택', defaultCode: 'KeyF' }),
  Object.freeze({ id: 'blueprint', label: '몬스터 청사진', defaultCode: 'KeyG' }),
  Object.freeze({ id: 'recall', label: '영웅 회수', defaultCode: 'KeyR' }),
  Object.freeze({ id: 'sell', label: '영웅 판매', defaultCode: 'KeyX' }),
  Object.freeze({ id: 'castleRepair', label: '성 수리', defaultCode: 'Digit7' }),
  Object.freeze({ id: 'castleFortify', label: '성벽 강화', defaultCode: 'Digit8' }),
  Object.freeze({ id: 'castleTower', label: '마법 포탑', defaultCode: 'Digit9' }),
]);

const ACTION_IDS = new Set(KEY_ACTIONS.map(({ id }) => id));
const RESERVED_CODES = new Set([
  'Escape', 'Enter', 'Space', 'Tab',
  'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown',
]);

export const defaultBindings = () => Object.fromEntries(
  KEY_ACTIONS.map(({ id, defaultCode }) => [id, defaultCode]),
);

export function isBindableCode(code) {
  if (typeof code !== 'string' || RESERVED_CODES.has(code)) return false;
  return /^(Key[A-Z]|Digit[0-9]|Numpad[0-9]|F(?:[1-9]|1[0-2]))$/.test(code);
}

export function normalizeBindings(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  const result = {};
  const used = new Set();
  const fallbackCodes = KEY_ACTIONS.map(({ defaultCode }) => defaultCode);
  for (const action of KEY_ACTIONS) {
    const requested = source[action.id];
    let code = isBindableCode(requested) && !used.has(requested) ? requested : action.defaultCode;
    if (used.has(code)) code = fallbackCodes.find((candidate) => !used.has(candidate));
    result[action.id] = code;
    used.add(code);
  }
  return result;
}

export function rebindAction(bindings, actionId, code) {
  if (!ACTION_IDS.has(actionId)) return { ok: false, reason: 'action', bindings: normalizeBindings(bindings) };
  if (!isBindableCode(code)) return { ok: false, reason: 'reserved', bindings: normalizeBindings(bindings) };
  const next = normalizeBindings(bindings);
  const previous = next[actionId];
  const conflict = KEY_ACTIONS.find(({ id }) => id !== actionId && next[id] === code)?.id || null;
  next[actionId] = code;
  if (conflict) next[conflict] = previous;
  return { ok: true, bindings: next, swappedAction: conflict };
}

export function actionForCode(bindings, code) {
  const normalized = normalizeBindings(bindings);
  return KEY_ACTIONS.find(({ id }) => normalized[id] === code)?.id || null;
}

export function keyCodeLabel(code) {
  if (/^Key[A-Z]$/.test(code)) return code.slice(3);
  if (/^Digit[0-9]$/.test(code)) return code.slice(5);
  if (/^Numpad[0-9]$/.test(code)) return `Num ${code.slice(6)}`;
  return code || '—';
}
