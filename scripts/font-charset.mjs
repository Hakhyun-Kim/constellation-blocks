/* =====================================================
 * 글꼴 서브셋의 순수 계약
 *
 * 생성기(subset-fonts.mjs)와 검사기(font-check.mjs)가 같은 계산을 쓴다. 한쪽만
 * 바뀌면 "빌드는 통과했는데 화면에 두부(□)가 뜨는" 상태가 되므로, 필요한 글자
 * 집합과 WOFF2 커버리지 판독을 한 파일에 둔다.
 *
 * 게임의 모든 화면 문자열은 소스에 리터럴로 있다. 런타임에서 만들어지는 문장도
 * 조각은 전부 리터럴이므로, 소스를 훑어 얻은 문자 집합이 곧 필요한 글자다.
 * ===================================================== */
import { brotliDecompressSync } from 'node:zlib';
import { readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, extname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/* 화면 문자열이 들어갈 수 있는 곳만 훑는다. docs/는 읽을거리라 글꼴과 무관하다. */
const SOURCE_DIRS = ['src', 'css', 'desktop'];
const SOURCE_FILES = ['index.html'];
const SOURCE_EXT = new Set(['.js', '.mjs', '.cjs', '.css', '.html']);

/* 원본 TTF는 저장소에 두지 않는다 — 둘이 4.96MB인데 배포에는 서브셋만 쓰인다.
 * 다시 만들 때는 upstream에서 받아 source 경로에 두고 npm run fonts:subset. */
export const FONTS = Object.freeze([
  Object.freeze({
    id: 'google-fonts-jua-regular',
    family: 'Jua',
    source: 'assets/fonts/Jua-Regular.ttf',
    output: 'assets/fonts/Jua-Regular.subset.woff2',
    upstream: 'https://github.com/google/fonts/raw/main/ofl/jua/Jua-Regular.ttf',
  }),
  Object.freeze({
    id: 'google-fonts-gaegu-bold',
    family: 'Gaegu',
    source: 'assets/fonts/Gaegu-Bold.ttf',
    output: 'assets/fonts/Gaegu-Bold.subset.woff2',
    upstream: 'https://github.com/google/fonts/raw/main/ofl/gaegu/Gaegu-Bold.ttf',
  }),
]);

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) walk(path, out);
    else if (SOURCE_EXT.has(extname(path))) out.push(path);
  }
  return out;
}

export function sourceFiles(root = ROOT) {
  return [
    ...SOURCE_DIRS.flatMap((dir) => walk(join(root, dir))),
    ...SOURCE_FILES.map((file) => join(root, file)),
  ];
}

/* 백틱은 JS 템플릿 리터럴 문법으로만 소스에 나타나고 화면에는 안 나온다.
 * Jua와 Gaegu 원본에도 U+0060 글리프가 없으므로 요구 목록에서 뺀다. */
const NEVER_RENDERED = new Set([0x60]);

/* ASCII 인쇄 문자는 언제나 넣는다. 숫자·연산기호는 런타임에 조립되고,
 * 소스에 우연히 안 쓰인 글자 하나 때문에 수식이 깨지면 안 된다. */
export function requiredCodepoints(root = ROOT) {
  const codepoints = new Set();
  for (let code = 0x20; code <= 0x7e; code++) codepoints.add(code);
  codepoints.add(0x00a0);   // NBSP — 줄바꿈 방지에 쓰인다
  for (const file of sourceFiles(root)) {
    for (const char of readFileSync(file, 'utf8')) codepoints.add(char.codePointAt(0));
  }
  for (const code of NEVER_RENDERED) codepoints.delete(code);
  return codepoints;
}

/* ---------- WOFF2 판독 ----------
 * 검사기가 "정말 그 글자가 들어 있나"를 실제 파일에서 확인한다. 생성 스크립트를
 * 다시 돌려 해시를 비교하는 방식은 도구 버전이 바뀌면 헛되이 깨지므로 쓰지 않는다. */

