/* Journey inversor: marcador de capítulo, índice, reveals y la luz que enciende las escenas. */
(() => {
  const l = new URLSearchParams(location.search).get('lang') === 'en' ? 'en' : 'es';
  const cmKey = l === 'en' ? 'cmEn' : 'cmEs';

  /* i18n: innerHTML por id, mismo patrón que role-landing.js */
  const T = {
    'j-scrollhint': ['— SCROLL —', '— SCROLL —'],
    'j-idxhead': ['ÍNDICE', 'INDEX'],
    'j-idxnote': ['&gt; la luz del faro te guía. cada escena se enciende al llegar.<br>&gt; una idea por pantalla.',
                  '&gt; the lighthouse beam guides you. each scene lights up as you arrive.<br>&gt; one idea per screen.'],
    'j-i0': ['La <em>portada</em>', 'The <em>cover</em>'],
    'j-i1': ['Lo que <em>llega</em>', 'What <em>arrives</em>'],
    'j-i2': ['Lo que <em>contrastamos</em>', 'What we <em>verify</em>'],
    'j-i3': ['El <em>memo</em>', 'The <em>memo</em>'],
    'j-i4': ['Las <em>preguntas</em>', 'The <em>questions</em>'],
    'j-i5': ['El <em>cierre</em>', 'The <em>close</em>'],
    'j-k1': ['01 · LO QUE LLEGA', '01 · WHAT ARRIVES'],
    'j-h1': ['Todas las oportunidades llegan <em>bien vestidas</em>.', 'Every opportunity arrives <em>well dressed</em>.'],
    'j-d1': ['Instalaciones solares para empresas', 'Solar installations for businesses'],
    'j-d2': ['"Mercado: 4.200 M€" · "12 contratos firmados"', '"Market: €4.2bn" · "12 contracts signed"'],
    'j-d3': ['serie semilla · cierra en 3 semanas · CASO FICTICIO', 'seed round · closes in 3 weeks · FICTIONAL CASE'],
    'j-n1': ['<span class="prompt">&gt;</span> el deck dice mercado enorme. el pitch dice tracción. el correo dice que hay que decidir ya.',
             '<span class="prompt">&gt;</span> the deck claims a huge market. the pitch claims traction. the email says you must decide now.'],
    'j-k2': ['02 · LO QUE CONTRASTAMOS', '02 · WHAT WE VERIFY'],
    'j-h2': ['Cada afirmación, contra una <em>evidencia</em>.', 'Every claim, against the <em>evidence</em>.'],
    'j-c1': ['"12 contratos firmados"', '"12 contracts signed"'],
    'j-c1s': ['3 documentados · 9 acuerdos verbales', '3 documented · 9 verbal agreements'],
    'j-c2': ['"Mercado de 4.200 M€"', '"€4.2bn market"'],
    'j-c2s': ['dato público', 'public data'],
    'j-c3': ['"Equipo con historial"', '"Team with a track record"'],
    'j-c3s': ['contrastado', 'verified'],
    'j-n2': ['<span class="prompt">&gt;</span> lo que no se puede verificar se declara no verificado. eso también es información.',
             '<span class="prompt">&gt;</span> what cannot be verified is declared unverified. that is information too.'],
    'j-k3': ['03 · EL MEMO', '03 · THE MEMO'],
    'j-h3': ['Un memo corto, escrito para <em>decidir</em>.', 'A short memo, written to <em>decide</em>.'],
    'j-mf': ['CASO FICTICIO', 'FICTIONAL CASE'],
    'j-m1': ['Qué dice la empresa', 'What the company claims'],
    'j-m2': ['Qué se sostiene con evidencia', 'What holds up to evidence'],
    'j-m3': ['Qué no se ha podido verificar', 'What could not be verified'],
    'j-m3f': ['9 de 12 sin documentar', '9 of 12 undocumented'],
    'j-m4': ['Qué preguntas deciden la inversión', 'Which questions decide the investment'],
    'j-n3': ['<span class="prompt">&gt;</span> corto no porque falte trabajo: porque sobra todo lo que no cambia la decisión.',
             '<span class="prompt">&gt;</span> short not because work is missing: because everything that does not change the decision is left out.'],
    'j-k4': ['04 · LAS PREGUNTAS', '04 · THE QUESTIONS'],
    'j-h4': ['Las preguntas que <em>cambian</em> la decisión.', 'The questions that <em>change</em> the decision.'],
    'j-b4': ['¿Quién paga, cuánto, y por qué ahora? ¿Qué tiene este equipo? ¿Qué tiene que ser verdad? ¿Y si el mercado tarda el doble?',
             'Who pays, how much, and why now? What does this team have? What must be true? What if the market takes twice as long?'],
    'j-n4': ['<span class="prompt">&gt;</span> un buen análisis no responde todas las preguntas. deja claras cuáles importan.',
             '<span class="prompt">&gt;</span> a good analysis does not answer every question. it makes clear which ones matter.'],
    'j-h5': ['Menos presentaciones. <em>Mejores decisiones</em>.', 'Fewer presentations. <em>Better decisions</em>.'],
    'j-cta': ['Explorar el radar →', 'Explore the radar →'],
  };
  if (l === 'en') {
    document.title = 'Startup Scouting';
    for (const id in T) { const el = document.getElementById(id); if (el) el.innerHTML = T[id][1]; }
    document.getElementById('indexBtn').textContent = 'index';
    document.getElementById('idxClose').textContent = 'close';
  }
  document.getElementById('j-cta').href = '/scouting?lang=' + l;

  const screens = [...document.querySelectorAll('section.screen, #s-hero')];
  const cm = document.getElementById('cmChapter');
  const header = document.getElementById('cmHead');
  const idxLinks = [...document.querySelectorAll('#indexOverlay a')];
  const overlay = document.getElementById('indexOverlay');
  const beam = document.getElementById('beam');

  /* marcador de capítulo + reveals + fondo del header al entrar cada escena */
  const io = new IntersectionObserver((es) => {
    es.forEach(e => {
      if (e.isIntersecting) {
        const cmNow = e.target.dataset[cmKey];
        cm.textContent = cmNow;
        header.classList.toggle('on', e.target.id !== 's-hero');
        const bg = getComputedStyle(e.target).backgroundColor;
        header.style.setProperty('--hbg', bg.replace('rgb(', 'rgba(').replace(')', ',.92)'));
        header.classList.toggle('on-light', (e.target.classList.contains('sec-03') || e.target.classList.contains('sec-cierre')));
        idxLinks.forEach(a => a.classList.toggle('current', a.dataset[cmKey] === cmNow));
        e.target.querySelectorAll('.reveal').forEach((el, i) => setTimeout(() => el.classList.add('in'), 90 * i));
      }
    });
  }, { threshold: .5 });
  screens.forEach(s => io.observe(s));

  document.getElementById('indexBtn').onclick = () => overlay.classList.add('open');
  document.getElementById('idxClose').onclick = () => overlay.classList.remove('open');
  idxLinks.forEach(a => a.addEventListener('click', () => overlay.classList.remove('open')));

  /* la luz revela la escena y se desplaza con el scroll; el haz ambiental sale del faro */
  const journeyScreens = [...document.querySelectorAll('section.screen')];
  function lightFrame() {
    const vh = innerHeight;
    journeyScreens.forEach(s => {
      const r = s.getBoundingClientRect();
      if (r.top < vh && r.bottom > 0) {
        const lit = Math.min(1, Math.max(0, (vh * 0.72 - r.top) / (vh * 0.65)));
        const p = Math.min(1, Math.max(0, (vh - r.top) / (vh + r.height)));
        s.style.setProperty('--hlit', lit.toFixed(3));
        const sc = s.querySelector('.scene');
        if (sc) { sc.style.setProperty('--lit', lit.toFixed(3)); sc.style.setProperty('--lp', p.toFixed(3)); }
      }
    });
    /* haz apagado sobre la portada (el faro tiene el suyo), sube al bajar */
    const out = Math.min(1, Math.max(0, scrollY / (vh * 0.7)));
    beam.style.opacity = (out * 0.9).toFixed(2);
    beam.style.transform = 'rotate(' + (scrollY * 0.004) + 'deg)';
    requestAnimationFrame(lightFrame);
  }
  requestAnimationFrame(lightFrame);
})();
