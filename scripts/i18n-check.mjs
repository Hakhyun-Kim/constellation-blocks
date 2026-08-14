import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  SUPPORTED_LOCALES,
  normalizeLocale,
  setLocale,
  translateKnownText,
  translationEntries,
} from '../src/app/i18n.js';
import { BEATS, beat } from '../src/story.js';

assert.deepEqual(SUPPORTED_LOCALES, ['ko', 'en']);
assert.equal(normalizeLocale('en-US'), 'en');
assert.equal(normalizeLocale('ko-KR'), 'ko');
assert.equal(normalizeLocale('unknown'), 'ko');
assert.equal(setLocale('en'), 'en');
assert.equal(translateKnownText('설정'), 'Settings');
assert.equal(translateKnownText('⚙️ 설정'), '⚙️ Settings');
assert.equal(translateKnownText('  푸른 초원  '), '  Verdant Meadow  ');
assert.equal(translateKnownText('▶ 7웨이브 시작!'), '▶ Start Wave 7!');
assert.equal(translateKnownText('설정', 'ko'), '설정');

const entries = translationEntries();
assert.ok(entries.length >= 120, 'critical demo catalog has broad Korean/English coverage');
assert.equal(new Set(entries.map(([source]) => source)).size, entries.length, 'source phrases are unique');
assert.ok(entries.every(([source, target]) => source.trim() && target.trim()), 'translations are non-empty');

const html = fs.readFileSync(new URL('../index.html', import.meta.url), 'utf8');
assert.match(html, /id="settingsLanguage"/);
assert.match(html, /<option value="ko">한국어<\/option>/);
assert.match(html, /<option value="en">English<\/option>/);
assert.equal(beat('prologue', 'en').title, 'The Book Read You First');
assert.equal(beat('prologue', 'ko'), BEATS.prologue);
assert.doesNotMatch(JSON.stringify(BEATS), /수학|계산 문제|셈을/);

console.log(`✅ ko/en locale normalization, ${entries.length} critical translations, patterns, and language selector passed.`);
