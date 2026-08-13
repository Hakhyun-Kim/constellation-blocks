import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { normalizeAssetManifest } from '../src/assets/catalog.js';
import { SFX_SAMPLE_CUES, sampleCue } from '../src/audio/sample-plan.js';

const manifest = normalizeAssetManifest(JSON.parse(readFileSync(new URL('../assets/manifest.json', import.meta.url), 'utf8')));
const audio = manifest.assets.filter((entry) => entry.type === 'audio');
assert.equal(audio.length, 10, '파일럿 효과음은 10개여야 한다');
assert.equal(new Set(audio.map((entry) => entry.audioRole)).size, 10, '효과음 역할이 중복되면 안 된다');
for (const entry of audio) {
  assert.equal(entry.preload, true, `${entry.id}: 첫 전투 preload 필요`);
  assert.ok(Number.isFinite(entry.gainDb) && entry.gainDb >= -18 && entry.gainDb <= -3,
    `${entry.id}: -18~-3dB 정규화 gain 필요`);
}
for (const [name, cue] of Object.entries(SFX_SAMPLE_CUES)) {
  assert.equal(sampleCue(name), cue);
  assert.equal(manifest.byId.get(cue.id)?.type, 'audio', `${name}: manifest audio가 필요하다`);
  assert.ok(cue.rate >= 0.8 && cue.rate <= 1.2, `${name}: 과도한 재생 속도 금지`);
}
assert.equal(sampleCue('unknown'), null);

console.log('✅ 실제 효과음 10개 역할·정규화·폴백 슬롯 검사 통과');
