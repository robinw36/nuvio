/* Select card: icons only mode, icon per option (input_select has none in Home Assistant), subtitle and hidden title/subtitle. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const read = (p) => readFileSync(new URL('../../' + p, import.meta.url), 'utf8');
const card = read('src/parts/cards/select-card.part.js');
const edit = read('src/parts/hg-edit.part.js');

/* the helpers above the class, evaluated on their own */
const helpers = (() => { const src = card.slice(0, card.indexOf('class HGSelectCard')); const ctx = {}; vm.createContext(ctx);
  vm.runInContext(src + '\nthis.guess = hgSelGuess; this.icon = hgSelIcon;', ctx); return ctx; })();

test('suggestions for common option words (nl, en)', () => {
  const g = helpers.guess;
  assert.equal(g('Thuis'), 'mdi:home'); assert.equal(g('Away'), 'mdi:home-export-outline'); assert.equal(g('Nacht'), 'mdi:weather-night');
  assert.equal(g('Eco'), 'mdi:leaf'); assert.equal(g('Uit'), 'mdi:power'); assert.equal(g('Verwarmen'), 'mdi:fire'); assert.equal(g('Auto'), 'mdi:autorenew');
  assert.equal(g('Vorstbeveiliging'), null);
});

test('no false suggestion from a word inside another word', () => {
  assert.equal(helpers.guess('Random'), null);
  assert.equal(helpers.guess('Domotica'), null);
});

test('own icon wins; suggestions only in icons only mode', () => {
  const c = { icons: { Thuis: 'mdi:sofa', Bad: 'not-an-icon' } }, I = helpers.icon;
  assert.equal(I(c, null, 'Thuis', undefined), 'mdi:sofa');
  assert.equal(I(c, null, 'Nacht', undefined), null, 'buttons and list: no suggestion');
  assert.equal(I(c, null, 'Nacht', null), 'mdi:weather-night', 'icons only: suggestion');
  assert.equal(I(c, null, 'Eco', { Eco: 'mdi:sprout' }), 'mdi:sprout', 'integration icon before suggestion');
  assert.equal(I(c, null, 'Bad', null), null, 'invalid own icon ignored');
  assert.equal(I({}, null, 'Vorst', null), null, 'nothing fits: text');
});

test('card renders icons mode, subtitle and hidden header parts', () => {
  assert.match(card, /mode: 'chips', icons: null, subtitle: null, hide_name: false, hide_state: false/);
  assert.match(card, /md === 'icons'/);
  assert.match(card, /aria-label="\$\{lb\}" title="\$\{lb\}"/, 'icon buttons keep the option name');
  assert.match(card, /showN \|\| showS \?/, 'header hidden when both are hidden');
});

test('form: icons only mode, subtitle, hide toggles and icon per option', () => {
  assert.match(edit, /\['icons', hgTLazy\('edit\.modes\.icons_only'\)/);
  for (const k of ['subtitle', 'hide_name', 'hide_state']) assert.match(edit, new RegExp(`k: '${k}'`));
  assert.match(edit, /t: 'opticons'/);
  assert.match(edit, /o\.t === 'opticons' \?/, 'icons map passes through to the card config');
});

test('icon picker registers a function in hgsOpen (the select observer calls every entry)', () => {
  assert.match(edit, /tok = \(\) => \{ if \(!fl\.isConnected\) close\(\); \}; hgsOpen\.add\(tok\);/);
});

test('texts exist in every catalog', () => {
  for (const l of ['en', 'pl', 'fr', 'nl']) {
    const e = JSON.parse(read(`src/locales/${l}.json`)).edit;
    assert.ok(e.modes.icons_only, `${l}: modes.icons_only`);
    for (const k of ['subtitle_current_option', 'hide_title', 'hide_subtitle', 'icon_per_option', 'icon_per_option_hint']) assert.ok(e.options[k], `${l}: options.${k}`);
  }
});
