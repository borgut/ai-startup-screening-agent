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
  function clip(text, words) {
    const clean = String(text || '').replace(/\s+/g, ' ').trim();
    const parts = clean.split(' ');
    return parts.length <= words ? clean : parts.slice(0, words).join(' ').replace(/[,:;]$/, '') + '…';
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
    const signals = verified.slice(0, 3).map(x => clip(x.claim, 18));
    if (signals.length < 3) signals.push(...sentenceList(memo.justificacion, 3 - signals.length).map(x => clip(x, 18)));
    const risks = (memo.red_flags || []).slice(0, 4).map(x => clip(x, 20));
    const conditions = (memo.preguntas || []).slice(0, 4).map(x => clip(x, 22));
    const fit = (memo.encaje || []).slice(0, 4);
    const teamBullet = memo.founder_team ? `${lang === 'es' ? 'Equipo' : 'Team'}: ${clip(memo.founder_team.encaje || memo.founder_team.resumen, 20)}` : '';
    const thesis = [teamBullet, clip(memo.why_now, 18), clip(memo.why_this_company, 18)].filter(Boolean);
    const nextText = reco === 'INVESTIGATE'
      ? (lang === 'es' ? 'Abrir due diligence. No debatir precio hasta cerrar las condiciones.' : 'Open due diligence. Do not discuss price until the conditions are cleared.')
      : reco === 'WATCH'
        ? (lang === 'es' ? 'Revisar cuando haya nueva evidencia de tracción y retención.' : 'Revisit when there is new evidence on traction and retention.')
        : (lang === 'es' ? 'Cerrar salvo cambio material en tesis, tracción o riesgo.' : 'Close unless thesis, traction or risk changes materially.');
    const logo = memo.logo ? `<img class="ic-logo" src="${esc(memo.logo.replace(/(\.[a-z0-9]+)$/i, '-dark$1'))}" data-orig="${esc(memo.logo)}" alt="Logo de ${esc(memo.nombre)}" onerror="if(this.dataset.orig&&this.src.indexOf(this.dataset.orig)===-1){this.src=this.dataset.orig}else{this.style.display='none'}">` : '';
    const shortList = (xs, cls='') => `<ul class="ic-scan-list ${cls}">${xs.map(x => `<li>${esc(x)}</li>`).join('')}</ul>`;
    return `<article class="ic-doc ic-executive">
      <header class="ic-cover">
        <div class="ic-cover-top"><span>${c.kicker}</span><span>${esc(memo.fecha || '')}</span></div>
        <div class="ic-identity">${logo}<div><p>${esc(memo.sector || '')}</p><h1>${esc(memo.nombre)}</h1></div></div>
        <div class="ic-decision-grid">
          <div><div class="ic-label">${c.decision}</div><div class="ic-decision ${statusClass}">${decision}</div></div>
          <div class="ic-score"><strong>${esc(memo.score_global)}<small>%</small></strong><span>${c.score}</span></div>
        </div>
        <div class="ic-at-glance">
          <div><span>${c.confidence}</span><strong>${esc(memo.confianza_global || '—')}</strong></div>
          <div><span>${c.stage}</span><strong>${esc(clip(memo.stage || '—', 8))}</strong></div>
          <div><span>${c.evidence}</span><strong>${verified.length} / ${claims.length}</strong></div>
        </div>
        <p class="ic-source-note">${c.source}</p>
      </header>

      <section class="ic-snapshot">
        <div class="ic-snapshot-head"><span>01</span><h2>${c.thesis}</h2></div>
        ${shortList(thesis, 'ic-thesis-bullets')}
      </section>

      <div class="ic-two-up">
        <section class="ic-panel ic-panel-dark"><div class="ic-panel-head"><span>02</span><h2>${c.signals}</h2></div>${shortList(signals, 'ic-signals')}</section>
        <section class="ic-panel ic-panel-risk"><div class="ic-panel-head"><span>03</span><h2>${c.risks}</h2></div>${shortList(risks, 'ic-risks')}</section>
      </div>

      <section class="ic-snapshot ic-conditions-compact">
        <div class="ic-snapshot-head"><span>04</span><h2>${c.conditions}</h2></div>
        <ul class="ic-checklist">${conditions.map(x => `<li><span></span><p>${esc(x)}</p></li>`).join('')}</ul>
      </section>

      <div class="ic-bottom-grid">
        <section class="ic-fit-compact"><div class="ic-panel-head"><span>05</span><h2>${c.fit}</h2></div>
          <div class="ic-fit-pills">${fit.map(x => `<span class="fit-${esc(x.encaja)}"><b>${x.encaja === 'si' ? '✓' : x.encaja === 'no' ? '×' : '!'}</b>${esc(String(x.criterio || '').split('(')[0].trim())}</span>`).join('')}</div>
          <div class="ic-evidence-strip"><span><b>${verified.length}</b> ${c.verified}</span><span><b>${unverified.length}</b> ${c.unverified}</span><span><b>${contradicted.length}</b> ${c.contradicted}</span></div>
        </section>
        <section class="ic-next-compact"><div class="ic-label">${c.next}</div><p>${nextText}</p></section>
      </div>
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
