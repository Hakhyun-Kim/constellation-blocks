'use strict';

const { app, BrowserWindow, ipcMain, net, protocol, session } = require('electron');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const SCHEME = 'constellation';
const BUNDLE_HOST = 'game';
const BUNDLE_ROOT = path.resolve(__dirname, '..');
const SMOKE_MODE = process.argv.includes('--desktop-smoke');

protocol.registerSchemesAsPrivileged([{
  scheme: SCHEME,
  privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, codeCache: true },
}]);
app.enableSandbox();
app.setName('Constellation Blocks');
if (process.platform === 'win32') app.setAppUserModelId('com.hakhyunkim.constellationdefense');

function trustedUrl(raw) {
  try {
    const parsed = new URL(raw);
    return parsed.protocol === `${SCHEME}:` && parsed.host === BUNDLE_HOST;
  } catch { return false; }
}

function bundleFile(raw) {
  const parsed = new URL(raw);
  if (!trustedUrl(raw)) return null;
  let relative;
  try { relative = decodeURIComponent(parsed.pathname).replace(/^\/+/, '') || 'index.html'; }
  catch { return null; }
  if (relative.includes('\0')) return null;
  const absolute = path.resolve(BUNDLE_ROOT, relative);
  const relation = path.relative(BUNDLE_ROOT, absolute);
  if (!relation || relation.startsWith('..') || path.isAbsolute(relation)) return null;
  return absolute;
}

function installProtocol() {
  protocol.handle(SCHEME, (request) => {
    const file = bundleFile(request.url);
    if (!file) return new Response('Not found', { status: 404 });
    return net.fetch(pathToFileURL(file).toString());
  });
}

function installSessionPolicy() {
  const active = session.defaultSession;
  active.setPermissionRequestHandler((_webContents, _permission, callback) => callback(false));
  active.setPermissionCheckHandler(() => false);
}

function installDesktopInfoBridge() {
  ipcMain.handle('desktop:get-info', (event) => {
    if (!trustedUrl(event.senderFrame?.url || '')) throw new Error('Untrusted desktop info request');
    return Object.freeze({
      platform: process.platform,
      packaged: app.isPackaged,
      storagePath: app.getPath('userData'),
      version: app.getVersion(),
    });
  });
}

function createWindow() {
  const window = new BrowserWindow({
    title: 'Constellation Blocks',
    width: 1440,
    height: 900,
    minWidth: 1080,
    minHeight: 720,
    backgroundColor: '#111a35',
    show: false,
    autoHideMenuBar: true,
    icon: path.join(BUNDLE_ROOT, 'assets', 'branding', 'icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      devTools: !app.isPackaged,
    },
  });

  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event, url) => {
    if (!trustedUrl(url)) event.preventDefault();
  });
  window.webContents.on('will-attach-webview', (event) => event.preventDefault());

  window.webContents.once('did-fail-load', (_event, code, description, url) => {
    if (!SMOKE_MODE) return;
    console.error(`DESKTOP_SMOKE_FAILED ${JSON.stringify({ code, description, url })}`);
    app.exit(1);
  });
  window.webContents.once('did-finish-load', async () => {
    if (!SMOKE_MODE) {
      window.show();
      return;
    }
    try {
      const result = await window.webContents.executeJavaScript(`(async () => {
        const desktop = await window.constellationDesktop.getInfo();
        return {
          title: document.title,
          lang: document.documentElement.lang,
          settings: !!document.querySelector('#settingsBtn'),
          canvas: !!document.querySelector('#scene3d canvas'),
          nodeVisible: typeof window.require !== 'undefined' || typeof window.process !== 'undefined',
          desktop
        };
      })()`);
      console.log(`DESKTOP_SMOKE ${JSON.stringify(result)}`);
      app.exit(result.settings && result.canvas && !result.nodeVisible ? 0 : 1);
    } catch (error) {
      console.error(`DESKTOP_SMOKE_FAILED ${error.stack || error.message}`);
      app.exit(1);
    }
  });

  const query = SMOKE_MODE ? '?desktop=1&desktopqa=1&mute=1&art=procedural&sessionqa=1' : '?desktop=1';
  void window.loadURL(`${SCHEME}://${BUNDLE_HOST}/index.html${query}`);
  return window;
}

app.whenReady().then(() => {
  app.setAppLogsPath();
  installProtocol();
  installSessionPolicy();
  installDesktopInfoBridge();
  createWindow();
  app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

