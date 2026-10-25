/* --- wybór opcji: input_select / select --- */
/* ikona opcji: własny wybór w karcie (icons: { opcja: mdi:… }), potem (tylko w trybie ikon) ikona integracji i propozycja wg słowa (nl/en/pl) */
const HG_SEL_GUESS = [[/^(uit|off|none|geen|stop|disabled?|uitgeschakeld|wył|wyłączony)$/, 'mdi:power'], [/^(aan|on|enabled?|ingeschakeld|wł|włączony)$/, 'mdi:power-on'], [/auto/, 'mdi:autorenew'], [/eco|zuinig|besparing|energy.?sav/, 'mdi:leaf'],
  [/comfort/, 'mdi:sofa-outline'], [/boost|turbo|max/, 'mdi:rocket-launch-outline'], [/verwarm|heat|warm/, 'mdi:fire'], [/koel|cool|cold/, 'mdi:snowflake'], [/droog|dry/, 'mdi:water-percent'], [/ventil|fan|wind/, 'mdi:fan'],
  [/thuis|home|aanwezig|^dom$/, 'mdi:home'], [/afwezig|away|weg|vakantie|holiday|vacation/, 'mdi:home-export-outline'], [/nacht|night|slaap|sleep|noc/, 'mdi:weather-night'], [/^(dag|day)$|ochtend|morning/, 'mdi:weather-sunny'], [/avond|evening/, 'mdi:weather-sunset'],
  [/handmatig|manual|manueel/, 'mdi:hand-back-right-outline'], [/schema|schedule|programma|program/, 'mdi:calendar-clock'], [/feest|party/, 'mdi:party-popper'], [/film|movie|tv/, 'mdi:television-classic'], [/lezen|read/, 'mdi:book-open-variant'],
  [/^(laag|low|min)$|zacht|quiet|stil/, 'mdi:speedometer-slow'], [/^(midden|medium|mid|normaal|normal)$/, 'mdi:speedometer-medium'], [/^(hoog|high)$|snel|fast/, 'mdi:speedometer'], [/open/, 'mdi:window-open-variant'], [/dicht|gesloten|closed?/, 'mdi:window-closed-variant']];
const hgSelGuess = (o) => { const t = String(o || '').toLowerCase().trim(); for (const [re, ic] of HG_SEL_GUESS) if (re.test(t)) return ic; return null; };
const hgSelIcon = (c, s, o, haIc) => { const own = c.icons && typeof c.icons === 'object' ? c.icons[o] : null; if (typeof own === 'string' && /^mdi:[a-z0-9-]+$/.test(own)) return own;
  if (haIc === undefined) return null; return (haIc && haIc[o]) || hgSelGuess(o); };
const hgSelHaIc = new Map();
const hgSelHaIcons = (h, e) => { const r = (h.entities || {})[e], tk = r && r.translation_key, pf = r && r.platform, d = String(e).split('.')[0]; if (!tk || !pf || d !== 'select') return Promise.resolve(null);
  if (!hgSelHaIc.has(pf)) hgSelHaIc.set(pf, h.callWS({ type: 'frontend/get_icons', category: 'entity', integration: pf }).catch(() => null));
  return hgSelHaIc.get(pf).then((res) => { const m = res && res.resources && res.resources[pf] && res.resources[pf][d] && res.resources[pf][d][tk]; return (m && m.state) || null; }); };
