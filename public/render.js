// Renderizado del memo: formato IC one-pager / dashboard ejecutivo.
// Autocontenido (IIFE) - usado por la landing (app.js) y las páginas /memo/:id.
(function () {
  const RECO_LABEL = { INVESTIGATE: 'INVESTIGATE', WATCH: 'WATCH', PASS: 'PASS' };
  const RECO_ICON = { INVESTIGATE: '🟢', WATCH: '🟡', PASS: '🔴' };
  const ESTADO_LABEL = { verificada: '✓ verificada', no_verificada: '⚠ no verificada', contradicha: '✗ contradicho' };
  const ENCAJE_ICON = { si: '✓', parcial: '!', no: '✗' };

  function esc(s) {
    return String(s ?? '').replace(/[&<>"']/g, (c) => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
    }[c]));
  }

  function linkify(url) {
    if (!url || url === 'sin datos') return '<span class="snd">sin datos</span>';
    if (/^https?:\/\//i.test(url)) {
      let short = url.replace(/^https?:\/\//i, '').replace(/\/$/, '');
      if (short.length > 42) short = short.slice(0, 40) + '…';
      return `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(short)}</a>`;
    }
    return esc(url);
  }

  // Anillo de score animado: disco crema, el anillo se rellena al cargar hasta la nota.
  function gaugeSVG(score, reco) {
    const s = Math.max(0, Math.min(100, Number(score) || 0));
    const r = 40, circ = 2 * Math.PI * r;
    const off = circ - (s / 100) * circ;
    const ring = { INVESTIGATE: '#1e5b3a', WATCH: '#b98a2e', PASS: '#9c2b1d' }[reco] || '#b98a2e';
    return `<svg class="gauge" viewBox="0 0 100 100" width="118" height="118" role="img" aria-label="Score ${s} de 100">
      <circle cx="50" cy="50" r="48" fill="#f6f1e7"/>
      <circle cx="50" cy="50" r="${r}" fill="none" stroke="#ded4bd" stroke-width="9"/>
      <circle class="gauge-ring" cx="50" cy="50" r="${r}" fill="none" stroke="${ring}" stroke-width="9"
        stroke-linecap="round" stroke-dasharray="${circ.toFixed(1)}" stroke-dashoffset="${off.toFixed(1)}"
        style="--off:${off.toFixed(1)}; --circ:${circ.toFixed(1)}" transform="rotate(-90 50 50)"/>
      <text x="50" y="47" text-anchor="middle" class="gauge-num">${s}</text>
      <text x="50" y="64" text-anchor="middle" class="gauge-sub">/100</text>
    </svg>`;
  }

  // Mapea el nombre de la dimensión con su bloque de análisis (la evidencia).
  function analysisKey(nombre) {
    const n = String(nombre || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
    if (n.includes('founder') || n.includes('equipo')) return 'founders';
    if (n.includes('mercado')) return 'mercado';
    if (n.includes('traccion')) return 'traccion';
    if (n.includes('producto') || n.includes('tech')) return 'producto_tech';
    if (n.includes('modelo')) return 'modelo_negocio';
    if (n.includes('competencia')) return 'competencia';
    if (n.includes('funding') || n.includes('cap table')) return 'funding_cap_table';
    return null;
  }

  function dimBar(d, analisis) {
    const score = Math.max(0, Math.min(10, Number(d.score) || 0));
    const pct = score * 10;
    const barClass = score >= 7 ? 'bar-hi' : score >= 4 ? 'bar-mid' : 'bar-lo';
    const key = analysisKey(d.nombre);
    const justif = d.justificacion || (key && analisis && analisis[key]) || '';
    return `<div class="dim-row">
      <div class="dim-head">
        <span class="dim-name">${esc(d.nombre)} <span class="dim-weight">${esc(d.peso)}%</span></span>
        <span class="dim-foot-inline"><span class="dim-score">${score}/10</span> <span class="conf-badge conf-${esc(d.confianza)}">${esc(d.confianza)}</span></span>
      </div>
      <div class="dim-track"><div class="dim-fill ${barClass}" style="width:${pct}%"></div></div>
      ${justif ? `<details class="dim-more"><summary>Por qué esta nota</summary><p class="dim-justif">${esc(justif)}</p></details>` : ''}
    </div>`;
  }

  function metricasSection(met) {
    if (!met) return '';
    const rondas = met.rondas || [];
    const series = met.series || [];
    const cifras = met.otras_cifras || [];
    if (!rondas.length && !series.length && !cifras.length) return '';

    const cards = cifras.map((c) => {
      const noData = !c.valor || c.valor === 'sin datos';
      return `<div class="stat-card${noData ? ' stat-nodata' : ''}">
        <div class="stat-value">${esc(c.valor)}</div>
        <div class="stat-label">${esc(c.etiqueta)}</div>
        ${c.contexto ? `<div class="stat-context">${esc(c.contexto)}</div>` : ''}
      </div>`;
    }).join('');

    let roundsHtml = '';
    if (rondas.length) {
      const max = Math.max(...rondas.map((x) => Number(x.importe_eur) || 0), 1);
      roundsHtml = '<div class="rounds-chart"><div class="chart-title">Financiación levantada</div>' + rondas.map((x) => {
        const v = Number(x.importe_eur) || 0;
        if (!v) {
          return `<div class="round-row">
            <div class="round-meta"><span class="round-year">${esc(x.anio)}</span><span class="round-name">${esc(x.ronda)}</span></div>
            <div class="round-track"><div class="round-bar round-nodata" style="width:26%"><span>sin datos</span></div></div>
            <div class="round-inv">${esc(x.inversores)}</div>
          </div>`;
        }
        const pct = Math.max(14, Math.round((v / max) * 100));
        return `<div class="round-row">
          <div class="round-meta"><span class="round-year">${esc(x.anio)}</span><span class="round-name">${esc(x.ronda)}</span></div>
          <div class="round-track"><div class="round-bar" style="width:${pct}%"><span>${esc(x.importe_texto)}</span></div></div>
          <div class="round-inv">${esc(x.inversores)}</div>
        </div>`;
      }).join('') + '</div>';
    }

    const seriesHtml = series.filter((s) => (s.puntos || []).length >= 2).map((s) => {
      const max = Math.max(...s.puntos.map((p) => Number(p.valor) || 0), 1);
      const bars = s.puntos.map((p) => {
        const h = Math.max(8, Math.round(((Number(p.valor) || 0) / max) * 100));
        const val = Number.isInteger(p.valor) ? p.valor : Number(p.valor).toFixed(2).replace(/\.?0+$/, '');
        return `<div class="series-col">
          <div class="series-val">${esc(val)}${p.estimado ? '<span class="est-mark">est.</span>' : ''}</div>
          <div class="series-bar-wrap"><div class="series-bar${p.estimado ? ' series-est' : ''}" style="height:${h}%"></div></div>
          <div class="series-period">${esc(p.periodo)}</div>
        </div>`;
      }).join('');
      return `<div class="series-chart">
        <div class="chart-title">${esc(s.titulo)} <span class="chart-unit">(${esc(s.unidad)})</span></div>
        <div class="series-plot">${bars}</div>
        <div class="chart-src">${esc(s.fuente || '')}</div>
      </div>`;
    }).join('');

    return `
      <section class="memo-sec">
        <h3>Métricas financieras</h3>
        ${cards ? `<div class="stat-cards">${cards}</div>` : ''}
        <div class="charts-grid">${roundsHtml}${seriesHtml}</div>
      </section>`;
  }

  function renderMemoHTML(memo, { demo = false } = {}) {
    const reco = memo.recomendacion || 'WATCH';
    const recoClass = { INVESTIGATE: 'hero-green', WATCH: 'hero-amber', PASS: 'hero-red' }[reco] || 'hero-amber';
    const a = memo.analisis || {};

    const heroChips = [memo.sector, memo.stage, memo.geografia]
      .filter(Boolean).map((c) => `<span class="hero-chip">${esc(c)}</span>`).join('');

    const dims = (memo.dimensiones || []).map((d) => dimBar(d, a)).join('');

    const claims = (memo.claims || []).map((c, i) => `
      <tr>
        <td class="c-num">${i + 1}</td>
        <td data-label="Claim">${esc(c.claim)}</td>
        <td class="c-src" data-label="Fuente interna">${esc(c.fuente_interna)}</td>
        <td data-label="Verificación externa">${esc(c.verificacion_externa)}</td>
        <td data-label="Estado"><span class="estado-chip st-${esc(c.estado)}">${ESTADO_LABEL[c.estado] || esc(c.estado)}</span></td>
        <td class="c-src" data-label="Fuente">${linkify(c.fuente_externa)}</td>
      </tr>`).join('');

    const encaje = (memo.encaje || []).map((e) => `
      <div class="fit-row fit-${esc(e.encaja)}">
        <span class="fit-mark">${ENCAJE_ICON[e.encaja] || '?'}</span>
        <span class="fit-body"><span class="fit-crit">${esc(e.criterio.split('(')[0].trim())}</span>
        <span class="fit-det">${esc(e.detalle)}</span></span>
      </div>`).join('');

    const redFlags = (memo.red_flags && memo.red_flags.length)
      ? memo.red_flags.map((r, i) => `<div class="flag-row"><span class="flag-num">${String(i + 1).padStart(2, '0')}</span><span>${esc(r)}</span></div>`).join('')
      : '<p class="snd">No se detectaron red flags relevantes.</p>';

    const preguntas = `<ol class="q-list">${(memo.preguntas || []).map((p) => `<li>${esc(p)}</li>`).join('')}</ol>`;
    const fuentes = `<ol class="src-list">${(memo.fuentes_utilizadas || []).map((f) => `<li>${linkify(f)}</li>`).join('')}</ol>`;

    return `
    ${demo ? '<div class="demo-banner">Ejemplo pre-generado (modo demo). Datos de fuentes públicas; lo no verificable figura como «sin datos».</div>' : ''}
    <article class="memo memo-v2">

      <header class="hero ${recoClass}">
        <div class="hero-main">
          ${memo.logo ? `<img class="hero-logo" src="${esc(memo.logo)}" alt="Logo de ${esc(memo.nombre)}" onerror="this.style.display='none'"/>` : ''}
          <div class="hero-kicker">MEMO DE SCREENING · ${esc(memo.fecha || '')}</div>
          <h2 class="hero-name">${esc(memo.nombre)}</h2>
          <div class="hero-reco">${RECO_ICON[reco] || ''} ${RECO_LABEL[reco] || esc(reco)}</div>
          <div class="hero-chips">${heroChips}</div>
          <p class="hero-justif">${esc(memo.justificacion)}</p>
        </div>
        <div class="hero-score">
          ${gaugeSVG(memo.score_global, reco)}
          <div class="hero-conf">Confianza global <span class="conf-badge conf-${esc(memo.confianza_global)}">${esc(memo.confianza_global)}</span></div>
        </div>
      </header>

      <section class="memo-sec">
        <h3>Resumen ejecutivo</h3>
        <p class="exec-sum">${esc(memo.resumen_ejecutivo)}</p>
        <div class="why-grid">
          <div class="why-block"><strong>Why now?</strong><p>${esc(memo.why_now)}</p></div>
          <div class="why-block"><strong>Why this company?</strong><p>${esc(memo.why_this_company)}</p></div>
        </div>
      </section>

      ${metricasSection(memo.metricas)}

      <section class="memo-sec">
        <h3>Scoring por dimensión</h3>
        <p class="method-note">Cada dimensión se puntúa de 0 a 10 según la evidencia citada debajo de cada barra; la nota global es la media ponderada con los pesos de la rúbrica. No es un benchmark de mercado, es criterio estructurado para priorizar el tiempo del inversor.</p>
        <div class="dims-grid">${dims}</div>
      </section>

      <section class="memo-sec">
        <h3>Claims vs evidencia <span class="h3-note">núcleo del memo</span></h3>
        <table class="claims-table">
          <thead><tr><th>#</th><th>Claim</th><th>Fuente interna</th><th>Verificación externa</th><th>Estado</th><th>Fuente</th></tr></thead>
          <tbody>${claims}</tbody>
        </table>
      </section>

      <section class="memo-sec">
        <h3>Encaje con 4Founders</h3>
        <div class="fit-list">${encaje}</div>
      </section>

      <section class="memo-sec">
        <h3>Red flags y riesgos clave</h3>
        <div class="flags-list">${redFlags}</div>
      </section>

      <section class="memo-sec">
        <h3>5 preguntas que debería hacer el inversor</h3>
        ${preguntas}
      </section>

      <details class="memo-sec collapsible">
        <summary><h3>Fuentes utilizadas</h3></summary>
        ${fuentes}
      </details>

      <footer class="memo-foot">
        <span>Web: ${linkify(memo.web)}</span>
        <span>Fuentes internas: ${esc((memo.fuentes || []).join(', ') || 'web')}</span>
        <span>Guía de priorización, no predicción. La decisión es del inversor.</span>
      </footer>
    </article>`;
  }

  window.renderMemoHTML = renderMemoHTML;
  window.addEventListener('beforeprint', () => {
    document.querySelectorAll('details').forEach((d) => { d.open = true; });
  });
})();
