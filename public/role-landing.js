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
})();
