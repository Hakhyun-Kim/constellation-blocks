/* Regional dressing is visual-only.  Encounter rules stay in engine/; a
 * journey battle supplies only a stable region id to the renderer. */
import * as THREE from 'three';

export const REGION_THEMES = {
  'verdant-dawn': {
    id: 'verdant-dawn', label: '푸른 초원 · 새벽', phase: 0.10,
    grass: true,
    ground: 0x8da86c, road: 0xdcc38f, roadEdge: 0x7c6744,
    wall: 0x9db5b1, stoneMix: 0.12, fog: 0xb7d8d1,
  },
  'ember-gate': {
    id: 'ember-gate', label: '붉은 성문 · 황혼', phase: 0.79,
    grass: false,
    ground: 0x79604a, road: 0xbe8a65, roadEdge: 0x59433e,
    wall: 0x816d78, stoneMix: 0.38, fog: 0x80677a,
  },
  'neon-ruins': {
    id: 'neon-ruins', label: '서울 제7게이트 · 비 내린 새벽', phase: 0.18,
    grass: false,
    ground: 0x56676b, road: 0x6f7479, roadEdge: 0x343b43,
    wall: 0x73828a, stoneMix: 0.48, fog: 0x7799a2,
  },
  'ashen-margin': {
    id: 'ashen-margin', label: '잿빛 여백 · 흐린 낮', phase: 0.44,
    grass: false,
    ground: 0x807b70, road: 0xc5b99d, roadEdge: 0x625d57,
    wall: 0xaaa394, stoneMix: 0.32, fog: 0xb1aaa0,
  },
  'manuscript-core': {
    id: 'manuscript-core', label: '원고핵 성채 · 붉은 교정광', phase: 0.74,
    grass: false,
    ground: 0x665362, road: 0xb68c87, roadEdge: 0x513c4c,
    wall: 0x806a80, stoneMix: 0.52, fog: 0x80677d,
  },
};

export const regionTheme = (id) => REGION_THEMES[id] || REGION_THEMES['verdant-dawn'];

const lam = (color, extra = {}) => new THREE.MeshLambertMaterial({ color, ...extra });

function pine(scale = 1, leaf = 0x315f43) {
  const group = new THREE.Group();
  const trunk = new THREE.Mesh(new THREE.CylinderGeometry(.13 * scale, .18 * scale, 1.25 * scale, 6), lam(0x6f4c35));
  trunk.position.y = .6 * scale;
  const low = new THREE.Mesh(new THREE.ConeGeometry(.72 * scale, 1.45 * scale, 7), lam(leaf));
  low.position.y = 1.12 * scale;
  const high = new THREE.Mesh(new THREE.ConeGeometry(.52 * scale, 1.38 * scale, 7), lam(leaf));
  high.position.y = 1.88 * scale;
  group.add(trunk, low, high);
  return group;
}

function boulder(scale = 1, color = 0x536450) {
  const rock = new THREE.Mesh(new THREE.DodecahedronGeometry(.52 * scale, 0), lam(color));
  rock.scale.y = .68;
  rock.rotation.set(.16, .35, .08);
  rock.position.y = .26 * scale;
  return rock;
}

function banner(color) {
  const group = new THREE.Group();
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(.028, .028, 2.25, 6), lam(0x5f4834));
  pole.position.y = 1.12;
  const cloth = new THREE.Mesh(new THREE.PlaneGeometry(.82, .62), new THREE.MeshLambertMaterial({ color, side: THREE.DoubleSide }));
  cloth.position.set(.42, 1.84, 0);
  cloth.geometry.translate(.41, 0, 0);
  group.add(pole, cloth);
  group.userData.cloth = cloth;
  return group;
}

function emberBrazier() {
  const group = new THREE.Group();
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(.28, .38, .3, 8), lam(0x443846));
  bowl.position.y = .36;
  const flame = new THREE.Mesh(new THREE.OctahedronGeometry(.24), new THREE.MeshBasicMaterial({ color: 0xff8f42, transparent: true, opacity: .9 }));
  flame.position.y = .72;
  group.add(bowl, flame);
  group.userData.flame = flame;
  return group;
}

function emberGate() {
  const group = new THREE.Group();
  const dark = lam(0x433b4a);
  for (const x of [-1.9, 1.9]) {
    const tower = new THREE.Mesh(new THREE.CylinderGeometry(.52, .62, 3.6, 7), dark);
    tower.position.set(x, 1.8, 0);
    group.add(tower);
    const cap = new THREE.Mesh(new THREE.ConeGeometry(.72, .8, 7), lam(0x622f37));
    cap.position.set(x, 4, 0);
    group.add(cap);
  }
  const lintel = new THREE.Mesh(new THREE.BoxGeometry(4.8, .52, .54), dark);
  lintel.position.set(0, 3.05, 0);
  group.add(lintel);
  return group;
}

function ruinBlock(width, height, color, light = null) {
  const group = new THREE.Group();
  const block = new THREE.Mesh(new THREE.BoxGeometry(width, height, .9), lam(color));
  block.position.y = height / 2;
  group.add(block);
  if (light != null) {
    const sign = new THREE.Mesh(new THREE.BoxGeometry(width * .62, .12, .04), new THREE.MeshBasicMaterial({ color: light }));
    sign.position.set(0, Math.min(height - .35, height * .72), .48);
    group.add(sign);
  }
  return group;
}

