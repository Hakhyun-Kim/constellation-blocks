/* Fixed-party hero card contract — no DOM required. */
import * as D from '../src/data.js';
import * as E from '../src/engine.js';
import { heroCardClass, heroCardMarkup } from '../src/app/hero-card.js';

const state = E.createGame({ partyKeys: D.SQUAD.map((spec) => spec.key) });
const required = ['hero-card-art', 'hero-card-role', 'hero-card-ability', '피해', 'DPS', '사거리', 'hero-card-growth'];
let failed = 0;

for (const hero of state.field) {
  const markup = heroCardMarkup(hero);
  const card = heroCardClass(hero, hero.heroKey === 'arin');
  const missing = required.filter((token) => !markup.includes(token));
  const nameMissing = !markup.includes(hero.name);
  const valid = !missing.length && !nameMissing && card.className.includes('hero-card')
    && card.style.includes('--hero-card-accent') && card.ariaLabel.includes(hero.name);
  console.log(`${valid ? '✅' : '❌'} hero card: ${hero.heroKey}`);
  if (!valid) {
    failed++;
    console.log(`   missing: ${missing.join(', ') || 'none'}${nameMissing ? ' | hero name' : ''}`);
  }
}

if (failed) process.exit(1);
console.log('Hero card checks passed.');
