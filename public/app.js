// Variante visual: ?tema=ink | poster (lino editorial por defecto)
(() => {
  const tema = new URLSearchParams(location.search).get('tema');
  if (tema) {
    const t = tema.replace(/[^a-z-]/g, '');
    document.body.classList.remove('theme-poster', 'poster-ox', 'theme-ink');
    if (t === 'poster-ox') { document.body.classList.add('theme-poster', 'poster-ox'); }
    else if (t !== 'poster') { document.body.classList.add('theme-' + t); }
    else { document.body.classList.add('theme-poster'); }
  }
})();



const $ = (sel) => document.querySelector(sel);

const RECO_LABEL = { INVESTIGATE: '<span class="vdot vdot-inv"></span>INVESTIGATE', WATCH: '<span class="vdot vdot-watch"></span>WATCH', PASS: '<span class="vdot vdot-pass"></span>PASS' };
const ESTADO_LABEL = { verificada: '✅ verificada', no_verificada: '⚠️ no verificada', contradicha: '❌ contradicha' };
const ENCAJE_LABEL = { si: '✅', parcial: '⚠️', no: '❌' };

function esc(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));
}

function linkify(url) {
  if (!url || url === 'sin datos') return 'sin datos';
  if (/^https?:\/\//i.test(url)) return `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(url)}</a>`;
  return esc(url);
}


function showMemo(memo) {
  const container = $('#memo-container');
  container.innerHTML = `<span class="back-link" id="back-link">${t('volver_form')}</span>` + renderMemoHTML(memo);
  container.classList.remove('hidden');
  $('#loading').classList.add('hidden');
  if (window.animateGauges) animateGauges(container);
  container.scrollIntoView({ behavior: 'smooth' });
  $('#back-link').addEventListener('click', () => {
    container.classList.add('hidden');
    $('.masthead').scrollIntoView({ behavior: 'smooth' });
  });
}


// Dossier: doble página con extracto real del memo Vidext.
function renderDossier(memo) {
  const box = $('#dossier-content');
  if (!box || !window.gaugeSVG) return;
  const reco = memo.recomendacion || 'WATCH';
  const ESTADO_TXT = { verificada: '✓ ' + t('st_verificada'), no_verificada: '⚠ ' + t('st_no_verificada'), contradicha: '✗ ' + t('st_contradicha') };
  const claims = (memo.claims || []).slice(0, 3);
  const fuentes = (memo.fuentes_utilizadas || []).slice(0, 4);
  const full = String(memo.resumen_ejecutivo || '');
  const sum = full.length > 430 ? esc(full.slice(0, 430).replace(/\s+\S*$/, '') + '…') : esc(full);
  box.innerHTML = `
    <div class="page page-left">
      <div class="pg-kicker">${t('memo_de')} · ${esc(memo.fecha || '')}</div>
      ${memo.logo ? `<img class="pg-logo" src="${esc(memo.logo.replace(/(\.[a-z0-9]+)$/i, '-dark$1'))}" data-orig="${esc(memo.logo)}" alt="" onerror="if(this.dataset.orig&&this.src.indexOf(this.dataset.orig)===-1){this.src=this.dataset.orig}else{this.style.display='none'}"/>` : ''}
      <h3 class="pg-name">${esc(memo.nombre)}</h3>
      <div class="pg-score-row"><span class="pg-verdict">${RECO_LABEL[reco] || esc(reco)}</span></div>
      <p class="pg-sum">${sum}</p>
    </div>
    <div class="spread-divider"></div>
    <div class="page page-right">
      <p class="pg-label">${t('sec_claims')} <span class="pg-label-note">· ${t('dossier_extracto')}</span></p>
      <ul class="pg-claims">
        ${claims.map((c) => `<li><span class="estado-chip st-${esc(c.estado)}">${ESTADO_TXT[c.estado] || esc(c.estado)}</span> ${esc(c.claim)}</li>`).join('')}
      </ul>
      <p class="pg-label">${t('sec_fuentes')}</p>
      <ol class="src-list pg-src">${fuentes.map((f) => `<li>${linkify(f)}</li>`).join('')}</ol>
    </div>`;
}

async function loadDossier() {
  try {
    const res = await fetch('/api/memo/vidext?lang=' + getLang());
    const data = await res.json();
    if (data.memo) renderDossier(data.memo);
  } catch { /* sin dossier si falla */ }
}

// Últimas ediciones: se cargan una vez y la búsqueda/filtros/orden van en cliente
// (la base es pequeña; respuesta instantánea). El servidor ya devuelve dedupe por URL y fecha desc.
const edParams = new URLSearchParams(location.search);
const edState = { q: edParams.get('ed_q') || '', v: edParams.get('ed_v') || '', s: edParams.get('ed_s') || 'fecha' };
let edData = [];

function renderExamples() {
  const list = $('#examples-list');
  const q = edState.q.trim().toLowerCase();
  let rows = edData.filter((e) => {
    if (edState.v && e.recomendacion !== edState.v) return false;
    if (q && !(`${e.nombre} ${e.sector}`.toLowerCase().includes(q))) return false;
    return true;
  });
  if (!rows.length) {
    list.innerHTML = '<p class="muted ed-empty">' + t('ed_sin_resultados') + '</p>';
    return;
  }
  list.innerHTML = rows.map((e, i) => {
    const badgeClass = { INVESTIGATE: 'badge-investigate', WATCH: 'badge-watch', PASS: 'badge-pass' }[e.recomendacion] || 'badge-watch';
    const darkLogo = e.logo && e.logo.startsWith('/logos/') ? e.logo.replace(/(\.[a-z0-9]+)$/i, '-dark$1') : e.logo;
    const logo = darkLogo ? `<img class="ed-logo" src="${esc(darkLogo)}" alt="" loading="lazy" onerror="this.onerror=null;this.src='${esc(e.logo)}'"/>` : '';
    const tags = String(e.sector || '').split('/').map((x) => x.trim().replace(/\s*\(.*\)\s*$/, '')).filter(Boolean)
      .map((x) => `<span class="pill ed-tag">${esc(x)}</span>`).join('');
    return `<div class="edition" data-id="${esc(e.id)}">
      <span class="ed-num">${String(i + 1).padStart(2, '0')}</span>
      ${logo}
      <div class="ed-body">
        <h3>${esc(e.nombre)}</h3>
        <div class="ed-tags">${tags}<span class="pill badge ${badgeClass}">${RECO_LABEL[e.recomendacion] || esc(e.recomendacion)}</span></div>
      </div>

    </div>`;
  }).join('');
  list.querySelectorAll('.edition').forEach((card) => {
    card.addEventListener('click', async () => {
      const res2 = await fetch(`/api/memo/${card.dataset.id}?lang=${getLang()}`);
      const data2 = await res2.json();
      if (data2.memo) showMemo(data2.memo);
    });
  });
}

async function loadExamples() {
  try {
    const res = await fetch('/api/examples?lang=' + getLang());
    const data = await res.json();
    edData = data.examples || [];
    renderExamples();
  } catch {
    $('#examples-list').innerHTML = '<p class="muted">' + t('err_ejemplos') + '</p>';
  }
}

// Controles de búsqueda, filtro por veredicto y orden.
(() => {
  const search = $('#ed-search');
  if (search) {
    search.value = edState.q;
    search.addEventListener('input', () => { edState.q = search.value; renderExamples(); });
  }
  document.querySelectorAll('#ed-filters .ed-filter').forEach((x) => x.classList.toggle('is-on', x.dataset.v === edState.v));
  document.querySelectorAll('#ed-sorts .ed-sort').forEach((x) => x.classList.toggle('is-on', x.dataset.s === edState.s));
  document.querySelectorAll('#ed-filters .ed-filter').forEach((b) => b.addEventListener('click', () => {
    edState.v = b.dataset.v;
    document.querySelectorAll('#ed-filters .ed-filter').forEach((x) => x.classList.toggle('is-on', x === b));
    renderExamples();
  }));
  document.querySelectorAll('#ed-sorts .ed-sort').forEach((b) => b.addEventListener('click', () => {
    edState.s = b.dataset.s;
    document.querySelectorAll('#ed-sorts .ed-sort').forEach((x) => x.classList.toggle('is-on', x === b));
    renderExamples();
  }));
})();

// Radar early-stage: cada fila es una señal pública con fecha y fuente.
// Fuentes: /api/radar (ATS early + Get on Board + Product Hunt + dealflow curado)
// y screens ya publicados (/api/examples + /api/memo/:id para la fecha).
(async function loadRadar() {
  const list = document.getElementById('radar-list');
  if (!list) return;
  const rows = [];
  const fmt = (d) => d.toLocaleDateString(getLang() === 'en' ? 'en-GB' : 'es-ES', { day: 'numeric', month: 'short', year: 'numeric' });

  // Senales tempranas: fichajes, lanzamientos y rondas pre-seed/seed (servidor, fuentes publicas)
  try {
    const r = await fetch('/api/radar');
    const d = await r.json();
    (d.signals || []).forEach((s) => {
      let desc = '';
      if (s.type === 'hiring' && s.kind === 'ats') desc = t('hiring_ats').replace('{n}', s.jobs).replace('{t}', s.last || '');
      else if (s.type === 'hiring') desc = t('hiring_job').replace('{t}', s.last || '');
      else if (s.type === 'launch') desc = s.tagline || '';
      else if (s.type === 'round') desc = [s.stage, s.round, s.city].filter(Boolean).join(' · ');
      if (s.source) desc = desc ? desc + ' · ' + s.source : s.source;
      rows.push({ date: s.date ? new Date(s.date) : new Date(0), tag: s.type, co: s.name, desc, href: s.url || '', go: t('radar_src') });
    });
  } catch { /* sin senales tempranas */ }

  // Screens publicados (fecha real del memo)
  try {
    const r = await fetch('/api/examples?lang=' + getLang());
    const d = await r.json();
    const det = await Promise.all((d.examples || []).map((e) =>
      fetch('/api/memo/' + e.id + '?lang=' + getLang()).then((x) => x.json()).then((m) => ({ e, memo: m.memo })).catch(() => null)));
    det.forEach((x) => {
      if (!x || !x.memo) return;
      rows.push({ date: x.memo.fecha ? new Date(x.memo.fecha + 'T00:00:00') : new Date(0), tag: 'memo', co: x.memo.nombre, desc: x.memo.sector || '', href: '/memo/' + x.e.id, go: t('radar_memo') });
    });
  } catch { /* sin screens */ }

  rows.sort((p, q) => q.date - p.date);
  if (!rows.length) { list.innerHTML = '<p class="muted">' + esc(t('radar_empty')) + '</p>'; return; }
  const TAGS = { round: t('tag_ronda'), hiring: t('tag_hiring'), launch: t('tag_launch'), memo: t('tag_memo') };
  list.innerHTML = rows.map((r) => {
    const ext = /^https?:/.test(r.href || '');
    const dateTxt = r.date.getTime() ? fmt(r.date) : '';
    return '<a class="radar-row" href="' + esc(r.href) + '"' + (ext ? ' target="_blank" rel="noopener"' : '') + '>'
      + '<span class="r-date">' + esc(dateTxt) + '</span>'
      + '<span class="r-tag">' + esc(TAGS[r.tag] || r.tag) + '</span>'
      + '<span class="r-co">' + esc(r.co) + '</span>'
      + '<span class="r-desc">' + esc(r.desc) + '</span>'
      + '<span class="r-go">' + esc(r.go) + '</span></a>';
  }).join('');
})();

// Casos completos: senal temprana -> analisis -> veredicto (datos de next10-data.json)
(async function loadCasos() {
  const el = document.getElementById('casos-list');
  if (!el) return;
  try {
    const d = await (await fetch('/next10-data.json')).json();
    const byId = {};
    (d.companies || []).forEach((c) => { byId[c.id] = c; });
    const ids = ['spherag', 'clevergy', 'dcycle'];
    el.innerHTML = ids.map((id) => {
      const c = byId[id];
      if (!c) return '';
      const senal = t('caso_' + id + '_senal');
      return '<div class="caso">'
        + '<div class="caso-head"><span class="caso-co">' + esc(c.name) + '</span>'
        + '<span class="caso-meta">' + esc([c.vertical, c.city].filter(Boolean).join(' · ')) + '</span>'
        + '<span class="caso-verdict">' + esc(c.status) + '</span></div>'
        + '<p class="caso-chain"><b>' + esc(t('caso_senal')) + '</b> ' + esc(senal)
        + ' &rarr; <b>' + esc(t('caso_analisis')) + '</b> ' + esc(c.why || '')
        + ' &rarr; <a href="/next-10">' + esc(t('caso_ver')) + '</a></p></div>';
    }).join('');
  } catch { /* sin casos */ }
})();

async function loadStats() {
  const el = document.getElementById('stats-strip');
  if (!el) return;
  try {
    const res = await fetch('/api/stats');
    const s = await res.json();
    if (!s.ok) return;
    el.innerHTML = [[s.memos, t('stat_memos')], [s.claims, t('stat_claims')], [s.fuentes, t('stat_fuentes')]]
      .map(([n, l]) => `<div><strong>${n}</strong><span>${l}</span></div>`).join('');
  } catch {}
}
loadStats();

async function checkStatus() {
  try {
    const res = await fetch('/api/status');
    const data = await res.json();
    if (!data.api_key_configured) {
      const fn = $('#form-note'); if (fn) fn.textContent = t('form_note');
    }
  } catch { /* silencioso */ }
}

document.querySelectorAll('.lang-btn').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
applyI18n();
loadDossier();
loadExamples();
checkStatus();
