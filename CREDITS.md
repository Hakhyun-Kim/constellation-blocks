# Credits

## Current fonts

- [Jua](https://fonts.google.com/specimen/Jua), distributed by Google Fonts under the SIL Open Font License 1.1.
- [Gaegu](https://fonts.google.com/specimen/Gaegu), distributed by Google Fonts under the SIL Open Font License 1.1.

## Optional `art=v2` pilot models

- [RPG Character Pack](https://quaternius.com/packs/rpgcharacters.html) by Quaternius — Warrior model and animations, CC0 1.0 Universal.
- [Ultimate Monsters](https://quaternius.com/packs/ultimatemonsters.html) by Quaternius — Green Blob, Demon, and Yeti models and animations, CC0 1.0 Universal.

Quaternius explains the packs' commercial use, modification, and redistribution terms in its [FAQ](https://quaternius.com/faq.html). The selected self-contained glTF files were acquired on 2026-08-13 and repacked as GLB without changing geometry, materials, textures, or animation data. Runtime hashes and quality profiles are recorded in `assets/manifest.json`.

## Development

Constellation Defense was designed and developed by Hakhyun Kim with Codex as an AI development collaborator.

The default release renders its visual game elements procedurally and synthesizes audio in the browser. The optional `?art=v2` pilot uses the models above; a failed or unsupported load keeps the procedural representation. Future image, audio, model, and animation assets are allowed when their source and commercial license are recorded here and in `assets/manifest.json`, and their download/rendering cost passes `npm run asset:check` plus the browser performance gate.
