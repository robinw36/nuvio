/* Air conditioning card: hide_modes hides the power and mode buttons (full and compact), the menu stays. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL('../../' + p, import.meta.url), 'utf8');
const ac = read('src/parts/cards/ac-card.part.js');
const edit = read('src/parts/hg-edit.part.js');

test('hide_modes is off by default', () => { assert.match(ac, /compact: false, hide_modes: false,/); });

test('full card: no mode row when hidden', () => { assert.match(ac, /\$\{c\.hide_modes \? '' : `<div class="mw"><div class="mr top">/); });

test('compact card: menu button stays when hidden', () => { assert.match(ac, /c\.hide_modes \? `<div class="c2" style="justify-content:flex-end">\$\{kb\}<\/div>`/); });

test('switch in the form of Air conditioning (card)', () => { assert.match(edit, /\{ k: 'hide_modes', t: 'bool', l: hgTLazy\('edit\.options\.hide_mode_buttons'\) \}/); });

test('text in every catalog', () => {
  for (const l of ['en', 'pl', 'fr', 'nl']) assert.ok(JSON.parse(read(`src/locales/${l}.json`)).edit.options.hide_mode_buttons, l);
});
