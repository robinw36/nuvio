/* Copy and paste of cards between views, rooms and containers (edit mode), and the room block key for added components. */
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const read = (p) => readFileSync(new URL('../../' + p, import.meta.url), 'utf8');
const edit = read('src/parts/hg-edit.part.js');
const room = read('src/parts/cards/room-card.part.js');

/* the block key regex as it is in room-card.part.js */
const keyRe = (() => { const m = room.match(/const m0 = b\.match\((\/\^.*?data-hgk="\(\[\^"\]\+\)"\/)\);/); assert.ok(m, 'block key regex found'); return eval(m[1]); })();

test('room block key: data-hgk right after class', () => {
  assert.equal('<div class="blk" data-hgk="Rolety"><ha-card>'.match(keyRe)[1], 'Rolety');
});

test('room block key: data-hgk after other attributes (added component with style)', () => {
  const html = '<div class="blk" style="align-self:start;--hg-min-h:0px" data-hgk="c:vstack:abc"><div class="hgtl k-card">';
  assert.equal(html.match(keyRe)[1], 'c:vstack:abc');
});

test('room block key: a data-hgk deeper inside the block is not taken', () => {
  assert.equal('<div class="blk"><div class="hgtl" data-hgk="light.x"></div></div>'.match(keyRe), null);
});

test('added component block puts data-hgk before style', () => {
  assert.match(room, /<div class="blk" data-hgk="\$\{H\.esc\(x\.e\)\}" style="align-self:start/);
});

test('copy and paste actions reach the component form handler', () => {
  const m = edit.match(/if \(\/\^\(c\(([^)]*)\)\|/);
  assert.ok(m, 'component action router found');
  for (const a of ['copy', 'paste']) assert.ok(m[1].split('|').includes(a), a);
  assert.match(edit, /a === 'ccopy'/);
  assert.match(edit, /a === 'cpaste'/);
  assert.match(edit, /a === 'cfgcopy'/);
  assert.match(edit, /data-hge="cpaste"/);
});

test('paste respects the container nesting limit', () => {
  assert.match(edit, /kN \+ hgClipDepth\(CC, clip\.v\) <= HG_CONT_MAX/);
});

test('clipboard survives storage errors (private mode)', () => {
  const m = edit.match(/const hgClip = \{[\s\S]*?\} \};/);
  assert.ok(m);
  assert.equal((m[0].match(/try \{/g) || []).length, 2);
});

test('copy and paste texts exist in every catalog', () => {
  for (const l of ['en', 'pl', 'fr', 'nl']) {
    const e = JSON.parse(read(`src/locales/${l}.json`)).edit;
    for (const k of ['copy', 'copy_hint', 'copied_name', 'paste_name', 'paste_hint']) assert.ok(typeof e[k] === 'string' && e[k], `${l}: edit.${k}`);
    assert.match(e.copied_name, /\{name\}/, `${l}: copied_name has {name}`);
    assert.match(e.paste_name, /\{name\}/, `${l}: paste_name has {name}`);
  }
});
