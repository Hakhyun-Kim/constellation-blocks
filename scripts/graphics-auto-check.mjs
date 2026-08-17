/* =====================================================
 * 그래픽 자동 품질 판정 검사 — `npm run gfx:check`
 *
 * 이 판정이 틀리면 저사양 기기가 high로 굳은 채 남는다. 화면 없이 확인할 수
 * 있도록 규칙은 순수 함수로 두었으므로, 여기서 프레임 간격을 직접 먹인다.
 * ===================================================== */
import assert from 'node:assert/strict';
import { GRAPHICS_AUTO_DEFAULTS, createGraphicsAutoTuner } from '../src/app/graphics-auto.js';

const test = (name, run) => { run(); console.log(`✅ gfx auto: ${name}`); };

/* fps로 주어진 만큼 프레임을 먹이고 첫 결정을 돌려준다. */
function feed(tuner, fps, seconds, flags = {}) {
  const dt = 1 / fps;
  let verdict = null;
  for (let elapsed = 0; elapsed < seconds; elapsed += dt) {
    const result = tuner.sample({ dt, ready: true, eligible: true, ...flags });
    if (result && !verdict) verdict = result;
  }
  return verdict;
}

const settle = GRAPHICS_AUTO_DEFAULTS.settleSeconds;

test('에셋이 도착하기 전에는 아무리 오래 돌아도 판정하지 않는다', () => {
  const tuner = createGraphicsAutoTuner();
  const verdict = feed(tuner, 120, 60, { ready: false });
  assert.equal(verdict, null);
  assert.equal(tuner.snapshot().decided, false);
  /* 빈 장면에서 120fps가 나와도 표본이 아니다 — 예전 버그가 여기서 났다. */
  assert.equal(tuner.snapshot().windowFrames, 0);
});

test('모달·마을·일시정지 중에는 표본으로 세지 않는다', () => {
  const tuner = createGraphicsAutoTuner();
  assert.equal(feed(tuner, 120, 60, { eligible: false }), null);
  assert.equal(tuner.snapshot().windowFrames, 0);
});

test('잴 수 없는 구간이 끼어도 창을 버리지 않는다', () => {
  const tuner = createGraphicsAutoTuner();
  feed(tuner, 20, settle + 1.5);                       // 관측 절반
  feed(tuner, 20, 30, { eligible: false });            // 모달이 열렸다 닫힘
  const verdict = feed(tuner, 20, 2);                  // 이어서 관측
  assert.ok(verdict, '모아 둔 관측이 살아 있어야 판정이 난다');
  assert.equal(verdict.quality, 'lite');
});

test('탭 전환처럼 비정상적으로 긴 프레임은 표본에서 뺀다', () => {
  const tuner = createGraphicsAutoTuner();
  for (let i = 0; i < 50; i++) tuner.sample({ dt: 5, ready: true, eligible: true });
  assert.equal(tuner.snapshot().windowFrames, 0);
  assert.equal(tuner.snapshot().decided, false);
});

test('빠른 기기는 high를 유지하고 배경도 켜 둔다', () => {
  const tuner = createGraphicsAutoTuner();
  const verdict = feed(tuner, 60, settle + 4);
  assert.equal(verdict.stage, 'initial');
  assert.equal(verdict.quality, 'high');
  assert.equal(verdict.decor, true);
  assert.equal(verdict.changed, false);
});

test('느린 기기는 lite로 내리고, 아주 느리면 배경까지 접는다', () => {
  const slow = createGraphicsAutoTuner();
  const mid = feed(slow, 30, settle + 4);
  assert.equal(mid.quality, 'lite');
  assert.equal(mid.decor, true, '30fps는 lite까지만 내린다');

  const crawling = createGraphicsAutoTuner();
  const low = feed(crawling, 18, settle + 4);
  assert.equal(low.quality, 'lite');
  assert.equal(low.decor, false);
  assert.equal(crawling.snapshot().done, true, '더 낮출 게 없으면 관측을 멈춘다');
});

test('판정 뒤에 무너지면 한 번 더 낮춘다 — 예전에는 영영 high로 굳었다', () => {
  const tuner = createGraphicsAutoTuner();
  assert.equal(feed(tuner, 60, settle + 4).quality, 'high');
  const later = feed(tuner, 20, GRAPHICS_AUTO_DEFAULTS.recheckSeconds + 2);
  assert.equal(later.stage, 'recheck');
  assert.equal(later.quality, 'lite');
});

test('좋아졌다고 되올리지는 않는다 — 화면이 널뛰면 안 된다', () => {
  const tuner = createGraphicsAutoTuner();
  assert.equal(feed(tuner, 30, settle + 4).quality, 'lite');
  const later = feed(tuner, 144, GRAPHICS_AUTO_DEFAULTS.recheckSeconds * 3);
  assert.equal(later, null);
  assert.equal(tuner.snapshot().quality, 'lite');
});

test('관측이 성글면(프레임 수 부족) 판정을 미뤘다가 표본이 차면 낸다', () => {
  const tuner = createGraphicsAutoTuner();
  /* 4fps로 3.5초 — 창(3초)은 넘었지만 표본은 14프레임뿐이라 아직 못 정한다 */
  assert.equal(feed(tuner, 4, settle + 3.5), null);
  assert.equal(tuner.snapshot().decided, false);
  assert.ok(tuner.snapshot().windowSeconds >= GRAPHICS_AUTO_DEFAULTS.windowSeconds);

  /* 계속 보다가 40프레임을 채우면 그제야 판정한다 */
  const verdict = feed(tuner, 4, 8);
  assert.equal(verdict.quality, 'lite');
  assert.equal(verdict.decor, false);
});

test('이미 lite로 시작하면 high로 올라가지 않는다', () => {
  const tuner = createGraphicsAutoTuner({ quality: 'lite' });
  const verdict = feed(tuner, 144, settle + 4);
  assert.equal(verdict.quality, 'lite');
});

console.log('그래픽 자동 품질 판정 검사 통과');
