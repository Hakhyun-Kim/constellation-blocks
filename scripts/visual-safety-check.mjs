/* =====================================================
 * 시각 안전 회귀 검사
 *
 * 전장 전체 점멸·후처리 밝기 펄스·카메라 흔들림은 설정과 무관하게 금지한다.
 * 효과는 착탄 지점, 작은 배너, 카드처럼 국소 영역에만 그린다.
 * ===================================================== */
import fs from 'node:fs';

const css = fs.readFileSync(new URL('../css/style.css', import.meta.url), 'utf8');
const renderer = fs.readFileSync(new URL('../src/gfx/renderer.js', import.meta.url), 'utf8');
const fx = fs.readFileSync(new URL('../src/gfx/fx.js', import.meta.url), 'utf8');

const failures = [];
const reject = (name, condition) => { if (condition) failures.push(name); };

for (const match of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
  const selectors = match[1].split(',').map((selector) => selector.trim());
  const declarations = match[2];
  const fullSurface = selectors.some((selector) =>
    /^(?:body(?:[.:\[].*)?|\.stage(?:[.:\[].*)?|#scene3d(?:[.:\[].*)?|#scene3d\s+canvas(?:[.:\[].*)?)$/.test(selector));
  if (fullSurface && /\b(?:animation|filter)\s*:/.test(declarations)) {
    failures.push(`전체 화면 선택자에 animation/filter 사용: ${selectors.join(', ')}`);
  }
}

reject('후처리 컴포저를 다시 사용함', /EffectComposer|UnrealBloomPass|RenderPass|OutputPass|_setupComposer|this\.composer/.test(renderer));
reject('전체 화면 블룸 펄스를 다시 사용함', /bloomPulse|\.bloom\b/.test(renderer + fx));
reject('카메라 흔들림 상태를 다시 사용함', /this\.shake|\bs2\s*=\s*this\.shake/.test(renderer + fx));
reject('카메라 위치에 난수 흔들림을 다시 사용함', /camera\.position\.set\([\s\S]{0,300}Math\.random/.test(renderer));

if (failures.length) {
  failures.forEach((failure) => console.error(`❌ ${failure}`));
  process.exitCode = 1;
} else {
  console.log('✅ 전체 화면 점멸·밝기 펄스·카메라 흔들림 없음');
  console.log('✅ 전투 효과는 국소 파티클·배너로 제한됨');
}
