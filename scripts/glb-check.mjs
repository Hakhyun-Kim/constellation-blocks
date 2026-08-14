import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { normalizeAssetManifest } from '../src/assets/catalog.js';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const manifest = normalizeAssetManifest(JSON.parse(readFileSync(resolve(ROOT, 'assets/manifest.json'), 'utf8')));
const failures = [];

const REQUIRED_ANIMATIONS = Object.freeze({
  'quaternius-warrior': ['Idle', 'Run', 'Sword_Attack', 'Death'],
  'quaternius-wizard': ['Idle', 'Run', 'Spell1', 'Death'],
  'quaternius-monk': ['Idle', 'Run', 'Attack', 'Death'],
  'quaternius-ranger': ['Idle', 'Run', 'Bow_Shoot', 'Death'],
  'quaternius-cleric': ['Idle', 'Run', 'Spell1', 'Death'],
  'quaternius-green-blob': ['Idle', 'Walk', 'Bite_Front', 'Death'],
  'quaternius-demon': ['Flying_Idle'],
  'quaternius-yeti': ['Idle', 'Walk', 'Bite_Front', 'Death'],
  'quaternius-orc': ['Idle', 'Walk', 'Punch', 'Death'],
  'quaternius-orc-skull': ['Idle', 'Walk', 'Punch', 'Death'],
  'quaternius-alien': ['Idle', 'Walk', 'Punch', 'Death'],
  'quaternius-mushroom-king': ['Idle', 'Walk', 'Punch', 'Death'],
  'quaternius-blue-demon': ['Idle', 'Walk', 'Punch', 'Death'],
});

function inspectGlb(entry) {
  const bytes = readFileSync(resolve(ROOT, entry.path));
  if (bytes.length < 20 || bytes.readUInt32LE(0) !== 0x46546c67) throw new Error('GLB magic 불일치');
  if (bytes.readUInt32LE(4) !== 2) throw new Error('GLB 2만 지원');
  if (bytes.readUInt32LE(8) !== bytes.length) throw new Error('GLB 선언 길이 불일치');

  const jsonLength = bytes.readUInt32LE(12);
  const jsonType = bytes.readUInt32LE(16);
  if (jsonType !== 0x4e4f534a) throw new Error('첫 chunk가 JSON이 아님');
  const json = JSON.parse(bytes.subarray(20, 20 + jsonLength).toString('utf8').trimEnd());
  const binOffset = 20 + jsonLength;
  if (binOffset + 8 > bytes.length || bytes.readUInt32LE(binOffset + 4) !== 0x004e4942) {
    throw new Error('BIN chunk 누락');
  }
  const binLength = bytes.readUInt32LE(binOffset);
  if (binOffset + 8 + binLength !== bytes.length) throw new Error('BIN chunk 길이 불일치');
  if (json.buffers?.length !== 1 || json.buffers[0].uri) throw new Error('외부 또는 data URI buffer가 남음');
  if ((json.images || []).some((image) => image.uri)) throw new Error('외부 image URI가 남음');

  const triangles = (json.meshes || []).reduce((sum, mesh) => sum + (mesh.primitives || []).reduce((meshSum, primitive) => {
    const accessor = json.accessors?.[primitive.indices];
    return meshSum + (accessor?.count || 0) / 3;
  }, 0), 0);
  return {
    bytes: bytes.length,
    meshes: json.meshes?.length || 0,
    triangles: Math.round(triangles),
    animations: (json.animations || []).map((animation) => animation.name),
  };
}

for (const entry of manifest.assets.filter((asset) => asset.type === 'model')) {
  try {
    if (!entry.path.endsWith('.glb')) failures.push(`${entry.id}: 런타임 모델은 .glb여야 함`);
    const info = inspectGlb(entry);
    for (const required of REQUIRED_ANIMATIONS[entry.id] || []) {
      if (!info.animations.includes(required)) failures.push(`${entry.id}: ${required} 애니메이션 누락`);
    }
    console.log(`${entry.id}: ${(info.bytes / 1024).toFixed(1)} KiB · mesh ${info.meshes} · triangle ${info.triangles} · animation ${info.animations.length}`);
  } catch (error) {
    failures.push(`${entry.id}: ${error.message}`);
  }
}

for (const id of Object.keys(REQUIRED_ANIMATIONS)) {
  if (!manifest.byId.has(id)) failures.push(`${id}: 필수 파일럿 모델 manifest 누락`);
}

if (failures.length) {
  for (const failure of failures) console.error(`❌ ${failure}`);
  process.exitCode = 1;
} else {
  console.log('✅ GLB 구조·내장 리소스·필수 애니메이션 통과');
}
