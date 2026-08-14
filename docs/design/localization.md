# Korean / English localization contract

Last updated: 2026-08-14

Constellation Defense ships Korean as the default and English as the second supported locale.
Players can change the language in the ⚙️ settings panel; the choice is stored on the device and
applies after an immediate reload. `?lang=ko` and `?lang=en` are deterministic QA overrides.

## Runtime boundary

- `src/app/i18n.js` owns locale normalization and the Korean-to-English presentation catalog.
- Game rules, save IDs, hero keys, journey node IDs, and balance values are never translated.
- Static HTML and dynamically inserted presentation text pass through the same DOM-localization
  boundary. Unknown phrases remain Korean instead of guessing a translation.
- `src/story.js` owns parallel Korean and English story beats with identical keys. The active story
  is the hunter-fiction gate narrative; the former math-prototype copy is not reachable at runtime.
- `KeyboardEvent.code` bindings stay language-independent. Translating a label never changes its
  saved action or physical key.

## Release gate

For both locales, verify the opening story, first journey map, direct judge battle, settings panel,
hero cards, lane pressure, match-3 legend, boss warning, and mobile 390×844 layout. English visible
surfaces must contain no Hangul in that path. Proper names use the project spellings Arin, Luna,
Doyun, Sera, and Yuna.

The source locale remains Korean. New player-facing strings must be added to the English catalog or
to both story catalogs in the same commit, with `npm.cmd run i18n:check` updated when needed.
