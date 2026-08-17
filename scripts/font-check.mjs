/* =====================================================
 * 글꼴 서브셋 검사 — `npm run fonts:check`
 *
 * 서브셋은 용량을 줄이는 대신 "안 넣은 글자는 안 나온다"는 위험을 만든다.
 * 새 한국어 문장을 넣고 서브셋을 다시 만들지 않으면 그 글자만 시스템 글꼴로
 * 튀거나 두부(□)가 된다 — 눈으로는 늦게 발견되므로 게이트로 막는다.
 *
 * 실제 배포되는 WOFF2의 cmap을 직접 읽는다. 생성 스크립트를 다시 돌려 해시를
 * 비교하면 도구 버전이 올라갈 때마다 헛되이 깨진다.
 * ===================================================== */
import { existsSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { FONTS, ROOT, requiredCodepoints, woff2Codepoints } from './font-charset.mjs';

const failures = [];

/* 글꼴이 책임지는 범위만 요구한다. 이모지(🎲·💰)는 원본에도 없고 시스템
 * 이모지 글꼴이 그리므로 서브셋에 없는 게 정상이다. */
const isCoverable = (code) =>
  (code >= 0x20 && code <= 0x7e)          // ASCII 인쇄 문자
  || (code >= 0xac00 && code <= 0xd7a3)   // 한글 음절
  || (code >= 0x3130 && code <= 0x318f);  // 한글 호환 자모

const required = [...requiredCodepoints()].filter(isCoverable);
const label = (code) => `U+${code.toString(16).toUpperCase().padStart(4, '0')} ${String.fromCodePoint(code)}`;

for (const font of FONTS) {
  const outputPath = join(ROOT, font.output);
  if (!existsSync(outputPath)) {
    failures.push(`${font.output}: 서브셋 파일이 없습니다 — npm run fonts:subset`);
    continue;
  }
  let covered;
  try {
    covered = woff2Codepoints(outputPath);
  } catch (error) {
    failures.push(`${font.output}: WOFF2를 읽지 못했습니다 — ${error.message}`);
    continue;
  }
  const missing = required.filter((code) => !covered.has(code));
  if (missing.length) {
    failures.push(`${font.family}: 화면에 쓰는 글자 ${missing.length}자가 서브셋에 없습니다`
      + ` (${missing.slice(0, 12).map(label).join(', ')}${missing.length > 12 ? ' …' : ''})`
      + ' — npm run fonts:subset');
  }
  const bytes = statSync(outputPath).size;
  console.log(`${font.family}: ${(bytes / 1024).toFixed(0)}KB · 코드포인트 ${covered.size}자`);
}

/* CSS가 아직 원본 TTF를 가리키면 서브셋을 만들어도 4.96MB를 그대로 받는다. */
const css = readFileSync(join(ROOT, 'css/style.css'), 'utf8');
for (const font of FONTS) {
  if (!css.includes(font.output.replace('assets/', '../assets/'))) {
    failures.push(`css/style.css: ${font.family} @font-face가 ${font.output}을 가리키지 않습니다.`);
  }
}
if (/@font-face[^}]*\.ttf/.test(css)) {
  failures.push('css/style.css: @font-face가 아직 .ttf를 참조합니다 — 서브셋 WOFF2만 배포합니다.');
}

console.log(`화면에 쓰는 글자 ${required.length}자 (한글 음절 ${required.filter((c) => c >= 0xac00).length}자)`);

if (failures.length) {
  for (const failure of failures) console.error(`❌ ${failure}`);
  process.exitCode = 1;
} else {
  console.log('✅ 글꼴 서브셋이 화면 문자열을 모두 덮습니다');
}
