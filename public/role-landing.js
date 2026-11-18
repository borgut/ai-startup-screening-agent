(() => {
  const founder = document.body.dataset.role === 'founder';
  const l = new URLSearchParams(location.search).get('lang') === 'en' ? 'en' : 'es';
  const t = {
    es: {
      investor: ['PARA INVERSORES', 'Encuentra lo que merece una segunda mirada.', 'Explora señales y memos de ejemplo. Lo que dice la empresa, lo que falta y las preguntas que importan.', 'Explorar el radar →'],
      founder: ['PARA FOUNDERS', 'Tu idea. Tu siguiente paso.', 'Pon a prueba lo que construyes y decide cómo seguir. Con ronda o sin ella.', 'Empezar por aquí →'],
    },
    en: {
      investor: ['FOR INVESTORS', 'Find what deserves a second look.', 'Explore signals and example memos. What the company says, what is missing and the questions that matter.', 'Explore the radar →'],
      founder: ['FOR FOUNDERS', 'Your idea. Your next step.', 'Put what you are building to the test and decide what comes next. With or without funding.', 'Start here →'],
    },
  }[l][founder ? 'founder' : 'investor'];
  document.documentElement.lang = l;
  document.getElementById('role-k').textContent = t[0];
  document.getElementById('role-h').textContent = t[1];
  document.getElementById('role-p').textContent = t[2];
  document.getElementById('role-cta').textContent = t[3];
  document.getElementById('role-cta').href = (founder ? '/founder-intake.html' : '/scouting') + '?lang=' + l;
  document.getElementById('role-back').href = '/?lang=' + l;
  if (!founder) { const status = document.createElement('p'); status.className = 'role-status'; status.textContent = l === 'en' ? 'New startup analyses are still in testing and are not available yet.' : 'Los análisis de startups nuevas siguen en pruebas y todavía no están disponibles.'; document.getElementById('role-cta').after(status); }
  if (founder) {
    const F = {
      es: ['Para ti: si prefieres saber qué no cuadra de tu historia antes de que te lo diga un fondo.', 'No para ti: si buscas una plantilla de deck o intros en frío.'],
      en: ['For you: if you would rather know what does not hold up in your story before a fund tells you.', 'Not for you: if you are looking for a deck template or cold intros.'],
    }[l];
    const box = document.getElementById('role-fit');
    if (box) {
      box.hidden = false;
      const split = (x) => { const i = x.indexOf(': '); return [x.slice(0, i), x.slice(i + 2)]; };
      const y = split(F[0]), n = split(F[1]);
      document.getElementById('fit-yes').innerHTML = '<b>' + y[0] + ':</b> ' + y[1];
      document.getElementById('fit-no').innerHTML = '<b>' + n[0] + ':</b> ' + n[1];
    }
  }

  if (founder) {
    const tools = l === 'en' ? ['Value my startup', 'Put my idea to the test', 'Startup jobs'] : ['Valorar mi startup', 'Poner a prueba mi idea', 'Empleo en startups'];
    document.querySelectorAll('.role-tools a > span:last-child').forEach((el, i) => { if (tools[i]) el.textContent = tools[i]; });
  }

  // Intake founder (deck + LinkedIn): vive aqui, no en el lado inversor.
  if (founder) {
    const TX = {
      es: { sum: 'Análisis de web y deck: en pruebas', url: 'Web de tu startup', deck: 'Pitch deck (PDF, opcional)', li: 'Tu LinkedIn (opcional)', cx: 'Contexto adicional (opcional)', go: 'Analizar mi startup', busy: 'Analizando… suele llevar un par de minutos.', paused: 'El analisis en vivo esta en pausa temporal. Mientras tanto, las herramientas de abajo funcionan sin el.', err: 'No se pudo analizar ahora.' },
      en: { sum: 'Website and deck analysis: in testing', url: 'Your startup website', deck: 'Pitch deck (PDF, optional)', li: 'Your LinkedIn (optional)', cx: 'Additional context (optional)', go: 'Analyse my startup', busy: 'Analysing… usually a couple of minutes.', paused: 'Live analysis is temporarily paused. Meanwhile, the tools below work without it.', err: 'Could not analyse right now.' },
    }[l];
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('fs-sum', TX.sum); set('fs-l-url', TX.url); set('fs-l-deck', TX.deck); set('fs-l-li', TX.li); set('fs-l-cx', TX.cx); set('fs-go', TX.go);
    const form = document.getElementById('fscreen-form');
    if (form) { form.querySelectorAll('input,textarea,button').forEach(el => { el.disabled = true; }); document.getElementById('fs-note').textContent = l === 'en' ? 'Not available yet. You can use the guided questionnaire above. No files or contact details are collected here.' : 'Todavía no disponible. Puedes usar el recorrido guiado de arriba. Aquí no se recogen archivos ni datos de contacto.'; }
    if (form) form.addEventListener('submit', async (ev) => {
      ev.preventDefault();
      const note = document.getElementById('fs-note');
      const fd = new FormData();
      fd.append('url', document.getElementById('fs-url').value.trim());
      fd.append('linkedin', document.getElementById('fs-li').value.trim());
      fd.append('context', document.getElementById('fs-cx').value.trim());
      const f = document.getElementById('fs-deck').files[0];
      if (f) fd.append('deck', f);
      note.textContent = TX.busy;
      try {
        const res = await fetch('/api/screen', { method: 'POST', body: fd });
        const data = await res.json();
        if (!res.ok) { note.textContent = (data && data.code === 'NO_API_KEY') ? TX.paused : (data && data.error) || TX.err; }
        else if (data.id) { location.href = '/memo/' + data.id + '?lang=' + l; }
        else { note.textContent = TX.err; }
      } catch { note.textContent = TX.err; }
    });
  }

  // PROPUESTA: escena a pantalla completa (imagen generada, luz animada). Sin datos reales ni capacidades prometidas.
  (() => {
    const sc = document.createElement('div');
    sc.className = 'hero-scene ' + (founder ? 'hs-fou' : 'hs-inv');
    sc.setAttribute('aria-hidden', 'true');
    const src = '/hero/faro-pintura.webp';
    sc.innerHTML = '<div class="hs-in"><img class="hs-base" src="' + src + '" alt=""><img class="hs-lit" src="' + src + '" alt=""><i class="painted-beam"></i><i class="hs-glow"></i></div><i class="hs-fade"></i>';
    document.body.insertBefore(sc, document.body.firstChild);
    const cover = document.querySelector('.gateway');
    const sizeScene = () => {
      const end = document.querySelector('.role-status') || document.getElementById('role-cta');
      sc.style.setProperty('--mobile-art-top', (end.getBoundingClientRect().bottom + scrollY + 24) + 'px');
      sc.style.height = cover.offsetHeight + 'px';
    };
    new ResizeObserver(sizeScene).observe(cover); sizeScene();
  })();
})();
