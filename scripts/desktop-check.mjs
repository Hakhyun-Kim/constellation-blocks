import assert from 'node:assert/strict';
import fs from 'node:fs';

const read = (relative) => fs.readFileSync(new URL(`../${relative}`, import.meta.url), 'utf8');
const main = read('desktop/main.cjs');
const preload = read('desktop/preload.cjs');
const forge = read('forge.config.cjs');
const html = read('index.html');
const pkg = JSON.parse(read('package.json'));

assert.match(main, /registerSchemesAsPrivileged/);
assert.match(main, /protocol\.handle\(SCHEME/);
assert.match(main, /path\.relative\(BUNDLE_ROOT, absolute\)/);
assert.match(main, /nodeIntegration:\s*false/);
assert.match(main, /contextIsolation:\s*true/);
assert.match(main, /sandbox:\s*true/);
assert.match(main, /webSecurity:\s*true/);
assert.match(main, /setPermissionRequestHandler/);
assert.match(main, /setPermissionCheckHandler/);
assert.match(main, /setWindowOpenHandler\(\(\) => \(\{ action: 'deny' \}\)\)/);
assert.match(main, /will-navigate/);
assert.doesNotMatch(main, /shell\.openExternal|nodeIntegration:\s*true|webSecurity:\s*false/);

assert.match(preload, /contextBridge\.exposeInMainWorld\('constellationDesktop'/);
assert.match(preload, /ipcRenderer\.invoke\('desktop:get-info'\)/);
assert.doesNotMatch(preload, /readFile|writeFile|exec|spawn|send\(/);

assert.match(forge, /asar:\s*true/);
assert.match(forge, /@electron-forge\/maker-zip/);
assert.match(forge, /icon/);
assert.match(html, /Content-Security-Policy/);
assert.match(html, /script-src 'self';/);
/* GLB 내장 텍스처는 gfx/gltf-assets.js가 직접 디코딩하므로 blob: fetch가 없다.
 * 그래서 connect-src는 'self' 하나로 닫아 둘 수 있다 — 이 검사가 그 사실을 고정한다. */
assert.match(html, /connect-src 'self'"/);
assert.doesNotMatch(html, /connect-src[^"]*https?:/);
assert.doesNotMatch(html, /script-src[^;]*(blob:|data:|unsafe-)/);
assert.doesNotMatch(html, /<script>(.|\n)*<\/script>/);
assert.doesNotMatch(html, /fonts\.googleapis\.com|fonts\.gstatic\.com/);

assert.equal(pkg.main, 'desktop/main.cjs');
assert.ok(pkg.scripts['desktop:start'] && pkg.scripts['desktop:package'] && pkg.scripts['desktop:make']);
assert.equal(pkg.devDependencies.electron, '43.4.0');
assert.equal(pkg.devDependencies['@electron-forge/cli'], '7.11.2');
assert.equal(pkg.devDependencies['@electron-forge/maker-zip'], '7.11.2');

const png = fs.readFileSync(new URL('../assets/branding/icon.png', import.meta.url));
const ico = fs.readFileSync(new URL('../assets/branding/icon.ico', import.meta.url));
assert.deepEqual([...png.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
assert.deepEqual([...ico.subarray(0, 4)], [0, 0, 1, 0]);
assert.ok(png.length < 512 * 1024 && ico.length < 256 * 1024);

console.log('✅ secure local protocol, sandboxed bridge, offline CSP/fonts, Forge ZIP, and desktop icons passed.');
