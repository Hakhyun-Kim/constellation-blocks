import assert from 'node:assert/strict';
import {
  assetSupportsProfile,
  normalizeAssetManifest,
  preloadAssets,
} from '../src/assets/catalog.js';
import { RuntimeAssetLoader } from '../src/gfx/asset-loader.js';

const test = async (name, run) => {
  await run();
  console.log(`✅ asset runtime: ${name}`);
};

const entry = (id, overrides = {}) => ({
  id,
  type: 'model',
  path: `assets/models/${id}.glb`,
  creator: 'Test Creator',
  sourceUrl: 'https://example.com/original',
  license: 'CC0-1.0',
  licenseUrl: 'https://creativecommons.org/publicdomain/zero/1.0/',
  acquiredAt: '2026-08-13',
  sha256: 'a'.repeat(64),
  preload: false,
  ...overrides,
});

const manifestOf = (...assets) => ({ version: 1, assets });
const jsonResponse = (value) => ({ ok: true, status: 200, async json() { return value; } });
const bytesResponse = (values = [1, 2, 3]) => ({
  ok: true,
  status: 200,
  async arrayBuffer() { return Uint8Array.from(values).buffer; },
});

await test('manifest가 id·경로·품질 프로필을 결정적으로 검증한다', () => {
  const manifest = normalizeAssetManifest(manifestOf(
    entry('arin-pilot', { preload: true, profiles: ['high', 'lite'] }),
  ));
  assert.equal(manifest.byId.get('arin-pilot').type, 'model');
  assert.equal(assetSupportsProfile(manifest.assets[0], 'lite'), true);
  assert.equal(assetSupportsProfile(manifest.assets[0], 'min'), false);
  assert.deepEqual(preloadAssets(manifest, 'high').map((asset) => asset.id), ['arin-pilot']);
  assert.throws(() => normalizeAssetManifest(manifestOf(entry('arin-pilot'), entry('arin-pilot'))), /중복/);
  assert.throws(() => normalizeAssetManifest(manifestOf(entry('unsafe', { path: 'assets/../secret.glb' }))), /안전하지 않은/);
  assert.throws(() => normalizeAssetManifest(manifestOf(entry('wrong-type', { type: 'script' }))), /type/);
});

await test('기본 procedural 모드는 네트워크 요청을 만들지 않는다', async () => {
  let calls = 0;
  const loader = new RuntimeAssetLoader({
    enabled: false,
    fetchFn: async () => { calls += 1; return jsonResponse(manifestOf()); },
  });
  assert.equal(await loader.init(), null);
  assert.equal(await loader.load('anything'), null);
  assert.equal(calls, 0);
  assert.equal(loader.snapshot().state, 'disabled');
});

await test('manifest와 동시 에셋 요청을 한 번씩만 가져온다', async () => {
  const calls = [];
  const loader = new RuntimeAssetLoader({
    enabled: true,
    decoders: { model: ({ entry: asset, bytes }) => `${asset.id}:${bytes.byteLength}` },
    fetchFn: async (url) => {
      calls.push(url);
      return url.endsWith('manifest.json')
        ? jsonResponse(manifestOf(entry('arin-pilot')))
        : bytesResponse([1, 2, 3, 4]);
    },
  });
  const [first, second] = await Promise.all([loader.load('arin-pilot'), loader.load('arin-pilot')]);
  assert.equal(first, 'arin-pilot:4');
  assert.equal(second, first);
  assert.deepEqual(calls, ['assets/manifest.json', 'assets/models/arin-pilot.glb']);
  assert.equal(loader.snapshot().cached, 1);
});

await test('현재 품질에 없는 에셋은 다운로드하지 않는다', async () => {
  const calls = [];
  const loader = new RuntimeAssetLoader({
    enabled: true,
    quality: 'lite',
    fetchFn: async (url) => {
      calls.push(url);
      return jsonResponse(manifestOf(entry('desktop-landmark', { profiles: ['high'] })));
    },
  });
  assert.equal(await loader.load('desktop-landmark'), null);
  assert.deepEqual(calls, ['assets/manifest.json']);
});

await test('개별 파일 실패는 예외 대신 절차형 폴백 null을 반환한다', async () => {
  const warnings = [];
  const loader = new RuntimeAssetLoader({
    enabled: true,
    logger: { warn: (...args) => warnings.push(args) },
    fetchFn: async (url) => url.endsWith('manifest.json')
      ? jsonResponse(manifestOf(entry('missing-model')))
      : { ok: false, status: 404 },
  });
  assert.equal(await loader.load('missing-model'), null);
  assert.deepEqual(loader.snapshot().failed, ['missing-model']);
  assert.equal(loader.snapshot().state, 'ready');
  assert.equal(warnings.length, 1);
});

await test('manifest 실패 뒤 명시적인 재시도가 가능하다', async () => {
  let calls = 0;
  const loader = new RuntimeAssetLoader({
    enabled: true,
    logger: { warn() {} },
    fetchFn: async () => {
      calls += 1;
      return calls === 1 ? { ok: false, status: 503 } : jsonResponse(manifestOf());
    },
  });
  assert.equal(await loader.init(), null);
  assert.equal(loader.snapshot().state, 'failed');
  assert.ok(await loader.retry());
  assert.equal(loader.snapshot().state, 'ready');
  assert.equal(calls, 2);
});

await test('dispose 뒤 끝난 비동기 결과는 현재 장면에 반영하지 않는다', async () => {
  let finishBytes;
  const waitingBytes = new Promise((resolve) => { finishBytes = resolve; });
  const loader = new RuntimeAssetLoader({
    enabled: true,
    fetchFn: async (url) => url.endsWith('manifest.json')
      ? jsonResponse(manifestOf(entry('late-model')))
      : { ok: true, status: 200, arrayBuffer: () => waitingBytes },
  });
  await loader.init();
  const pending = loader.load('late-model');
  await Promise.resolve();
  loader.dispose();
  finishBytes(Uint8Array.from([9]).buffer);
  assert.equal(await pending, null);
  assert.equal(loader.snapshot().state, 'disposed');
});

console.log('Runtime asset loader checks passed.');