const KNOWN_TAGS = [
  'cmap', 'head', 'hhea', 'hmtx', 'maxp', 'name', 'OS/2', 'post', 'cvt ', 'fpgm',
  'glyf', 'loca', 'prep', 'CFF ', 'VORG', 'EBDT', 'EBLC', 'gasp', 'hdmx', 'kern',
  'LTSH', 'PCLT', 'VDMX', 'vhea', 'vmtx', 'BASE', 'GDEF', 'GPOS', 'GSUB', 'EBSC',
  'JSTF', 'MATH', 'CBDT', 'CBLC', 'COLR', 'CPAL', 'SVG ', 'sbix', 'acnt', 'avar',
  'bdat', 'bloc', 'bsln', 'cvar', 'fdsc', 'feat', 'fmtx', 'fvar', 'gvar', 'hsty',
  'just', 'lcar', 'mort', 'morx', 'opbd', 'prop', 'trak', 'Zapf', 'Silf', 'Glat',
  'Gloc', 'Feat', 'Sill',
];

function readUIntBase128(buffer, start) {
  let value = 0;
  let position = start;
  for (let index = 0; index < 5; index++) {
    const byte = buffer[position++];
    value = ((value << 7) | (byte & 0x7f)) >>> 0;
    if (!(byte & 0x80)) return [value, position];
  }
  throw new Error('WOFF2 UIntBase128이 5바이트를 넘었습니다.');
}

/* WOFF2는 glyf/loca만 변환한다. cmap은 그대로 들어 있으므로 brotli만 풀면 읽힌다. */
function woff2Table(buffer, wanted) {
  if (buffer.readUInt32BE(0) !== 0x774f4632) throw new Error('WOFF2 시그니처가 아닙니다.');
  const numTables = buffer.readUInt16BE(12);
  const compressedLength = buffer.readUInt32BE(20);
  let position = 48;
  let offset = 0;
  let target = null;
  for (let index = 0; index < numTables; index++) {
    const flags = buffer[position++];
    const known = flags & 0x3f;
    let tag;
    if (known === 0x3f) { tag = buffer.toString('latin1', position, position + 4); position += 4; }
    else tag = KNOWN_TAGS[known];
    let originalLength;
    [originalLength, position] = readUIntBase128(buffer, position);
    const transform = (flags >> 6) & 0x03;
    const transformed = (tag === 'glyf' || tag === 'loca') ? transform !== 3 : transform !== 0;
    let length = originalLength;
    if (transformed) [length, position] = readUIntBase128(buffer, position);
    if (tag === wanted) target = { offset, length };
    offset += length;
  }
  if (!target) throw new Error(`WOFF2에 ${wanted} 테이블이 없습니다.`);
  const data = brotliDecompressSync(buffer.subarray(position, position + compressedLength));
  return data.subarray(target.offset, target.offset + target.length);
}

function codepointsFromCmap(cmap) {
  const codepoints = new Set();
  const tables = cmap.readUInt16BE(2);
  for (let index = 0; index < tables; index++) {
    const subtable = cmap.readUInt32BE(4 + index * 8 + 4);
    const format = cmap.readUInt16BE(subtable);
    if (format === 4) {
      const segX2 = cmap.readUInt16BE(subtable + 6);
      const endBase = subtable + 14;
      const startBase = endBase + segX2 + 2;
      for (let segment = 0; segment < segX2 / 2; segment++) {
        const end = cmap.readUInt16BE(endBase + segment * 2);
        const start = cmap.readUInt16BE(startBase + segment * 2);
        if (start === 0xffff) continue;
        for (let code = start; code <= end && code !== 0x10000; code++) codepoints.add(code);
      }
    } else if (format === 12) {
      const groups = cmap.readUInt32BE(subtable + 12);
      for (let group = 0; group < groups; group++) {
        const base = subtable + 16 + group * 12;
        const end = cmap.readUInt32BE(base + 4);
        for (let code = cmap.readUInt32BE(base); code <= end; code++) codepoints.add(code);
      }
    }
  }
  return codepoints;
}

export function woff2Codepoints(file) {
  return codepointsFromCmap(woff2Table(readFileSync(file), 'cmap'));
}
