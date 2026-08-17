/* =====================================================
 * 그래픽 자동 품질 판정
 *
 * 예전 판정은 부팅 4초 뒤 3초를 재고 끝냈다. 그런데 에셋은 그보다 늦게 도착해서,
 * 실제로 잰 것은 모델이 하나도 없는 빈 장면이었다 — 느린 기기가 "빠르다"로
 * 확정된 뒤 진짜 장면을 받았다. 그래서 두 가지를 바꾼다.
 *
 *   1. 잴 수 있는 상태에서만 잰다. 에셋이 준비되고, 전장이 실제로 그려지는
 *      중이며(모달·마을·일시정지·숨은 탭이 아님), 창이 다 찰 때까지.
 *   2. 한 번 정하고 끝내지 않는다. 판정 뒤에도 계속 보다가 무너지면 낮춘다.
 *      올리지는 않는다 — 올렸다 내렸다 하면 화면이 널뛰고, 아이는 그걸
 *      "게임이 이상하다"로 읽는다.
 *
 * 여기에는 DOM도 렌더러도 없다. 프레임 간격과 "지금 잴 수 있나"만 받고 결정을
 * 돌려주므로 Node에서 그대로 검사할 수 있다.
 * ===================================================== */

export const GRAPHICS_AUTO_DEFAULTS = Object.freeze({
  settleSeconds: 1.5,      // 에셋 도착 직후의 업로드·컴파일 요동은 흘려보낸다
  windowSeconds: 3,        // 첫 판정에 쓰는 관측 창
  minFrames: 40,           // 창이 성글면(끊긴 관측) 판정하지 않는다
  recheckSeconds: 8,       // 판정 뒤 감시 창 — 웨이브 한 구간 정도
  liteBelowFps: 45,
  decorBelowFps: 26,
  maxFrameSeconds: 0.5,    // 탭 전환·긴 정지로 생긴 프레임은 표본이 아니다
});

/* quality는 high→lite로만, decor는 켜짐→꺼짐으로만 간다. 단조롭게 두면
 * "왜 아까보다 좋아졌다 나빠졌다 하지"가 생기지 않는다. */
export function createGraphicsAutoTuner(options = {}) {
  const config = { ...GRAPHICS_AUTO_DEFAULTS, ...options };
  let quality = options.quality === 'lite' ? 'lite' : 'high';
  let decor = options.decor !== false;

  let decided = false;
  let done = false;
  let settleLeft = config.settleSeconds;
  let frames = 0;
  let seconds = 0;

  const resetWindow = () => { frames = 0; seconds = 0; };

  return {
    /* 프레임마다 한 번. 결정이 났을 때만 객체를 돌려준다. */
    sample({ dt, ready, eligible }) {
      if (done) return null;
      /* 잴 수 없는 프레임은 창에서 빼기만 하고 창을 버리지는 않는다. 모달이
       * 잠깐 열렸다고 여태 모은 관측을 버리면 판정이 영영 안 난다. */
      if (!ready || !eligible) return null;
      if (!(dt > 0) || dt > config.maxFrameSeconds) return null;
      if (settleLeft > 0) { settleLeft -= dt; return null; }

      frames++;
      seconds += dt;
      const needSeconds = decided ? config.recheckSeconds : config.windowSeconds;
      if (seconds < needSeconds || frames < config.minFrames) return null;

      const fps = frames / seconds;
      resetWindow();

      const next = {
        quality: quality === 'high' && fps < config.liteBelowFps ? 'lite' : quality,
        decor: decor && fps >= config.decorBelowFps,
      };
      const changed = next.quality !== quality || next.decor !== decor;
      const stage = decided ? 'recheck' : 'initial';
      quality = next.quality;
      decor = next.decor;
      /* 더 낮출 것이 없으면 관측을 멈춘다. */
      if (quality === 'lite' && !decor) done = true;

      if (!decided) {
        decided = true;
        return Object.freeze({ stage, fps, quality, decor, changed });
      }
      return changed ? Object.freeze({ stage, fps, quality, decor, changed }) : null;
    },

    snapshot() {
      return Object.freeze({ quality, decor, decided, done, windowSeconds: seconds, windowFrames: frames });
    },
  };
}