class HGSelectCard extends HGBase {
  defaults() { return { entity: null, name: null, icon: null, mode: 'chips', icons: null, subtitle: null, hide_name: false, hide_state: false }; }
  ents() { return [this._config.entity]; }
  _extraSig() { return [this._pend, !!this._haIc]; }
  css() { return HG_GEN_CSS + U(`
ha-card.glass{ display:flex; flex-direction:column; gap:12px; padding:16px; overflow:auto; }
.gops{ display:flex; flex-wrap:wrap; gap:8px; } .list .gops{ flex-direction:column; flex-wrap:nowrap; gap:4px; }
.list .gb{ height:44px; justify-content:flex-start; padding:0 14px; border-radius:12px; } .list .gb .ck{ margin-left:auto; } .gb:not([aria-pressed=true]) .ck{ display:none; }
.icons .gops{ gap:10px; } .icons .gb.r{ width:48px; height:48px; } .icons .gb.r ha-icon{ width:24px; height:24px; --mdc-icon-size:24px; }
.icons .gb.tx{ height:48px; padding:0 14px; border-radius:24px; }   /* opcja bez ikony: tekst, nigdy pusty przycisk */
.gb .oi{ flex:none; } .list .gb .oi{ margin-right:2px; }
`); }
  render() { const c = this._config, h = this._hass, s = H.st(h, c.entity), nm = c.name || H.name(h, c.entity);
    if (!s) return `<ha-card class="glass"><div class="ph"><b>${hgT('common.choose_entity')}</b>${hgT('cards.select.input_select_or_select')}</div></ha-card>`;
    const ok = H.ok(s), cur = this._pend ?? s.state, ic = c.icon || s.attributes.icon || 'mdi:format-list-bulleted-square', md = c.mode === 'list' || c.mode === 'icons' ? c.mode : 'chips';
    const sub = ok ? (c.subtitle ? String(c.subtitle) : cur) : hgT('common.state_unavailable'), showN = !c.hide_name, showS = !c.hide_state;
    const ops = (s.attributes.options || []).map((o) => { const oi = hgSelIcon(c, s, o, md === 'icons' ? this._haIc || null : undefined), lb = H.esc(o), on = o === cur;
      if (md === 'icons') return oi ? `<button class="gb r" data-act="opt" data-o="${lb}" aria-pressed="${on}" aria-label="${lb}" title="${lb}" ${ok ? '' : 'disabled'}>${H.icon(oi)}</button>`
        : `<button class="gb tx" data-act="opt" data-o="${lb}" aria-pressed="${on}" ${ok ? '' : 'disabled'}>${lb}</button>`;
      return `<button class="gb" data-act="opt" data-o="${lb}" aria-pressed="${on}" ${ok ? '' : 'disabled'}>${oi ? H.icon(oi, 'oi') : ''}${lb}${md === 'list' ? H.icon('mdi:check', 'ck') : ''}</button>`; }).join('');
    /* tytuł i podtytuł ukrywane osobno; bez obu znika cały nagłówek (także ikona) */
    const head = showN || showS ? `<div class="gh"><span class="gic on">${H.icon(ic)}</span><span class="gn">${showN ? `<b>${H.esc(nm)}</b>` : ''}${showS ? `<small>${H.esc(sub)}</small>` : ''}</span></div>` : '';
    return `<ha-card class="glass ${md === 'chips' ? '' : md} ${ok ? '' : 'un'}">${head}
      <div class="gops" role="radiogroup" aria-label="${H.esc(nm)}">${ops}</div></ha-card>`; }
  /* ikony stanów z integracji (select z translation_key); input_select ich nie ma */
  afterRender() { const c = this._config, h = this._hass; if (!c || c.mode !== 'icons' || this._haIcK === c.entity || !h || !h.callWS) return; this._haIcK = c.entity;
    hgSelHaIcons(h, c.entity).then((m) => { if (m && this._config && this._config.entity === c.entity) { this._haIc = m; this.rerender(); } }); }
  onAct(a, t) { if (a !== 'opt') return; const e = this._config.entity; this._pend = t.dataset.o; clearTimeout(this._pt); this._pt = setTimeout(() => { this._pend = null; this.rerender(); }, 3000);
    H.call(this._hass, hgDom(e), 'select_option', { entity_id: e, option: t.dataset.o }); this.rerender(); }
  set hass(h) { const o = this._hass; this._hass = h; if (this._pend != null && o && this._config) { const a = H.st(h, this._config.entity), b = H.st(o, this._config.entity); if (a && b && a.state !== b.state) this._pend = null; } this._update(); }
  get hass() { return this._hass; }
  getGridOptions() { return { columns: 6, rows: 2 }; }
}
hgReg('hg-select-card', HGSelectCard, hgTLazy('cards.select.picker_name'), hgTLazy('cards.select.picker_description'));