function paperPillar(scale = 1, ink = 0x514b52) {
  const group = new THREE.Group();
  const page = new THREE.Mesh(new THREE.BoxGeometry(1.1 * scale, 2.7 * scale, .12), lam(0xd8cfb8));
  page.position.y = 1.35 * scale;
  const lineMat = new THREE.MeshBasicMaterial({ color: ink });
  for (let row = 0; row < 4; row++) {
    const line = new THREE.Mesh(new THREE.BoxGeometry(.72 * scale, .035, .025), lineMat);
    line.position.set(0, (.8 + row * .37) * scale, .075);
    group.add(line);
  }
  group.add(page);
  group.rotation.y = .2;
  return group;
}

export class RegionScenery {
  constructor(scene) {
    this.scene = scene;
    this.groups = {};
    this.glows = [];
    this.banners = [];
    this._buildVerdant();
    this._buildEmber();
    this._buildNeon();
    this._buildAshen();
    this._buildManuscript();
    this.setTheme('verdant-dawn');
  }

  _group(id) {
    const group = new THREE.Group();
    group.name = `region:${id}`;
    this.scene.add(group);
    this.groups[id] = group;
    return group;
  }

  _buildVerdant() {
    const group = this._group('verdant-dawn');
    const trees = [
      [-13.0, -2.6, 1.15], [-14.3, 2.7, .85], [-10.8, 5.8, .65],
      [13.4, -1.2, 1.2], [14.6, 3.9, .75], [10.8, 6.6, .62],
    ];
    for (const [x, z, scale] of trees) { const item = pine(scale); item.position.set(x, 0, z); group.add(item); }
    for (const [x, z, scale] of [[-11, .5, .75], [-9.8, 3.8, .45], [12.1, 1.7, .75], [10.5, 5.4, .46]]) {
      const item = boulder(scale, 0x5f715d); item.position.set(x, 0, z); group.add(item);
    }
    for (const [x, z] of [[-7.3, -4.8], [7.3, -4.8]]) {
      const item = banner(0x64b8a0); item.position.set(x, 0, z); group.add(item); this.banners.push(item);
    }
  }

  _buildEmber() {
    const group = this._group('ember-gate');
    const gate = emberGate();
    gate.position.set(0, 0, -8.2);
    group.add(gate);
    for (const [x, z, scale] of [[-13.5, -1.6, 1.2], [-11.5, 3.4, .76], [13.6, -1.1, 1.3], [11.6, 3.8, .8]]) {
      const item = boulder(scale, 0x4b3d45); item.position.set(x, 0, z); group.add(item);
    }
    for (const [x, z] of [[-4.2, -5.0], [4.2, -5.0], [-10.2, 1.2], [10.2, 1.2]]) {
      const item = emberBrazier(); item.position.set(x, 0, z); group.add(item); this.glows.push(item);
    }
    for (const [x, z] of [[-7.1, -4.8], [7.1, -4.8]]) {
      const item = banner(0xbd5652); item.position.set(x, 0, z); group.add(item); this.banners.push(item);
    }
  }

  _buildNeon() {
    const group = this._group('neon-ruins');
    const blocks = [[-13.2, -3.4, 2.3, 4.8], [-11.7, 2.3, 1.7, 3.4], [13.3, -2.2, 2.4, 5.1], [11.8, 3.5, 1.5, 3.0]];
    for (let index = 0; index < blocks.length; index++) {
      const [x, z, width, height] = blocks[index];
      const item = ruinBlock(width, height, index % 2 ? 0x58636e : 0x414b58, index % 2 ? 0xff77b7 : 0x4fe4ef);
      item.position.set(x, 0, z); item.rotation.y = x < 0 ? .12 : -.12; group.add(item);
    }
    for (const [x, z] of [[-7.2, -4.8], [7.2, -4.8]]) {
      const item = banner(0x4cced6); item.position.set(x, 0, z); group.add(item); this.banners.push(item);
    }
  }

  _buildAshen() {
    const group = this._group('ashen-margin');
    for (const [x, z, scale] of [[-13, -2.5, 1.15], [-11.2, 3.2, .8], [13.1, -1.8, 1.05], [11.3, 4.1, .75]]) {
      const item = paperPillar(scale); item.position.set(x, 0, z); item.rotation.y += x < 0 ? .34 : -.34; group.add(item);
    }
    for (const [x, z, scale] of [[-9.6, 6, .5], [9.7, 5.8, .48]]) {
      const item = boulder(scale, 0x6d6761); item.position.set(x, 0, z); group.add(item);
    }
  }

  _buildManuscript() {
    const group = this._group('manuscript-core');
    for (const x of [-3.1, 3.1]) {
      const page = paperPillar(1.7, 0x7f3348); page.position.set(x, 0, -8); page.rotation.y = x < 0 ? .25 : -.25; group.add(page);
    }
    const core = new THREE.Mesh(new THREE.OctahedronGeometry(.72), new THREE.MeshBasicMaterial({ color: 0xf05e82 }));
    core.position.set(0, 2.3, -8.1); group.add(core); this.glows.push({ userData: { flame: core } });
    for (const [x, z] of [[-10.8, 1.6], [10.8, 1.6]]) {
      const item = banner(0xb64c6c); item.position.set(x, 0, z); group.add(item); this.banners.push(item);
    }
  }

  setTheme(id) {
    for (const [key, group] of Object.entries(this.groups)) group.visible = key === id;
  }

  frame(time) {
    const glow = .76 + Math.sin(time * 5.3) * .2;
    for (const item of this.glows) item.userData.flame.scale.setScalar(glow);
    for (let i = 0; i < this.banners.length; i++) {
      const cloth = this.banners[i].userData.cloth;
      cloth.rotation.y = Math.sin(time * 1.7 + i) * .18;
    }
  }
}
