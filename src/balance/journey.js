/* Authored first chapter.  Coordinates are presentation hints only; all
 * movement and rewards are resolved by engine/journey.js. */
const DAWN_ROAD_CHAPTER = {
  id: 'dawn-road',
  number: 1,
  title: '여명의 성도',
  subtitle: '성문 밖, 흩어진 별의 동료를 찾아라',
  start: 'gate',
  nodes: [
    { id: 'gate', kind: 'start', icon: '✦', name: '별문', text: '아린과 루나는 무너진 성문을 지나 별빛 길로 나선다.', x: 8, y: 56, next: ['meadow'] },
    { id: 'meadow', kind: 'battle', icon: '⚔', name: '푸른 초원', text: '먼저 다가오는 무리를 막아 길을 확보한다.', x: 24, y: 56, waves: 2, threat: 1, region: 'verdant-dawn', next: ['relic', 'town'] },
    { id: 'relic', kind: 'treasure', icon: '✧', name: '달의 유물', text: '빛나는 보급품이 성의 방어를 보탠다.', x: 42, y: 27, gold: 80, heal: 16, next: ['observatory'] },
    { id: 'town', kind: 'town', icon: '⌂', name: '갈림길 마을', text: '광장을 걸으며 동료를 설득하고, 대장간·신전·길드에서 전문화를 고른다.', x: 43, y: 79, offers: ['doyun', 'sera'], facilities: ['forge', 'shrine', 'guild'], next: ['camp'] },
    { id: 'observatory', kind: 'recruit', icon: '☾', name: '별 관측소', text: '별의 파동을 읽는 유나가 길을 함께한다.', x: 61, y: 29, offers: ['yuna'], next: ['camp'] },
    { id: 'camp', kind: 'camp', icon: '⟡', name: '은빛 야영지', text: '성문을 향하기 전, 잠시 전열을 가다듬는다.', x: 68, y: 57, gold: 55, heal: 26, next: ['boss'] },
    { id: 'boss', kind: 'boss', icon: '♜', name: '붉은 성문', text: '성도를 노리는 군세의 지휘관이 길을 막는다.', x: 89, y: 56, waves: 5, threat: 7, region: 'ember-gate', next: [] },
  ],
};

/* Chapters are ordered campaign data. Keep the legacy single-chapter export
 * during the migration, but new engine/UI code resolves by the saved id. */
export const JOURNEY_CHAPTERS = Object.freeze([DAWN_ROAD_CHAPTER]);
export const JOURNEY_CHAPTER = JOURNEY_CHAPTERS[0];

export const JOURNEY_KIND = {
  start: { label: '출발', color: '#aab9ff' },
  battle: { label: '전투', color: '#ff7d93' },
  treasure: { label: '보물', color: '#ffd26e' },
  town: { label: '마을', color: '#7edff0' },
  recruit: { label: '동료', color: '#c49aff' },
  camp: { label: '야영', color: '#7fe0a2' },
  boss: { label: '보스', color: '#ff956b' },
};
