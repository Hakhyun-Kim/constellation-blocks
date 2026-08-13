# Credits

## Current fonts

- [Jua](https://fonts.google.com/specimen/Jua), distributed by Google Fonts under the SIL Open Font License 1.1.
- [Gaegu](https://fonts.google.com/specimen/Gaegu), distributed by Google Fonts under the SIL Open Font License 1.1.

## Optional `art=v2` pilot models

- [RPG Character Pack](https://quaternius.com/packs/rpgcharacters.html) by Quaternius — Warrior model and animations, CC0 1.0 Universal.
- [Ultimate Monsters](https://quaternius.com/packs/ultimatemonsters.html) by Quaternius — Green Blob, Demon, and Yeti models and animations, CC0 1.0 Universal.
- [Medieval Village MegaKit](https://quaternius.com/packs/medievalvillagemegakit.html) by Quaternius — modular gate wall, straight wall, round door, and tower landmark pieces, CC0 1.0 Universal.

Quaternius explains the packs' commercial use, modification, and redistribution terms in its [FAQ](https://quaternius.com/faq.html). The character and monster glTF files were acquired on 2026-08-13 and repacked as GLB without changing geometry, materials, textures, or animation data. The distant gate landmark keeps the original geometry and base colors while resizing base-color textures to 512px JPEG, replacing normal and roughness maps with material constants, and packing each selected module as GLB. Runtime hashes, source filenames, transformations, and quality profiles are recorded in `assets/manifest.json`.

## Development

Constellation Defense was designed and developed by Hakhyun Kim with Codex as an AI development collaborator.

The default release renders its visual game elements procedurally and synthesizes audio in the browser. The optional `?art=v2` pilot uses the models above; a failed or unsupported load keeps the procedural representation. Future image, audio, model, and animation assets are allowed when their source and commercial license are recorded here and in `assets/manifest.json`, and their download/rendering cost passes `npm run asset:check` plus the browser performance gate.
