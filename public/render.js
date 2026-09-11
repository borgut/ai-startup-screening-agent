// Renderizado del memo: formato IC one-pager / dashboard ejecutivo.
// Autocontenido (IIFE) - usado por la landing (app.js) y las páginas /memo/:id.
(function () {
  const RECO_LABEL = { INVESTIGATE: 'INVESTIGATE', WATCH: 'WATCH', PASS: 'PASS' };
  const RECO_ICON = { INVESTIGATE: '🟢', WATCH: '🟡', PASS: '🔴' };
  const ESTADO_LABEL = { verificada: '✓ verificada', no_verificada: '⚠ no verificada', contradicha: '✗ contradicha' };
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

  function gaugeSVG(score, reco) {
    const s = Math.max(0, Math.min(100, Number(score) || 0));
    const r = 40, circ = 2 * Math.PI * r;
    const filled = (s / 100) * circ;
    const color = { INVESTIGATE: '#15803d', WATCH: '#d97706', PASS: '#dc2626' }[reco] || '#d97706';
    return `<svg class="gauge" viewBox="0 0 100 100" width="104" height="104" role="img" aria-label="Score ${s} de 100">
      <circle cx="50" cy="50" r="${r}" fill="none" stroke="rgba(255,255,255,.28)" stroke-width="11"/>
      <circle cx="50" cy="50" r="${r}" fill="none" stroke="${color === '#15803d' ? '#bbf7d0' : color === '#d97706' ? '#fde68a' : '#fecaca'}" stroke-width="11"
        stroke-linecap="round" stroke-dasharray="${filled.toFixed(1)} ${circ.toFixed(1)}" transform="rotate(-90 50 50)"/>
      <text x="50" y="47" text-anchor="middle" class="gauge-num">${s}</text>
      <text x="50" y="63" text-anchor="middle" class="gauge-sub">/100</text>
    </svg>`;
  }

  function dimBar(d) {
    const score = Math.max(0, Math.min(10, Number(d.score) || 0));
    const pct = score * 10;
    const barClass = score >= 7 ? 'bar-hi' : score >= 4 ? 'bar-mid' : 'bar-lo';
    return `<div class="dim-row">
      <div class="dim-head">
        <span class="dim-name">${esc(d.nombre)}</span>
        <span class="dim-weight">${esc(d.peso)}%</span>
      </div>
      <div class="dim-track"><div class="dim-fill ${barClass}" style="width:${pct}%"></div></div>
      <div class="dim-foot">
        <span class="dim-score">${score}/10</span>
        <span class="conf-badge conf-${esc(d.confianza)}">${esc(d.confianza)}</span>
      </div>
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

    const heroChips = [memo.sector, memo.stage, memo.geografia]
      .filter(Boolean).map((c) => `<span class="hero-chip">${esc(c)}</span>`).join('');

    const dims = (memo.dimensiones || []).map(dimBar).join('');

    const claims = (memo.claims || []).map((c, i) => `
      <tr>
        <td class="c-num">${i + 1}</td>
        <td>${esc(c.claim)}</td>
        <td class="c-src">${esc(c.fuente_interna)}</td>
        <td>${esc(c.verificacion_externa)}</td>
        <td><span class="estado-chip st-${esc(c.estado)}">${ESTADO_LABEL[c.estado] || esc(c.estado)}</span></td>
        <td class="c-src">${linkify(c.fuente_externa)}</td>
      </tr>`).join('');

    const a = memo.analisis || {};
    const dimDetail = [
      ['Mercado', a.mercado], ['Producto / tech', a.producto_tech], ['Tracción', a.traccion],
      ['Modelo de negocio', a.modelo_negocio], ['Founders', a.founders],
      ['Competencia', a.competencia], ['Funding / cap table', a.funding_cap_table],
    ].map(([name, text]) => `<div class="detail-block"><strong>${name}</strong><p>${esc(text || 'sin datos')}</p></div>`).join('');

    const encaje = (memo.encaje || []).map((e) => `
      <div class="fit-card fit-${esc(e.encaja)}">
        <div class="fit-top"><span class="fit-icon">${ENCAJE_ICON[e.encaja] || '?'}</span><span class="fit-crit">${esc(e.criterio.split('(')[0].trim())}</span></div>
        <div class="fit-det">${esc(e.detalle)}</div>
      </div>`).join('');

    const redFlags = (memo.red_flags && memo.red_flags.length)
      ? memo.red_flags.map((r, i) => `<div class="flag-card"><span class="flag-num">${i + 1}</span><span>${esc(r)}</span></div>`).join('')
      : '<p class="snd">No se detectaron red flags relevantes.</p>';

    const preguntas = `<ol class="q-list">${(memo.preguntas || []).map((p) => `<li>${esc(p)}</li>`).join('')}</ol>`;
    const fuentes = `<ol class="src-list">${(memo.fuentes_utilizadas || []).map((f) => `<li>${linkify(f)}</li>`).join('')}</ol>`;

    return `
    ${demo ? '<div class="demo-banner">Ejemplo pre-generado (modo demo). Datos de fuentes públicas; lo no verificable figura como «sin datos».</div>' : ''}
    <article class="memo memo-v2">

      <header class="hero ${recoClass}">
        <div class="hero-main">
          <div class="hero-kicker">MEMO DE SCREENING · ${esc(memo.fecha || '')}</div>
          <h2 class="hero-name">${esc(memo.nombre)}</h2>
          <div class="hero-reco">${RECO_ICON[reco] || ''} ${RECO_LABEL[reco] || esc(reco)}</div>
          <div class="hero-chips">${heroChips}</div>
          <p class="hero-justif">${esc(memo.justificacion)}</p>
        </div>
        <div class="hero-side">
          ${gaugeSVG(memo.score_global, reco)}
          <div class="hero-conf">Confianza global <span class="conf-badge conf-${esc(memo.confianza_global)}">${esc(memo.confianza_global)}</span></div>
        </div>
      </header>

      <section class="memo-sec">
        <h3>Resumen ejecutivo</h3>
        <p class="exec-sum">${esc(memo.resumen_ejecutivo)}</p>
        <div class="why-grid">
          <div class="why-box"><strong>Why now?</strong><p>${esc(memo.why_now)}</p></div>
          <div class="why-box"><strong>Why this company?</strong><p>${esc(memo.why_this_company)}</p></div>
        </div>
      </section>

      ${metricasSection(memo.metricas)}

      <section class="memo-sec">
        <h3>Scoring por dimensión</h3>
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
        <div class="fit-grid">${encaje}</div>
      </section>

      <section class="memo-sec">
        <h3>Red flags y riesgos clave</h3>
        <div class="flags-stack">${redFlags}</div>
      </section>

      <section class="memo-sec">
        <h3>5 preguntas que debería hacer el inversor</h3>
        ${preguntas}
      </section>

      <details class="memo-sec collapsible">
        <summary><h3>Análisis por dimensión <span class="h3-note">detalle</span></h3></summary>
        <div class="details-grid">${dimDetail}</div>
      </details>

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
