(() => {
  const founder = document.body.dataset.role === 'founder';
  const l = new URLSearchParams(location.search).get('lang') === 'en' ? 'en' : 'es';
  const t = {
    es: {
      investor: ['PARA INVERSORES', 'Encuentra lo que merece una segunda mirada.', 'De URL y deck a un memo contrastado. Claims, huecos y preguntas que cambian la decisión.', 'Analizar una oportunidad →'],
      founder: ['PARA FOUNDERS', 'Llega al inversor correcto, mejor preparado.', 'Descubre qué te van a preguntar, qué debes demostrar y qué fondos encajan contigo.', 'Preparar mi ronda →'],
    },
    en: {
      investor: ['FOR INVESTORS', 'Find what deserves a second look.', 'From URL and deck to a verified memo. Claims, gaps and the questions that change the decision.', 'Analyze an opportunity →'],
      founder: ['FOR FOUNDERS', 'Reach the right investor, better prepared.', 'See what they will ask, what you need to prove and which funds fit.', 'Prepare my round →'],
    },
  }[l][founder ? 'founder' : 'investor'];
  document.documentElement.lang = l;
  document.getElementById('role-k').textContent = t[0];
  document.getElementById('role-h').textContent = t[1];
  document.getElementById('role-p').textContent = t[2];
  document.getElementById('role-cta').textContent = t[3];
  document.getElementById('role-cta').href = (founder ? '/investor-map' : '/scouting') + '?lang=' + l;
  document.getElementById('role-back').href = '/?lang=' + l;
  if (founder) {
    const F = {
      es: ['Para ti si: prefieres saber qué no cuadra de tu historia antes de que te lo diga un fondo.', 'No para ti si: buscas una plantilla de deck o intros en frío.'],
      en: ['For you if: you would rather know what does not hold up in your story before a fund tells you.', 'Not for you if: you are looking for a deck template or cold intros.'],
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

  // Intake founder (deck + LinkedIn): vive aqui, no en el lado inversor.
  if (founder) {
    const TX = {
      es: { sum: 'Tu screen: web, deck y LinkedIn', url: 'Web de tu startup', deck: 'Pitch deck (PDF, opcional)', li: 'Tu LinkedIn (opcional)', cx: 'Contexto adicional (opcional)', go: 'Analizar mi startup', busy: 'Analizando… suele llevar un par de minutos.', paused: 'El analisis en vivo esta en pausa temporal. Mientras tanto, las herramientas de abajo funcionan sin el.', err: 'No se pudo analizar ahora.' },
      en: { sum: 'Your screen: site, deck and LinkedIn', url: 'Your startup website', deck: 'Pitch deck (PDF, optional)', li: 'Your LinkedIn (optional)', cx: 'Additional context (optional)', go: 'Analyse my startup', busy: 'Analysing… usually a couple of minutes.', paused: 'Live analysis is temporarily paused. Meanwhile, the tools below work without it.', err: 'Could not analyse right now.' },
    }[l];
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('fs-sum', TX.sum); set('fs-l-url', TX.url); set('fs-l-deck', TX.deck); set('fs-l-li', TX.li); set('fs-l-cx', TX.cx); set('fs-go', TX.go);
    const form = document.getElementById('fscreen-form');
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
})();
