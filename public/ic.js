(function () {
  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  const copy = {
    es: {
      back: '&larr; Volver al screening', print: 'Imprimir / PDF', loading: 'Preparando memo de comité...',
      kicker: 'INVESTMENT COMMITTEE · BORRADOR', decision: 'Decisión propuesta', investigate: 'AVANZAR A DUE DILIGENCE', watch: 'MANTENER EN OBSERVACIÓN', pass: 'NO AVANZAR',
      source: 'Construido a partir del memo de screening y sus fuentes. No añade supuestos nuevos.', thesis: 'Tesis de inversión',
      whyNow: 'Por qué ahora', whyCo: 'Por qué esta empresa', signals: 'Señales que sostienen la tesis', risks: 'Riesgos que pueden romperla',
      conditions: 'Condiciones antes de comprometer capital', conditionsNote: 'Puntos que deben quedar resueltos en due diligence o en la siguiente reunión.',
      fit: 'Encaje y contexto de la operación', score: 'Score de screening', confidence: 'Confianza', stage: 'Etapa', sector: 'Sector', geography: 'Geografía',
      next: 'Siguiente paso recomendado', dd: 'Llevar estas preguntas a la siguiente reunión', evidence: 'Base de evidencia', verified: 'verificados', unverified: 'sin verificar', contradicted: 'contradichos',
      footer: 'Documento de trabajo para discusión interna. No constituye una recomendación de inversión.'
    },
    en: {
      back: '&larr; Back to screening', print: 'Print / PDF', loading: 'Preparing committee memo...',
      kicker: 'INVESTMENT COMMITTEE · DRAFT', decision: 'Proposed decision', investigate: 'PROCEED TO DUE DILIGENCE', watch: 'KEEP ON WATCHLIST', pass: 'DO NOT PROCEED',
      source: 'Built from the screening memo and its sources. No new assumptions added.', thesis: 'Investment thesis',
      whyNow: 'Why now', whyCo: 'Why this company', signals: 'Signals supporting the thesis', risks: 'Risks that could break it',
      conditions: 'Conditions before committing capital', conditionsNote: 'Items to resolve in due diligence or the next meeting.',
      fit: 'Deal fit and context', score: 'Screening score', confidence: 'Confidence', stage: 'Stage', sector: 'Sector', geography: 'Geography',
      next: 'Recommended next step', dd: 'Take these questions to the next meeting', evidence: 'Evidence base', verified: 'verified', unverified: 'unverified', contradicted: 'contradicted',
      footer: 'Working document for internal discussion. This is not an investment recommendation.'
    }
  };
  function sentenceList(text, max) {
    return String(text || '').split(/(?<=[.!?])\s+/).map(x => x.trim()).filter(Boolean).slice(0, max);
  }
  function render(memo, lang) {
    const c = copy[lang];
    const reco = memo.recomendacion || 'WATCH';
    const decision = reco === 'INVESTIGATE' ? c.investigate : reco === 'PASS' ? c.pass : c.watch;
    const statusClass = reco === 'INVESTIGATE' ? 'ic-go' : reco === 'PASS' ? 'ic-stop' : 'ic-hold';
    const claims = memo.claims || [];
    const verified = claims.filter(x => x.estado === 'verificada');
    const unverified = claims.filter(x => x.estado === 'no_verificada');
    const contradicted = claims.filter(x => x.estado === 'contradicha');
    const signals = verified.slice(0, 4).map(x => x.claim);
    if (signals.length < 3) signals.push(...sentenceList(memo.justificacion, 3 - signals.length));
    const risks = (memo.red_flags || []).slice(0, 5);
    const conditions = (memo.preguntas || []).slice(0, 5);
    const fit = (memo.encaje || []).slice(0, 5);
    const nextText = reco === 'INVESTIGATE'
      ? (lang === 'es' ? 'Abrir due diligence enfocada en las condiciones de abajo antes de debatir precio o términos.' : 'Open due diligence focused on the conditions below before discussing price or terms.')
      : reco === 'WATCH'
        ? (lang === 'es' ? 'Mantener contacto y reabrir el caso cuando haya evidencia nueva sobre tracción, retención o ronda.' : 'Stay in touch and reopen the case when new evidence emerges on traction, retention or the round.')
        : (lang === 'es' ? 'Cerrar el caso salvo que cambie de forma material la tesis, la tracción o el riesgo principal.' : 'Close the case unless the thesis, traction or main risk changes materially.');
    const logo = memo.logo ? `<img class="ic-logo" src="${esc(memo.logo.replace(/(\.[a-z0-9]+)$/i, '-dark$1'))}" data-orig="${esc(memo.logo)}" alt="Logo de ${esc(memo.nombre)}" onerror="if(this.dataset.orig&&this.src.indexOf(this.dataset.orig)===-1){this.src=this.dataset.orig}else{this.style.display='none'}">` : '';
    const list = (xs, cls='') => `<ul class="ic-list ${cls}">${xs.map((x,i) => `<li><span>${String(i+1).padStart(2,'0')}</span><p>${esc(x)}</p></li>`).join('')}</ul>`;
    return `<article class="ic-doc">
      <header class="ic-cover">
        <div class="ic-cover-top"><span>${c.kicker}</span><span>${esc(memo.fecha || '')}</span></div>
        <div class="ic-identity">${logo}<div><p>${esc(memo.sector || '')}</p><h1>${esc(memo.nombre)}</h1></div></div>
        <div class="ic-decision-grid">
          <div><div class="ic-label">${c.decision}</div><div class="ic-decision ${statusClass}">${decision}</div></div>
          <div class="ic-score"><strong>${esc(memo.score_global)}<small>%</small></strong><span>${c.score}</span></div>
        </div>
        <p class="ic-stance">${esc(memo.justificacion || memo.resumen_ejecutivo || '')}</p>
        <div class="ic-tags"><span>${c.confidence}: ${esc(memo.confianza_global || '—')}</span><span>${c.stage}: ${esc(memo.stage || '—')}</span><span>${c.geography}: ${esc(memo.geografia || '—')}</span></div>
        <p class="ic-source-note">${c.source}</p>
      </header>

      <section class="ic-section ic-thesis">
        <div class="ic-section-no">01</div><div class="ic-section-body"><h2>${c.thesis}</h2>
        <p class="ic-exec">${esc(memo.resumen_ejecutivo || '')}</p>
        <div class="ic-split"><div><h3>${c.whyNow}</h3><p>${esc(memo.why_now || '')}</p></div><div><h3>${c.whyCo}</h3><p>${esc(memo.why_this_company || '')}</p></div></div></div>
      </section>

      <section class="ic-section ic-dark-section">
        <div class="ic-section-no">02</div><div class="ic-section-body"><h2>${c.signals}</h2>${list(signals, 'ic-signals')}</div>
      </section>

      <section class="ic-section">
        <div class="ic-section-no">03</div><div class="ic-section-body"><h2>${c.risks}</h2>${list(risks, 'ic-risks')}</div>
      </section>

      <section class="ic-section ic-conditions">
        <div class="ic-section-no">04</div><div class="ic-section-body"><h2>${c.conditions}</h2><p class="ic-intro">${c.conditionsNote}</p>${list(conditions, 'ic-checks')}</div>
      </section>

      <section class="ic-section">
        <div class="ic-section-no">05</div><div class="ic-section-body"><h2>${c.fit}</h2>
        <div class="ic-fit">${fit.map(x => `<div><span class="ic-fit-state fit-${esc(x.encaja)}">${x.encaja === 'si' ? '✓' : x.encaja === 'no' ? '×' : '!'}</span><p><strong>${esc(String(x.criterio || '').split('(')[0].trim())}</strong>${esc(x.detalle || '')}</p></div>`).join('')}</div>
        <div class="ic-evidence"><div><strong>${verified.length}</strong><span>${c.verified}</span></div><div><strong>${unverified.length}</strong><span>${c.unverified}</span></div><div><strong>${contradicted.length}</strong><span>${c.contradicted}</span></div></div>
        </div>
      </section>

      <section class="ic-section ic-next"><div class="ic-section-no">06</div><div class="ic-section-body"><h2>${c.next}</h2><p class="ic-next-call">${nextText}</p><h3>${c.dd}</h3>${list(conditions, 'ic-questions')}</div></section>
      <footer class="ic-footer"><span>Startup Scouting.</span><span>${c.footer}</span></footer>
    </article>`;
  }
  async function load() {
    const id = location.pathname.split('/').pop();
    const lang = new URLSearchParams(location.search).get('lang') === 'en' ? 'en' : (getLang() || 'es');
    localStorage.setItem('ss-lang', lang);
    document.documentElement.lang = lang;
    document.querySelectorAll('.lang-btn').forEach(b => b.classList.toggle('lang-on', b.dataset.lang === lang));
    const c = copy[lang];
    document.getElementById('screen-link').href = '/memo/' + encodeURIComponent(id) + '?lang=' + lang;
    document.getElementById('screen-link').innerHTML = c.back;
    document.querySelector('.ic-print').textContent = c.print;
    document.querySelector('.ic-loading').textContent = c.loading;
    document.querySelectorAll('.lang-btn').forEach(b => b.addEventListener('click', () => { location.search = '?lang=' + b.dataset.lang; }));
    const box = document.getElementById('ic-container');
    try {
      const res = await fetch('/api/memo/' + encodeURIComponent(id) + '?lang=' + lang);
      const data = await res.json();
      if (!res.ok || !data.memo) throw new Error(data.error || 'Memo not found');
      box.innerHTML = render(data.memo, lang);
      document.title = 'IC: ' + data.memo.nombre + ' · Startup Scouting';
    } catch (e) { box.innerHTML = '<p class="form-note error ic-loading">' + esc(e.message || e) + '</p>'; }
  }
  load();
})();
