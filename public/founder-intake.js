/* Recorrido founder: una pregunta por pantalla. Sin análisis simulado:
   el resultado es una guía determinista sobre las herramientas existentes.
   Nada sale del navegador: el resumen se descarga o copia localmente. */
(() => {
  const VERTICALS = ['B2B SaaS', 'Fintech', 'Consumer', 'Marketplace', 'Deeptech', 'AI'];
  const GEOS = ['España', 'Europa', 'LatAm'];

  const T = {
    es: {
      back: '← Volver', prev: '← Atrás', next: 'Siguiente →', finish: 'Ver mi siguiente paso →',
      kick: 'PARA FOUNDERS',
      steps: ['01 / 05 · QUÉ NECESITAS', '02 / 05 · QUÉ CONSTRUYES', '03 / 05 · FASE Y TRACCIÓN', '04 / 05 · TU RONDA', '05 / 05 · SIGUIENTE PASO'],
      q: [
        '¿Qué necesitas?',
        '¿Qué estás <em>construyendo?</em>',
        '¿En qué fase estás?',
        '¿Estás levantando <em>ronda?</em>',
        'Tu siguiente <em>paso.</em>',
      ],
      sub: [
        'Una cosa. El resto viene después.',
        'Una frase, como se lo contarías a un amigo.',
        'Elige la fase más cercana. Tus respuestas se quedan en esta pestaña.',
        'Si no es ahora, también vale.',
        'Según lo que nos has contado.',
      ],
      needs: [['prepare', 'Preparar mi ronda'], ['test', 'Poner a prueba mi idea'], ['value', 'Valorar mi startup'], ['investors', 'Encontrar inversores'], ['explore', 'Solo estoy explorando']],
      whatLabel: 'Tu startup en una frase', whatPh: 'p. ej. software para que las industriales gestionen su energía', verticalLabel: 'Vertical',
      stages: [['idea', 'Una idea, aún sin producto'], ['mvp', 'Prototipo o MVP'], ['market', 'En mercado, sin ingresos'], ['revenue', 'En mercado, con ingresos']],
      tractionLabel: 'Tracción que puedas contar (opcional)', tractionPh: 'usuarios, pilotos, ingresos…',
      raising: [['now', 'Sí, ahora'], ['soon', 'En los próximos 3–6 meses'], ['no', 'No por ahora']],
      amountLabel: 'Importe objetivo', amounts: ['Menos de 250 k€', '250 k€ – 1 M€', '1 – 3 M€', 'Más de 3 M€'], geoLabel: 'Mercado principal',
      err: ['Elige una opción para seguir.', 'Cuéntalo en una frase.', 'Elige la fase más cercana.', 'Elige una opción.'],
      sumTitle: ['Qué necesitas', 'Qué construyes', 'Fase', 'Ronda'], change: 'cambiar',
      raisingNo: 'No por ahora', raisingYes: (a, g) => `${a} · ${g}`,
      nextTitle: 'Por orden',
      why: 'No es un análisis de tu startup: es una guía según lo que nos has contado. Las herramientas son las de siempre; ahora sabes por dónde empezar.',
      links: {
        valoracion: 'Poner un rango a la valoración',
        redteam: 'Poner a prueba mi idea',
        map: 'Inversores que encajan con tu fase y mercado',
        wyi: 'Mirarte con ojos de inversor',
      },
      saveH: 'Llévate el resumen.',
      saveP: 'Como texto, para guardarlo o mandarlo a quien tú quieras. No pedimos tu email: no hay envío conectado.',
      saveDl: 'Descargar resumen', saveCp: 'Copiar resumen', copied: 'Copiado ✓',
      foot: 'Tus respuestas se conservan en esta pestaña mientras sigas aquí. No se envían al servidor. Puedes borrarlas con Empezar de nuevo; al cerrar la pestaña se eliminan.',
      restart: 'Empezar de nuevo',
    },
    en: {
      back: '← Back', prev: '← Back', next: 'Next →', finish: 'See my next step →',
      kick: 'FOR FOUNDERS',
      steps: ['01 / 05 · WHAT YOU NEED', '02 / 05 · WHAT YOU ARE BUILDING', '03 / 05 · STAGE & TRACTION', '04 / 05 · YOUR ROUND', '05 / 05 · NEXT STEP'],
      q: [
        'What do you need?',
        'What are you <em>building?</em>',
        'What stage are you at?',
        'Are you <em>raising?</em>',
        'Your next <em>step.</em>',
      ],
      sub: [
        'One thing. The rest comes later.',
        'One sentence, the way you would tell a friend.',
        'Pick the closest stage. Your answers stay in this tab.',
        'Not now is also an answer.',
        'Based on what you told us.',
      ],
      needs: [['prepare', 'Prepare my round'], ['test', 'Put my idea to the test'], ['value', 'Value my startup'], ['investors', 'Find investors'], ['explore', 'Just exploring']],
      whatLabel: 'Your startup in one sentence', whatPh: 'e.g. software for industrial companies to manage their energy', verticalLabel: 'Vertical',
      stages: [['idea', 'An idea, no product yet'], ['mvp', 'Prototype or MVP'], ['market', 'In market, no revenue'], ['revenue', 'In market, with revenue']],
      tractionLabel: 'Traction you can point to (optional)', tractionPh: 'users, pilots, revenue…',
      raising: [['now', 'Yes, right now'], ['soon', 'In the next 3–6 months'], ['no', 'Not for now']],
      amountLabel: 'Target amount', amounts: ['Under €250k', '€250k – €1m', '€1m – €3m', 'Over €3m'], geoLabel: 'Main market',
      err: ['Pick one option to continue.', 'Tell us in one sentence.', 'Pick the closest stage.', 'Pick one option.'],
      sumTitle: ['What you need', 'What you build', 'Stage', 'Round'], change: 'change',
      raisingNo: 'Not for now', raisingYes: (a, g) => `${a} · ${g}`,
      nextTitle: 'In order',
      why: 'This is not an analysis of your startup: it is a guide based on what you told us. The tools are the usual ones; now you know where to start.',
      links: {
        valoracion: 'Put a range on the valuation',
        redteam: 'Put my idea to the test',
        map: 'Investors that fit your stage and market',
        wyi: 'See yourself through investor eyes',
      },
      saveH: 'Take the summary with you.',
      saveP: 'As plain text, to keep or send to whoever you choose. We do not ask for your email: there is no sending wired up.',
      saveDl: 'Download summary', saveCp: 'Copy summary', copied: 'Copied ✓',
      foot: 'Your answers are kept in this tab while you use it. They are not sent to the server. Use Start over to clear them; closing the tab removes them.',
      restart: 'Start over',
    },
  };

  const $ = (id) => document.getElementById(id);
  const STORE = 'fi-state-v1';
  let lang = new URLSearchParams(location.search).get('lang') === 'en' ? 'en' : 'es';
  let state = { need: null, what: '', vertical: 'B2B SaaS', stage: null, traction: '', raising: null, amountIdx: 1, geo: 'España', step: 0 };
  try { Object.assign(state, JSON.parse(sessionStorage.getItem(STORE) || '{}')); } catch (e) { /* estado corrupto: empezar limpio */ }
  const save = () => { try { sessionStorage.setItem(STORE, JSON.stringify(state)); } catch (e) {} };
  const t = () => T[lang];

  const buildLinks = () => {
    const x = t();
    const map = ['/investor-map?lang=' + lang, x.links.map];
    const val = ['/valoracion?lang=' + lang, x.links.valoracion];
    const red = ['/red-team-idea?lang=' + lang, x.links.redteam];
    const wyi = ['/would-you-invest?lang=' + lang, x.links.wyi];
    let out;
    if (state.need === 'prepare') out = [val, map];
    else if (state.need === 'test') out = [red];
    else if (state.need === 'value') out = [val];
    else if (state.need === 'investors') out = [map];
    else out = [wyi, red];
    if (state.raising && state.raising !== 'no' && !out.includes(map)) out.push(map);
    if (state.need === 'prepare' && state.stage === 'idea') out.splice(1, 0, red);
    return out.slice(0, 3);
  };

  const el = (tag, cls, text) => { const e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; };

  function optionList(rows, current, onPick) {
    const box = el('div', 'fi-opts');
    rows.forEach(([v, label], i) => {
      const b = el('button', 'fi-opt' + (current === v ? ' sel' : ''));
      b.type = 'button';
      b.setAttribute('aria-pressed', current === v ? 'true' : 'false');
      b.appendChild(el('span', 'num', '0' + (i + 1)));
      b.appendChild(el('span', 'lbl', label));
      b.onclick = () => { onPick(v); render(); };
      box.appendChild(b);
    });
    return box;
  }

  function field(labelText, input, hint) {
    const f = el('div', 'fi-field');
    const l = el('label', null, labelText);
    if (input.id) l.htmlFor = input.id;
    f.appendChild(l); f.appendChild(input);
    if (hint) f.appendChild(el('p', 'hint', hint));
    return f;
  }

  function textInput(id, ph, value) {
    const i = el('input'); i.type = 'text'; i.id = id; i.placeholder = ph; i.value = value || ''; i.autocomplete = 'off';
    i.oninput = () => { state[id === 'fi-in-what' ? 'what' : 'traction'] = i.value; save(); };
    return i;
  }

  function selectInput(id, options, value, onChange) {
    const s = el('select'); s.id = id;
    options.forEach((o) => { const op = el('option', null, o); op.value = o; s.appendChild(op); });
    s.value = value;
    s.onchange = () => onChange(s.value);
    return s;
  }

  function renderResult(body) {
    const x = t();
    $('fi-actions').hidden = true;

    const sum = el('div', 'fi-sum');
    const needLabel = x.needs.find(([v]) => v === state.need);
    const stageLabel = x.stages.find(([v]) => v === state.stage);
    const raiseLabel = state.raising === 'no' ? x.raisingNo : x.raisingYes(x.amounts[state.amountIdx], state.geo);
    const rows = [
      [x.sumTitle[0], needLabel ? needLabel[1] : '', 0],
      [x.sumTitle[1], (state.what || '') + ' · ' + state.vertical, 1],
      [x.sumTitle[2], (stageLabel ? stageLabel[1] : '') + (state.traction ? ' · ' + state.traction : ''), 2],
      [x.sumTitle[3], raiseLabel, 3],
    ];
    rows.forEach(([k, v, step]) => {
      const r = el('div');
      r.appendChild(el('b', null, k));
      r.appendChild(el('span', null, v));
      const c = el('button', null, x.change); c.type = 'button';
      c.onclick = () => { state.step = step; save(); render(); };
      r.appendChild(c);
      sum.appendChild(r);
    });
    body.appendChild(sum);

    const nx = el('div', 'fi-next');
    nx.appendChild(el('b', null, x.nextTitle));
    buildLinks().forEach(([href, label], i) => {
      const a = el('a'); a.href = href;
      a.appendChild(el('span', 'num', '0' + (i + 1)));
      a.appendChild(el('span', 'lbl', label));
      nx.appendChild(a);
    });
    body.appendChild(nx);
    body.appendChild(el('p', 'fi-why', x.why));

    const em = el('section', 'fi-save');
    em.appendChild(el('h3', null, x.saveH));
    em.appendChild(el('p', null, x.saveP));
    const btns = el('div', 'fi-savebtns');
    const dl = el('button', null, x.saveDl); dl.type = 'button';
    const cp = el('button', 'ghost', x.saveCp); cp.type = 'button';
    btns.appendChild(dl); btns.appendChild(cp);
    em.appendChild(btns);
    const status = el('small', null, '');
    em.appendChild(status);
    const summaryText = () => {
      const site = 'https://ai-startup-screening-agent.vercel.app';
      const L = [
        (lang === 'es' ? 'GUÍA DE SIGUIENTE PASO' : 'NEXT-STEP GUIDE') + ' · STARTUP SCOUTING',
        new Date().toISOString().slice(0, 10), '',
      ];
      rows.forEach(([k, v]) => L.push(k.toUpperCase() + ': ' + v));
      L.push('', (lang === 'es' ? 'SIGUIENTE PASO, POR ORDEN' : 'NEXT STEPS, IN ORDER') + ':');
      buildLinks().forEach(([href, label], i) => L.push((i + 1) + '. ' + label + ' -> ' + site + href));
      L.push('', x.why, '', x.foot);
      return L.join('\n');
    };
    dl.onclick = () => {
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([summaryText()], { type: 'text/plain;charset=utf-8' }));
      a.download = (lang === 'es' ? 'siguiente-paso' : 'next-step') + '-scouting.txt';
      a.click(); URL.revokeObjectURL(a.href);
    };
    cp.onclick = () => {
      if (!navigator.clipboard) { status.textContent = lang === 'es' ? 'No se pudo copiar. Puedes descargar el resumen.' : 'Could not copy. You can download the summary.'; return; }
      navigator.clipboard.writeText(summaryText()).then(() => {status.textContent=x.copied;}).catch(() => {status.textContent=lang==='es'?'No se pudo copiar. Puedes descargar el resumen.':'Could not copy. You can download the summary.';});
    };
    body.appendChild(em);

    const rst = el('button', 'fi-restart', x.restart); rst.type = 'button';
    rst.onclick = () => { sessionStorage.removeItem(STORE); state = { need: null, what: '', vertical: 'B2B SaaS', stage: null, traction: '', raising: null, amountIdx: 1, geo: 'España', step: 0 }; render(); };
    body.appendChild(rst);
  }

  function render() {
    const x = t();
    document.documentElement.lang = lang;
    document.title = 'Scouting';
    $('fi-back').textContent = x.back; $('fi-back').href = '/raising?lang=' + lang;
    $('fi-prev').textContent = x.prev;
    $('fi-es').classList.toggle('active', lang === 'es');
    $('fi-en').classList.toggle('active', lang === 'en');
    $('fi-step-label').textContent = x.steps[state.step];
    $('fi-prev').hidden = state.step === 0;
    $('fi-kicker').textContent = x.kick;
    $('fi-q').innerHTML = x.q[state.step];
    $('fi-sub').textContent = x.sub[state.step];
    $('fi-err').textContent = '';
    $('fi-actions').hidden = state.step === 4;
    $('fi-next').textContent = state.step === 3 ? x.finish : x.next;
    $('fi-foot').textContent = x.foot;
    const body = $('fi-body'); body.innerHTML = '';

    if (state.step === 0) {
      body.appendChild(optionList(x.needs, state.need, (v) => { state.need = v; save(); }));
    } else if (state.step === 1) {
      body.appendChild(field(x.whatLabel, textInput('fi-in-what', x.whatPh, state.what)));
      body.appendChild(field(x.verticalLabel, selectInput('fi-in-vertical', VERTICALS, state.vertical, (v) => { state.vertical = v; save(); })));
    } else if (state.step === 2) {
      body.appendChild(optionList(x.stages, state.stage, (v) => { state.stage = v; save(); }));
      const gap = document.createElement('div'); gap.style.height = '34px'; body.appendChild(gap);
      body.appendChild(field(x.tractionLabel, textInput('fi-in-traction', x.tractionPh, state.traction)));
    } else if (state.step === 3) {
      body.appendChild(optionList(x.raising, state.raising, (v) => { state.raising = v; save(); }));
      if (state.raising && state.raising !== 'no') {
        body.appendChild(field(x.amountLabel, selectInput('fi-in-amount', x.amounts, x.amounts[state.amountIdx] || x.amounts[1], (v) => { state.amountIdx = x.amounts.indexOf(v); save(); })));
        body.appendChild(field(x.geoLabel, selectInput('fi-in-geo', GEOS, state.geo, (v) => { state.geo = v; save(); })));
      }
    } else {
      renderResult(body);
    }
    const main = $('fi-main');
    main.classList.remove('fi-fade'); void main.offsetWidth; main.classList.add('fi-fade');
    scrollTo({ top: 0, behavior: 'smooth' });
  }

  $('fi-next').onclick = () => {
    const x = t();
    if (state.step === 0 && !state.need) { $('fi-err').textContent = x.err[0]; return; }
    if (state.step === 1 && state.what.trim().length < 3) { $('fi-err').textContent = x.err[1]; return; }
    if (state.step === 2 && !state.stage) { $('fi-err').textContent = x.err[2]; return; }
    if (state.step === 3 && !state.raising) { $('fi-err').textContent = x.err[3]; return; }
    state.step = Math.min(4, state.step + 1); save(); render();
  };
  $('fi-prev').onclick = () => { state.step = Math.max(0, state.step - 1); save(); render(); };
  $('fi-es').onclick = () => { lang = 'es'; history.replaceState(null, '', '?lang=es'); render(); };
  $('fi-en').onclick = () => { lang = 'en'; history.replaceState(null, '', '?lang=en'); render(); };

  render();
})();
