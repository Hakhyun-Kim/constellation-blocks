/* =====================================================
 * 글꼴 서브셋 생성기 — `npm run fonts:subset`
 *
 * Jua/Gaegu 원본은 KS X 1001 완성형 2,350자를 전부 담고 있어 둘이 합쳐 4.96MB다.
 * 게임이 실제로 그리는 한글은 936자뿐이라 나머지는 첫 화면을 늦추기만 한다.
 * 쓰는 글자만 남기고 WOFF2로 압축하면 382KB가 된다.
 *
 * 원본 TTF는 저장소에 두지 않는다(전체 예산에 그대로 잡힌다). 다시 만들려면
 * scripts/font-charset.mjs의 sourceUrl에서 원본을 받아 이 스크립트를 돌린다.
 *
 * 두 글꼴 모두 OFL이며 Reserved Font Name을 선언하지 않는다(name ID 0이
 * "Copyright ... Project Authors"로 끝난다). 따라서 서브셋 후에도 원래 이름을
 * 유지할 수 있다. 변경 사실은 CREDITS.md와 manifest의 modifications에 남긴다.
 * ===================================================== */
import subsetFont from 'subset-font';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { FONTS, ROOT, requiredCodepoints } from './font-charset.mjs';

const codepoints = requiredCodepoints();
const text = [...codepoints].map((code) => String.fromCodePoint(code)).join('');
const hangul = [...codepoints].filter((code) => code >= 0xac00 && code <= 0xd7a3).length;
console.log(`필요한 문자 ${codepoints.size}자 (한글 음절 ${hangul}자)`);

const missing = FONTS.filter((font) => !existsSync(join(ROOT, font.source)));
if (missing.length) {
  console.error('❌ 원본 글꼴이 없습니다. 배포에는 서브셋만 쓰이므로 원본은 저장소에 두지 않습니다.');
  console.error('   아래를 받아 그 경로에 두고 다시 실행하세요:\n');
  for (const font of missing) console.error(`   curl -Lo ${font.source} ${font.upstream}`);
  console.error('');
  process.exit(1);
}

for (const font of FONTS) {
  const sourcePath = join(ROOT, font.source);
  const outputPath = join(ROOT, font.output);
  const source = readFileSync(sourcePath);
  const subset = await subsetFont(source, text, { targetFormat: 'woff2' });
  writeFileSync(outputPath, subset);
  const sha256 = createHash('sha256').update(subset).digest('hex');
  const before = statSync(sourcePath).size;
  const after = subset.length;
  console.log(`${font.family}: ${(before / 1024).toFixed(0)}KB → ${(after / 1024).toFixed(0)}KB`
    + ` (${(after / before * 100).toFixed(1)}%) · ${font.output}`);
  console.log(`   sha256 ${sha256}`);
}

console.log('\nmanifest.json의 sha256을 위 값으로 맞추세요.');
