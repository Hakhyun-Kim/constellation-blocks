/* Authored first chapter.  Coordinates are presentation hints only; all
 * movement and rewards are resolved by engine/journey.js. */
const DAWN_ROAD_CHAPTER = {
  id: 'dawn-road',
  number: 1,
  title: '여명의 성도',
  subtitle: '성문 밖, 흩어진 별의 동료를 찾아라',
  nextChapter: 'beyond-page',
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

/* Act 2 keeps eight map steps. The 3A/3B fork is one physical hub with an
 * engine-owned choice, so the map does not lie about its promised length. */
const BEYOND_PAGE_CHAPTER = {
  id: 'beyond-page',
  number: 2,
  title: '게이트 너머의 다음 페이지',
  subtitle: '현실과 책 세계를 잇는 두 번째 책갈피를 찾아라',
  start: 'turned-gate',
  endings: ['seal', 'coauthor'],
  nodes: [
    {
      id: 'turned-gate', kind: 'start', icon: '▤', name: '넘겨진 성문',
      text: '붉은 성문 뒤에서 출구가 아니라 넘겨지지 않은 다음 장이 열린다.', x: 7, y: 52, next: ['seoul-gate'],
      annotation: { id: 'next-page', title: '여백 주석 01', speaker: '루나', text: '별자리는 별이 아니었어. 문장을 제자리에 고정하는 교정 기호였어.' },
    },
    {
      id: 'seoul-gate', kind: 'battle', icon: '⚔', name: '서울 제7게이트',
      text: '무너진 도심에서 현실 헌터와 별빛 영웅단이 처음 마주친다.', x: 21, y: 52,
      waves: 3, threat: 10, region: 'neon-ruins', next: ['alignment-hub'],
      annotation: { id: 'disaster-app', title: '여백 주석 02', speaker: '시스템', text: '제7게이트가 재난 등급으로 승격되었습니다. 축하 쿠폰은 지급되지 않습니다.' },
    },
    {
      id: 'alignment-hub', kind: 'choice', icon: '⌁', name: '두 개의 설명',
      text: '헌터 연합과 여백회가 서로 다른 방식으로 같은 재난을 설명한다.', x: 35, y: 33, next: ['refugee-station'],
      choices: [
        { key: 'guild', icon: '🏢', name: '임시 헌터 길드', tag: '3A · 연합', text: '현실 장비와 질서를 택한다. 역촌에는 헌터 구조대가 합류한다.' },
        { key: 'market', icon: '👺', name: '지하 몬스터 시장', tag: '3B · 여백회', text: '몬스터의 증언을 듣는다. 청사진 권한의 흔적을 확보한다.' },
      ],
    },
    {
      id: 'refugee-station', kind: 'town', icon: '⌂', name: '피난민 역촌',
      text: '구조 인원과 선택한 세력에 따라 사람·시설·대사가 달라지는 두 번째 마을.', x: 48, y: 72,
      enterOnArrival: true, refugeeStation: true, facilities: ['forge', 'shrine', 'guild'], next: ['corrector-hunt'],
      annotation: { id: 'station-register', title: '여백 주석 03', speaker: '역촌 기록관', text: '이름을 적어 두면 배경 인물로 덮어써져도 누군가 다시 불러 줄 수 있다.' },
    },
    {
      id: 'corrector-hunt', kind: 'battle', icon: '⚔', name: '교정관의 사냥',
      text: '중간보스와 졸개가 편대로 밀려오고, 플레이어의 명령이 적에게도 들린다.', x: 61, y: 51,
      waves: 3, threat: 13, region: 'ashen-margin', protectsRefugees: true, next: ['nameless-archive'],
    },
    {
      id: 'nameless-archive', kind: 'clue', icon: '▧', name: '무명 서고',
      text: '현실 기억과 초고 0호가 처음 쓰인 기록을 발견한다.', x: 71, y: 25,
      gold: 70, heal: 18, next: ['correction-gates'],
      annotation: { id: 'draft-zero', title: '여백 주석 04', speaker: '초고 0호', text: '나는 처음 죽은 일을 기억한다. 네가 다시 만들 때마다 그 기억도 다시 생겼다.' },
    },
    {
      id: 'correction-gates', kind: 'battle', icon: '♜', name: '세 개의 교정문',
      text: '중간보스 둘과 졸개가 세 길을 동시에 막는 최종 전초전.', x: 82, y: 52,
      waves: 4, threat: 16, region: 'ashen-margin', protectsRefugees: true, next: ['manuscript-core'],
    },
    {
      id: 'manuscript-core', kind: 'boss', icon: '◆', name: '원고핵 성채',
      text: '초고 0호와 살아남은 교정관 편성을 넘어 두 번째 책갈피를 되찾는다.', x: 94, y: 52,
      waves: 5, threat: 19, region: 'manuscript-core', protectsRefugees: true, next: [],
      annotation: { id: 'last-margin', title: '마지막 여백', speaker: '아린', text: '우리를 움직일 수 있다는 것과, 우리 대신 선택해도 된다는 건 다른 말이야.' },
    },
  ],
};

/* Chapters are ordered campaign data. Keep the legacy single-chapter export
 * during the migration, but new engine/UI code resolves by the saved id. */
export const JOURNEY_CHAPTERS = Object.freeze([DAWN_ROAD_CHAPTER, BEYOND_PAGE_CHAPTER]);
export const JOURNEY_CHAPTER = JOURNEY_CHAPTERS[0];

export const JOURNEY_ENDINGS = Object.freeze({
  seal: {
    key: 'seal', icon: '🔖', name: '봉합',
    desc: '두 책갈피로 책을 닫아 현실을 지키되, 책 세계와 몬스터의 기록도 끝낸다.',
  },
  coauthor: {
    key: 'coauthor', icon: '✎', name: '공동 집필',
    desc: '편집 권한을 규칙으로 제한하고 영웅과 몬스터가 함께 다음 장을 쓴다.',
  },
});

export const JOURNEY_KIND = {
  start: { label: '출발', color: '#aab9ff' },
  battle: { label: '전투', color: '#ff7d93' },
  treasure: { label: '보물', color: '#ffd26e' },
  town: { label: '마을', color: '#7edff0' },
  recruit: { label: '동료', color: '#c49aff' },
  camp: { label: '야영', color: '#7fe0a2' },
  choice: { label: '분기', color: '#e2b675' },
  clue: { label: '단서', color: '#b7a6ff' },
  boss: { label: '보스', color: '#ff956b' },
};
