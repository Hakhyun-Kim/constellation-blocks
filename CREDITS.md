# Credits

## Current fonts

- [Jua](https://github.com/google/fonts/tree/main/ofl/jua), distributed by Google Fonts under the SIL Open Font License 1.1.
- [Gaegu](https://github.com/google/fonts/tree/main/ofl/gaegu), distributed by Google Fonts under the SIL Open Font License 1.1.

The two font files were acquired from the official Google Fonts repository on
2026-08-14 so that both the browser build and the desktop demo work offline.
Their hashes are recorded in `assets/manifest.json`; the license text is bundled
at `licenses/OFL-1.1.txt`. System sans-serif and cursive families remain the CSS
fallbacks.

**Modification.** Both files are shipped as subsets, not as the upstream
originals. Each upstream TTF carries the full KS X 1001 set of 2,350 Hangul
syllables, which the two together cost 4.96 MB — the largest single item in the
first download, while the game renders only 922 of those syllables. `npm run
fonts:subset` keeps the glyphs the game actually draws and compresses the result
to WOFF2 (382 KB for both). Outlines, metrics, and family names are unchanged;
only the glyph coverage is reduced. The OFL permits this, and neither font
declares a Reserved Font Name — name ID 0 of each reads "Copyright 2018 The …
Project Authors" with no reservation clause — so the `Jua` and `Gaegu` family
names are retained. `npm run fonts:check` fails the build if a Korean character
used on screen is missing from the shipped subset.

## Project branding

The castle-and-constellation app icon was generated for this project by Hakhyun
Kim with OpenAI ImageGen on 2026-08-14. It used an original text-only prompt and
no reference images: a centered ivory low-poly castle, a gold-and-cyan
constellation shield, a deep navy square background, strong silhouette, and no
lettering. The selected output was resized to a 512px PNG and converted into a
multi-resolution Windows ICO. The project-owned output is used under the
[OpenAI Terms of Use](https://openai.com/policies/terms-of-use/); hashes and
transformations are recorded in `assets/manifest.json`.

## Runtime character, monster, and landmark models

- [RPG Character Pack](https://quaternius.com/packs/rpgcharacters.html) by Quaternius — Warrior, Wizard, Monk, Ranger, and Cleric models and animations, CC0 1.0 Universal.
- [Ultimate Monsters](https://quaternius.com/packs/ultimatemonsters.html) by Quaternius — Green Blob, Demon, Yeti, Orc, Orc Skull, Alien, Mushroom King, and Blue Demon models and animations, CC0 1.0 Universal.
- [Medieval Village MegaKit](https://quaternius.com/packs/medievalvillagemegakit.html) by Quaternius — modular gate wall, straight wall, round door, and tower landmark pieces, CC0 1.0 Universal.

Quaternius explains the packs' commercial use, modification, and redistribution terms in its [FAQ](https://quaternius.com/faq.html). The pilot files were acquired on 2026-08-13 and the five-hero/regional expansion on 2026-08-14. Character and monster glTF files are repacked as GLB without changing geometry, materials, embedded textures, or animation data. The distant gate landmark keeps the original geometry and base colors while resizing base-color textures to 512px JPEG, replacing normal and roughness maps with material constants, and packing each selected module as GLB. Runtime hashes, source filenames, transformations, and quality profiles are recorded in `assets/manifest.json`.

## Runtime audio samples

- [RPG Audio](https://kenney.nl/assets/rpg-audio) by Kenney — weapon, coin, placement, and gate-latch samples, CC0 1.0 Universal.
- [Impact Sounds](https://kenney.nl/assets/impact-sounds) by Kenney — character, shield, enemy, and castle impact samples, CC0 1.0 Universal.

Ten original OGG files were acquired on 2026-08-13 and renamed without transcoding. Runtime playback gain is normalized by role between -16 dB for frequent hits and -7 dB for the rare castle impact. The existing compressor remains the final peak guard. Source filenames, roles, gain values, and hashes are recorded in `assets/manifest.json`.

## Development

Constellation Defense was designed and developed by Hakhyun Kim with Codex as an AI development collaborator.

The default release uses the models and samples above. `?art=procedural` remains a zero-asset fallback and comparison mode; any failed or unsupported load also keeps the procedural representation and synthesized sound recipe. Future image, audio, model, and animation assets are allowed when their source and commercial license are recorded here and in `assets/manifest.json`, and their download/rendering cost passes `npm run asset:check` plus the browser performance gate.
