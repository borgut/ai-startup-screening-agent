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

const RECO_LABEL = { INVESTIGATE: '🟢 INVESTIGATE', WATCH: '🟡 WATCH', PASS: '🔴 PASS' };
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
  container.innerHTML = `<span class="back-link" id="back-link">&larr; Volver al formulario</span>` + renderMemoHTML(memo);
  container.classList.remove('hidden');
  $('#loading').classList.add('hidden');
  container.scrollIntoView({ behavior: 'smooth' });
  $('#back-link').addEventListener('click', () => {
    container.classList.add('hidden');
    $('#form-card').scrollIntoView({ behavior: 'smooth' });
  });
}

async function loadExamples() {
  try {
    const res = await fetch('/api/examples');
    const data = await res.json();
    const list = $('#examples-list');
    list.innerHTML = data.examples.map((e) => {
      const badgeClass = { INVESTIGATE: 'badge-investigate', WATCH: 'badge-watch', PASS: 'badge-pass' }[e.recomendacion] || 'badge-watch';
      const logo = e.logo ? `<img class="card-logo" src="${esc(e.logo)}" alt="Logo de ${esc(e.nombre)}" loading="lazy" onerror="this.style.display='none'"/>` : '';
      return `<div class="example-card" data-id="${esc(e.id)}">
        ${logo}
        <h3>${esc(e.nombre)}</h3>
        <p>${esc(e.sector)} · Score ${esc(e.score_global)}/100</p>
        <span class="badge ${badgeClass}">${RECO_LABEL[e.recomendacion] || esc(e.recomendacion)}</span>
      </div>`;
    }).join('');
    list.querySelectorAll('.example-card').forEach((card) => {
      card.addEventListener('click', async () => {
        const res2 = await fetch(`/api/memo/${card.dataset.id}`);
        const data2 = await res2.json();
        if (data2.memo) showMemo(data2.memo);
      });
    });
  } catch {
    $('#examples-list').innerHTML = '<p class="muted">No se pudieron cargar los ejemplos.</p>';
  }
}

async function checkStatus() {
  try {
    const res = await fetch('/api/status');
    const data = await res.json();
    if (!data.api_key_configured) {
      $('#form-note').textContent = 'El análisis al momento está en pausa. Mientras tanto, los ejemplos de abajo están siempre disponibles.';
    }
  } catch { /* silencioso */ }
}

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
      note.textContent = data.error || 'Error desconocido.';
    } else {
      showMemo(data.memo);
    }
  } catch (err) {
    $('#loading').classList.add('hidden');
    note.classList.add('error');
    note.textContent = 'Error de red o del servidor: ' + err.message;
  } finally {
    btn.disabled = false;
  }
});

loadExamples();
checkStatus();
