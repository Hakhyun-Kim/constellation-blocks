# Desktop package evidence — 2026-08-14

## Build identity

- App: Constellation Defense 2.1.0
- Electron: 43.4.0
- Electron Forge / ZIP maker: 7.11.2
- Platform: Windows x64
- Commands: `npm.cmd run desktop:package`, `npm.cmd run desktop:make`

## Measured output

| Output | Measurement |
|---|---:|
| Packaged directory | 385,699,107 bytes (367.83 MiB), 75 files |
| Application ASAR | 21,399,084 bytes (20.41 MiB) |
| Steam handoff ZIP | 154,958,358 bytes (147.78 MiB) |
| ZIP SHA-256 | `89906f467ce66f156ff27e1182c5a1a4e8843eeffee2863cfadaf8065f5966a6` |

The ZIP is an ignored local build artifact, not a repository asset. Rebuilding
may change the archive hash because ZIP metadata is not defined as reproducible;
record the hash of the actual candidate delivered to Steam.

## Runtime evidence

The source wrapper's hidden smoke run loaded the Korean game title, settings
button, and real Three.js canvas; `window.require` and `window.process` were not
visible. Its narrow bridge reported Windows, version 2.1.0, unpackaged state,
and `C:\Users\hakhy\AppData\Roaming\Constellation Defense` as the actual local
data path. The packaged executable repeated the same smoke and exited with code
0.

ASAR inspection confirmed that both offline fonts, PNG/ICO branding, the
externalized animation-frame shim, preload bridge, and OFL license text are in
the package. Browser smoke at desktop and 390×844 widths found the real canvas,
zero horizontal overflow, no external script/style origin, no stage animation
or filter, and successful Jua/Gaegu loading on the desktop route.

## Budget interpretation

The desktop ZIP includes the Chromium runtime, so its distribution size is not
the browser first-play budget. The shared game payload independently passes the
asset gate at 11.22 MiB initial and 20.14 MiB total. A future installer may keep
only Korean and English Chromium locale packs to reduce the desktop archive, but
that packaging optimization must not delay first-play browser assets or weaken
the tested fallback.
