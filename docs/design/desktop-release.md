# Desktop demo release contract

Updated: 2026-08-14

## Decision

The free desktop demo packages the existing browser game with Electron 43.4.0
and Electron Forge 7.11.2. This preserves one tested game bundle and one save
schema across GitHub Pages and Steam while adding an offline executable. Forge's
ZIP maker produces a depot-ready Windows build without requiring the Steamworks
SDK or a Steam API dependency inside the game.

Electron is deliberately a thin shell. Game rules, rendering, assets, settings,
localization, and saves remain in the browser code. The wrapper owns only the
window, the local application protocol, the operating-system data path, and the
packaging boundary.

## Security and offline behavior

- `constellation://game/` is a standard, secure local protocol. Requests are
  resolved beneath the packaged application root; decoded traversal and every
  other host or scheme are rejected.
- Chromium sandboxing, context isolation, web security, and ASAR packaging are
  enabled. Node integration is disabled.
- The preload exposes one read-only asynchronous operation: application version,
  platform, packaged state, and the user-data directory. It exposes no file,
  shell, process, or arbitrary IPC capability.
- Permission requests, permission checks, new windows, attached webviews, and
  navigation away from the trusted local origin are denied.
- Scripts, fonts, icons, models, and audio are bundled. The release has no
  required network request and its content-security policy permits only its own
  origin plus local data/blob media created by the game.

## Save path

Browser releases continue to use that site's local storage. The desktop build
uses Chromium local storage inside Electron's `app.getPath('userData')`; the
resolved absolute path is displayed in Settings so players can find the real
location on their own machine. On a default Windows installation this is below
`%APPDATA%\Constellation Defense`. Save exports and playtest exports still use
the operating system's normal download picker/location.

The wrapper never silently migrates or merges a browser save. The existing
in-game export/import path is the explicit transfer mechanism between browser
and desktop.

## Build and Steam handoff

From a clean checkout on Windows:

```powershell
npm.cmd ci
npm.cmd run check
npm.cmd run desktop:make
```

`desktop:make` first rebuilds `dist/game.js` and `dist/rafshim.js`, packages the
offline application, and creates a Windows ZIP under `out/make/zip`. Upload the
unpacked application directory (or the extracted ZIP contents) as the Steam
depot. A Steam app ID, partner credentials, and Steamworks SDK are release-team
inputs and must never be committed. The SDK is only needed by the release
operator for SteamPipe upload; no Steam API is required for this demo's current
feature set.

Before a public non-Steam download, sign the executable or installer with the
publisher's Windows code-signing identity. Steam depot distribution can use the
same packaged files, with store configuration and redistributables managed in
Steamworks.

## Dependency audit policy

`npm.cmd run audit:runtime` must report zero production vulnerabilities. Electron
and Forge are exact-version locked; patched `tar` and `tmp` transitive versions
are enforced through package overrides. Forge currently retains an advisory in
its development-only extraction tool with no fixed upstream release. It is not
shipped as an application runtime dependency, and packaging downloads only the
locked official Electron archive. Recheck the complete development audit and
upgrade Forge before every release; do not claim the development toolchain is
advisory-free while that exception remains.

## Release checks

- `npm.cmd run desktop:check` validates the static security and offline contract.
- `npm.cmd run desktop:package` must create an ASAR-based unpacked application.
- Running the source wrapper with `--desktop-smoke` must load the real canvas,
  expose no Node globals, and return the narrow desktop information object.
- Run the normal browser, asset-budget, storage, visual-safety, and deterministic
  gates before making the ZIP.
