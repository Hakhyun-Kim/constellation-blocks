import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeAssetManifest } from '../src/assets/catalog.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ASSET_ROOT = join(ROOT, 'assets');
const MANIFEST_PATH = join(ASSET_ROOT, 'manifest.json');
const MIB = 1024 * 1024;

/* 초기 예산은 실측 2.89MiB에 성장 여지를 더한 값이다. 예전 한도(12MiB)는
 * 글꼴 원본 4.96MB와 선로딩 영웅 GLB 4MB를 다 통과시켜, 첫 화면이 10초 걸리는
 * 상태가 게이트를 지나갔다. 한도는 "터지지 않을 만큼"이 아니라 "아이가 기다릴
 * 수 있을 만큼"으로 잡는다. */
const LIMITS = {
  initial: 4 * MIB,
  total: 60 * MIB,
  single: 8 * MIB,
};

const coreFiles = ['index.html', 'css/style.css', 'dist/game.js'];
const failures = [];
const slash = (value) => value.split(sep).join('/');
const sizeLabel = (bytes) => `${(bytes / MIB).toFixed(2)} MiB`;

function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const absolute = join(dir, entry.name);
    return entry.isDirectory() ? walk(absolute) : [absolute];
  });
}

function sha256(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex');
}

function validHttpUrl(value) {
  if (typeof value !== 'string') return false;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

for (const file of coreFiles) {
  if (!existsSync(join(ROOT, file))) failures.push(`필수 초기 파일 누락: ${file}`);
}

const runtimeAssetFiles = walk(ASSET_ROOT)
  .filter((file) => resolve(file) !== resolve(MANIFEST_PATH));

let entries = [];
if (runtimeAssetFiles.length || existsSync(MANIFEST_PATH)) {
  if (!existsSync(MANIFEST_PATH)) {
    failures.push('assets/에 파일이 있지만 assets/manifest.json이 없습니다.');
  } else {
    try {
      const manifest = normalizeAssetManifest(JSON.parse(readFileSync(MANIFEST_PATH, 'utf8')));
      entries = manifest.assets;
    } catch (error) {
      failures.push(`assets/manifest.json을 읽을 수 없습니다: ${error.message}`);
    }
  }
}

const seen = new Set();
for (const entry of entries) {
  const assetPath = typeof entry?.path === 'string' ? slash(entry.path) : '';
  if (!assetPath.startsWith('assets/') || assetPath.includes('../')) {
    failures.push(`잘못된 에셋 경로: ${assetPath || '(없음)'}`);
    continue;
  }
  if (seen.has(assetPath)) failures.push(`manifest 중복 경로: ${assetPath}`);
  seen.add(assetPath);

  const absolute = resolve(ROOT, assetPath);
  if (!absolute.startsWith(resolve(ASSET_ROOT) + sep) || !existsSync(absolute)) {
    failures.push(`manifest 파일 누락: ${assetPath}`);
    continue;
  }
  if (typeof entry.creator !== 'string' || !entry.creator.trim()) failures.push(`${assetPath}: creator 필요`);
  if (!validHttpUrl(entry.sourceUrl)) failures.push(`${assetPath}: 원본 sourceUrl 필요`);
  if (typeof entry.license !== 'string' || !entry.license.trim()) failures.push(`${assetPath}: license 필요`);
  if (!validHttpUrl(entry.licenseUrl)) failures.push(`${assetPath}: licenseUrl 필요`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.acquiredAt || '')) failures.push(`${assetPath}: acquiredAt은 YYYY-MM-DD`);
  if (typeof entry.preload !== 'boolean') failures.push(`${assetPath}: preload boolean 필요`);
  if (!/^[a-f0-9]{64}$/.test(entry.sha256 || '')) failures.push(`${assetPath}: sha256 필요`);
  else if (sha256(absolute) !== entry.sha256) failures.push(`${assetPath}: sha256 불일치`);

  const bytes = statSync(absolute).size;
  if (bytes > LIMITS.single) failures.push(`${assetPath}: 단일 파일 ${sizeLabel(bytes)} > ${sizeLabel(LIMITS.single)}`);
}

for (const absolute of runtimeAssetFiles) {
  const assetPath = slash(relative(ROOT, absolute));
  if (!seen.has(assetPath)) failures.push(`manifest 미등록 파일: ${assetPath}`);
}

const existingCore = coreFiles.map((file) => join(ROOT, file)).filter((file) => existsSync(file));
const initialAssets = entries
  .filter((entry) => entry?.preload === true && typeof entry.path === 'string')
  .map((entry) => resolve(ROOT, entry.path))
  .filter((file) => existsSync(file));
const sum = (files) => files.reduce((total, file) => total + statSync(file).size, 0);
const initialBytes = sum([...existingCore, ...initialAssets]);
const totalBytes = sum([...existingCore, ...runtimeAssetFiles]);

if (initialBytes > LIMITS.initial) failures.push(`초기 다운로드 ${sizeLabel(initialBytes)} > ${sizeLabel(LIMITS.initial)}`);
if (totalBytes > LIMITS.total) failures.push(`전체 런타임 ${sizeLabel(totalBytes)} > ${sizeLabel(LIMITS.total)}`);

console.log(`초기 실행 예산: ${sizeLabel(initialBytes)} / ${sizeLabel(LIMITS.initial)}`);
console.log(`전체 런타임 예산: ${sizeLabel(totalBytes)} / ${sizeLabel(LIMITS.total)}`);
console.log(`등록 외부 에셋: ${entries.length}개 · 선로딩 ${initialAssets.length}개`);

if (failures.length) {
  for (const failure of failures) console.error(`❌ ${failure}`);
  process.exitCode = 1;
} else {
  console.log('✅ 외부 에셋 출처·무결성·다운로드 예산 통과');
}
