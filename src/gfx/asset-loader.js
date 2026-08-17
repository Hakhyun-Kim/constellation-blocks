/* =====================================================
 * 외부 런타임 에셋 로더 경계
 *
 * 규칙/엔진은 이 로더를 모른다. 기본 게임은 로더가 꺼져 있어 manifest 요청도
 * 만들지 않는다. art-v2 파일럿에서만 파일을 요청하며, 실패하면 null을 반환해
 * 호출부가 현재 절차형 모델을 그대로 유지할 수 있게 한다.
 * ===================================================== */
import { assetSupportsProfile, normalizeAssetManifest, preloadAssets } from '../assets/catalog.js';

const silentLogger = Object.freeze({ warn() {} });

export class RuntimeAssetLoader {
  constructor({
    enabled = false,
    quality = 'high',
    manifestUrl = 'assets/manifest.json',
    fetchFn = globalThis.fetch?.bind(globalThis),
    decoders = {},
    deferOnDemand = null,
    logger = globalThis.console || silentLogger,
  } = {}) {
    this.enabled = !!enabled;
    this.quality = quality;
    this.manifestUrl = manifestUrl;
    this.fetchFn = fetchFn;
    this.decoders = { ...decoders };
    /* 선로딩이 아닌 에셋은 이 약속이 풀린 뒤에 받는다. 영웅 GLB는 4MB인데
     * 첫 화면은 그것 없이도 절차형 모델로 완성되므로, 먼저 받겠다고 나서면
     * 정작 필요한 1MB가 뒤로 밀린다. 순서를 정하지 않으면 대역폭이 좁을수록
     * 손해가 커진다. */
    this.deferOnDemand = deferOnDemand;
    this.logger = logger || silentLogger;
    this.state = this.enabled ? 'idle' : 'disabled';
    this.manifest = null;
    this.error = null;
    this.failures = new Map();
    this.cache = new Map();
    this._initPromise = null;
    this._generation = 0;
    this._controller = new AbortController();
  }

  async init() {
    if (!this.enabled || this.state === 'disposed') return null;
    if (this.manifest) return this.manifest;
    if (this._initPromise) return this._initPromise;
    if (typeof this.fetchFn !== 'function') {
      this._failManifest(new Error('fetch를 사용할 수 없습니다.'));
      return null;
    }

    const generation = this._generation;
    this.state = 'manifest-loading';
    this._initPromise = (async () => {
      try {
        const response = await this.fetchFn(this.manifestUrl, {
          cache: 'no-cache',
          signal: this._controller.signal,
        });
        if (!response?.ok) throw new Error(`manifest HTTP ${response?.status ?? 'error'}`);
        const manifest = normalizeAssetManifest(await response.json());
        if (generation !== this._generation || this.state === 'disposed') return null;
        this.manifest = manifest;
        this.state = 'ready';
        return manifest;
      } catch (error) {
        if (generation === this._generation && this.state !== 'disposed') this._failManifest(error);
        return null;
      }
    })();
    return this._initPromise;
  }

  _failManifest(error) {
    this.error = error;
    this.state = 'failed';
    this.logger.warn?.('[art-v2] manifest를 읽지 못해 절차형 화면을 유지합니다.', error);
  }

  entry(id) {
    const entry = this.manifest?.byId.get(id) || null;
    return assetSupportsProfile(entry, this.quality) ? entry : null;
  }

  async load(id) {
    const manifest = await this.init();
    if (!manifest || this.state === 'disposed') return null;
    const entry = this.entry(id);
    if (!entry) return null;
    if (this.cache.has(id)) return this.cache.get(id);

    const generation = this._generation;
    const promise = (async () => {
      try {
        /* preload 항목은 이 문을 지나지 않는다 — 자기 자신을 기다리게 된다. */
        if (!entry.preload && this.deferOnDemand) {
          await (typeof this.deferOnDemand === 'function' ? this.deferOnDemand() : this.deferOnDemand);
          if (generation !== this._generation || this.state === 'disposed') return null;
        }
        const response = await this.fetchFn(entry.path, {
          cache: entry.preload ? 'force-cache' : 'default',
          signal: this._controller.signal,
        });
        if (!response?.ok) throw new Error(`${entry.path} HTTP ${response?.status ?? 'error'}`);
        const bytes = await response.arrayBuffer();
        if (generation !== this._generation || this.state === 'disposed') return null;
        const decode = this.decoders[entry.type];
        return decode ? await decode({ entry, bytes }) : Object.freeze({ entry, bytes });
      } catch (error) {
        if (generation === this._generation && this.state !== 'disposed') {
          this.failures.set(id, error);
          this.cache.delete(id);
          this.logger.warn?.(`[art-v2] ${id} 로딩 실패 · 절차형 폴백 사용`, error);
        }
        return null;
      }
    })();
    this.cache.set(id, promise);
    return promise;
  }

  async preload() {
    const manifest = await this.init();
    if (!manifest) return [];
    return Promise.all(preloadAssets(manifest, this.quality).map((entry) => this.load(entry.id)));
  }

  async retry() {
    if (!this.enabled || this.state === 'disposed') return null;
    this._generation += 1;
    this._controller.abort();
    this._controller = new AbortController();
    this._initPromise = null;
    this.manifest = null;
    this.error = null;
    this.failures.clear();
    this.cache.clear();
    this.state = 'idle';
    return this.init();
  }

  snapshot() {
    return Object.freeze({
      enabled: this.enabled,
      quality: this.quality,
      state: this.state,
      manifestAssets: this.manifest?.assets.length || 0,
      cached: this.cache.size,
      failed: [...this.failures.keys()],
    });
  }

  dispose() {
    if (this.state === 'disposed') return;
    this._generation += 1;
    this.state = 'disposed';
    this._controller.abort();
    this.cache.clear();
    this.manifest = null;
  }
}
