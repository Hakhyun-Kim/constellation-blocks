/* =====================================================
 * 전술 전장 피드백
 *
 * 3매치의 원인(매치)과 3D 전장의 결과(피해·감속·후퇴)를 짧은 HUD 문장으로
 * 연결한다. 규칙을 만들지 않고 castTactic()이 이미 돌려준 이벤트만 읽는다.
 * ===================================================== */
const SPELL = {
  flare: { icon: '☄️', name: '유성 폭격' },
  tide: { icon: '❄️', name: '서리 결계' },
  bloom: { icon: '🛡️', name: '수호 성좌' },
};
const LANE = ['왼쪽', '가운데', '오른쪽'];

export function createTacticFeedback() {
  const root = document.getElementById('tacticImpact');
  const icon = document.getElementById('tacticImpactIcon');
  const title = document.getElementById('tacticImpactTitle');
  const detail = document.getElementById('tacticImpactDetail');
  let timer = null;
  let generation = 0;

  if (!root || !icon || !title || !detail) {
    return { announceMatch() {}, showCast() {}, showPreview() {}, reset() {} };
  }

  function present(kind, headline, subline, preview = false) {
    const spell = SPELL[kind] || SPELL.flare;
    const token = ++generation;
    if (timer) clearTimeout(timer);
    root.dataset.kind = kind;
    icon.textContent = spell.icon;
    title.textContent = headline;
    detail.textContent = subline;
    root.classList.remove('show', 'preview');
    void root.offsetWidth; // 같은 주문 연쇄도 매번 처음부터 튀게 한다.
    root.classList.add('show');
    if (preview) root.classList.add('preview');
    timer = setTimeout(() => {
      if (token === generation) root.classList.remove('show', 'preview');
    }, preview ? 1000 : 1700);
  }

  function announceMatch(kind, lane, size) {
    const spell = SPELL[kind] || SPELL.flare;
    const bonus = size >= 5 ? '전장 강타 준비!' : size === 4 ? '강화 준비!' : '길을 조준해요';
    present(kind, `${size}매치 · ${spell.name}`, `${LANE[lane] || LANE[1]} 길 ${bonus}`, true);
  }

  function showCast(result, kind, lane, size) {
    const events = result?.events || [];
    const laneName = LANE[lane] || LANE[1];
    if (kind === 'flare') {
      const hits = events.filter(event => event.type === 'enemyHit' && event.tactic === 'flare');
      const total = hits.reduce((sum, event) => sum + (event.dmg || 0), 0);
      present(kind, `${SPELL.flare.name}!`, `${laneName} 길 · ${hits.length}명 · ${total} 피해`);
    } else if (kind === 'tide') {
      const slowed = events.filter(event => event.type === 'enemyHit' && event.kind === 'slow').length;
      present(kind, `${SPELL.tide.name}!`, `${laneName} 길 · ${slowed}명 감속`);
    } else {
      const healed = events.find(event => event.type === 'castleHeal')?.amount || 0;
      const pushed = events.filter(event => event.type === 'tacticPush').length;
      present(kind, `${SPELL.bloom.name}!`, `성 +${healed} · ${pushed}명 후퇴`);
    }
  }

  function showPreview(kind, lane, size) {
    const spell = SPELL[kind] || SPELL.flare;
    present(kind, `테스트 · ${spell.name}`, `${LANE[lane] || LANE[1]} 길 · ${size}매치 연출`, true);
  }

  function reset() {
    generation++;
    if (timer) clearTimeout(timer);
    timer = null;
    root.classList.remove('show', 'preview');
  }

  return { announceMatch, showCast, showPreview, reset };
}
