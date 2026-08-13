import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const root = new URL('../docs/evidence/art-v2/', import.meta.url);
const stills = [
  'verdant-desktop-high-procedural.jpg',
  'verdant-desktop-high-art-v2.jpg',
  'verdant-mobile-lite-procedural.jpg',
  'verdant-mobile-lite-art-v2.jpg',
];
const videos = [
  'verdant-desktop-high-procedural.webm',
  'verdant-desktop-high-art-v2.webm',
];
const html = readFileSync(new URL('index.html', root), 'utf8');

for (const name of stills) {
  const bytes = readFileSync(new URL(name, root));
  assert.deepEqual([...bytes.subarray(0, 3)], [0xff, 0xd8, 0xff], `${name}: JPEG 헤더`);
  assert.ok(bytes.length > 40_000, `${name}: 비어 있지 않은 화면 증거`);
  assert.ok(html.includes(name), `${name}: 비교 페이지 연결`);
}
for (const name of videos) {
  const bytes = readFileSync(new URL(name, root));
  assert.deepEqual([...bytes.subarray(0, 4)], [0x1a, 0x45, 0xdf, 0xa3], `${name}: WebM EBML 헤더`);
  assert.ok(bytes.includes(Buffer.from([0x1f, 0x43, 0xb6, 0x75])), `${name}: WebM cluster 필요`);
  assert.ok(bytes.length > 1_000_000, `${name}: 10초 장면 데이터 필요`);
  assert.ok(html.includes(name), `${name}: 비교 페이지 연결`);
}

console.log('✅ 데스크톱 전후 WebM·데스크톱/모바일 JPEG 증거 검사 통과');
