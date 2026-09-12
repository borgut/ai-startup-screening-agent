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
  const score = Math.max(0, Math.min(100, Number(memo.score_global) || 0));
  box.innerHTML = `
    <div class="page page-left">
      <div class="pg-kicker">${t('memo_de')} · ${esc(memo.fecha || '')}</div>
      ${memo.logo ? `<img class="pg-logo" src="${esc(memo.logo)}" alt="" onerror="this.style.display='none'"/>` : ''}
      <h3 class="pg-name">${esc(memo.nombre)}</h3>
      <div class="pg-score-row"><span class="pg-score">${score}<span class="pg-pct">%</span></span><span class="pg-verdict">${RECO_LABEL[reco] || esc(reco)}</span></div>
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

async function loadExamples() {
  try {
    const res = await fetch('/api/examples?lang=' + getLang());
    const data = await res.json();
    const list = $('#examples-list');
    list.innerHTML = data.examples.map((e, i) => {
      const badgeClass = { INVESTIGATE: 'badge-investigate', WATCH: 'badge-watch', PASS: 'badge-pass' }[e.recomendacion] || 'badge-watch';
      const logo = e.logo ? `<img class="ed-logo" src="${esc(e.logo)}" alt="" loading="lazy" onerror="this.style.display='none'"/>` : '';
      return `<div class="edition" data-id="${esc(e.id)}">
        <span class="ed-num">${String(i + 1).padStart(2, '0')}</span>
        ${logo}
        <div class="ed-body">
          <h3>${esc(e.nombre)}</h3>
          <p>${esc(e.sector)}</p>
          <span class="badge ${badgeClass}">${RECO_LABEL[e.recomendacion] || esc(e.recomendacion)}</span>
        </div>
        <span class="ed-score">${esc(e.score_global)}<span class="ed-pct">%</span></span>
      </div>`;
    }).join('');
    list.querySelectorAll('.edition').forEach((card) => {
      card.addEventListener('click', async () => {
        const res2 = await fetch(`/api/memo/${card.dataset.id}?lang=${getLang()}`);
        const data2 = await res2.json();
        if (data2.memo) showMemo(data2.memo);
      });
    });
  } catch {
    $('#examples-list').innerHTML = '<p class="muted">' + t('err_ejemplos') + '</p>';
  }
}

async function checkStatus() {
  try {
    const res = await fetch('/api/status');
    const data = await res.json();
    if (!data.api_key_configured) {
      $('#form-note').textContent = t('form_note');
    }
  } catch { /* silencioso */ }
}

// Dropzone del deck: click abre el selector, arrastrar suelta el PDF.
(() => {
  const dz = $('#dropzone');
  const deckInput = $('#deck');
  const dropFile = $('#drop-file');
  if (!dz || !deckInput) return;
  const showName = () => {
    if (deckInput.files && deckInput.files.length) {
      dropFile.textContent = deckInput.files[0].name;
      dropFile.classList.remove('hidden');
      dz.classList.add('dz-has-file');
    }
  };
  dz.addEventListener('click', () => deckInput.click());
  dz.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); deckInput.click(); } });
  deckInput.addEventListener('change', showName);
  ['dragover', 'dragenter'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.add('dz-over'); }));
  ['dragleave', 'drop'].forEach((ev) => dz.addEventListener(ev, (e) => { e.preventDefault(); dz.classList.remove('dz-over'); }));
  dz.addEventListener('drop', (e) => {
    if (e.dataTransfer.files && e.dataTransfer.files.length) { deckInput.files = e.dataTransfer.files; showName(); }
  });
})();

$('#screen-form').addEventListener('submit', async (ev) => {
  ev.preventDefault();
  const btn = $('#submit-btn');
  const note = $('#form-note');
  note.classList.remove('error');
  note.textContent = '';
  btn.disabled = true;
  $('#memo-container').classList.add('hidden');
  $('#loading').classList.remove('hidden');
  $('#loading').scrollIntoView({ behavior: 'smooth' });

  const fd = new FormData();
  fd.append('url', $('#url').value.trim());
  fd.append('linkedin', $('#linkedin').value.trim());
  fd.append('context', $('#context').value.trim());
  const deckFile = $('#deck').files[0];
  if (deckFile) fd.append('deck', deckFile);

  try {
    const res = await fetch('/api/screen', { method: 'POST', body: fd });
    const data = await res.json();
    if (!res.ok) {
      $('#loading').classList.add('hidden');
      note.classList.add('error');
      note.textContent = data.error || t('err_desconocido');
    } else {
      showMemo(data.memo);
    }
  } catch (err) {
    $('#loading').classList.add('hidden');
    note.classList.add('error');
    note.textContent = t('err_red') + err.message;
  } finally {
    btn.disabled = false;
  }
});

document.querySelectorAll('.lang-btn').forEach((b) => b.addEventListener('click', () => setLang(b.dataset.lang)));
applyI18n();
loadDossier();
loadExamples();
checkStatus();
