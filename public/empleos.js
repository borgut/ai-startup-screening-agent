/* Empleos en startups: vacantes en vivo (ATS publicos) + boards curados. ES/EN. */
(function () {
  var REGIONS = ['es', 'eu', 'latam'];

  var T = {
    es: {
      kicker: 'Empleos · Trabaja en startups',
      h1: 'Donde contratan las <em>startups</em>.',
      lede: 'Vacantes en vivo de startups de España, Europa y Latam, sacadas directamente de sus portales de empleo. Sin intermediarios: el enlace va a la oferta oficial de cada empresa.',
      region: { es: 'España', eu: 'Europa', latam: 'Latam' },
      hLive: 'Vacantes <em>en vivo</em>',
      loading: 'Cargando vacantes de los portales oficiales…',
      noJobs: 'Sin vacantes ahora mismo en esta región.',
      hBoards: 'Boards de <em>portafolio</em>',
      nBoards: 'Los fondos agregan las vacantes de todas sus startups en un solo sitio. Es el formato de a16z jobs, aplicado a nuestro ecosistema.',
      foot: 'Las vacantes se leen en vivo de los portales públicos de cada empresa (Greenhouse, Lever y Get on Board) y se actualizan cada pocas horas. Los boards de portafolio enlazan a las páginas oficiales de cada fondo.',
      searchPh: 'Filtrar por cargo, empresa o ciudad…',
      of: 'vacantes',
      failed: 'Fuentes que no respondieron ahora: '
    },
    en: {
      kicker: 'Jobs · Work at startups',
      h1: 'Where <em>startups</em> hire.',
      lede: 'Live openings from startups in Spain, Europe and Latam, pulled straight from their official career portals. No middlemen: each link goes to the company\u2019s own posting.',
      region: { es: 'Spain', eu: 'Europe', latam: 'Latam' },
      hLive: 'Live <em>openings</em>',
      loading: 'Loading openings from official portals…',
      noJobs: 'No openings right now in this region.',
      hBoards: 'Portfolio job <em>boards</em>',
      nBoards: 'Funds aggregate openings from all their startups in one place. It is the a16z jobs format, applied to our ecosystem.',
      foot: 'Openings are read live from each company\u2019s public portal (Greenhouse, Lever, Get on Board and nothiring) and refresh every few hours. Portfolio boards link to each fund\u2019s official page.',
      searchPh: 'Filter by role, company or city…',
      of: 'openings',
      failed: 'Sources not responding right now: '
    }
  };

  var BOARDS = {
    es: [
      { name: 'JobFluent', desc: { es: 'El board de empleo de startups españolas de referencia.', en: 'The reference job board for Spanish startups.' }, url: 'https://www.jobfluent.com' },
      { name: 'Nauta Capital', desc: { es: 'Empleo en las startups del portafolio de Nauta (BCN/Londres).', en: 'Jobs across Nauta\u2019s portfolio (BCN/London).' }, url: 'https://www.nautacapital.com/careers' },
      { name: 'Dealflow', desc: { es: 'La newsletter de Jaime Novoa: quién levanta ronda en España cada semana. Las que levantan son las que contratan.', en: 'Jaime Novoa\u2019s newsletter: who raises in Spain every week. The ones raising are the ones hiring.' }, url: 'https://newsletter.dealflow.es' }
    ],
    eu: [
      { name: 'Atomico', desc: { es: 'Todas las vacantes del portafolio de Atomico en un buscador.', en: 'Every opening across Atomico\u2019s portfolio in one search.' }, url: 'https://careers.atomico.com' },
      { name: 'Speedinvest', desc: { es: 'Board de empleo del portafolio de Speedinvest (Viena).', en: 'Job board for Speedinvest\u2019s portfolio (Vienna).' }, url: 'https://careers.speedinvest.com' },
      { name: 'Cherry Ventures', desc: { es: 'Talent network y vacantes del portafolio de Cherry (Berlín).', en: 'Talent network and openings across Cherry\u2019s portfolio (Berlin).' }, url: 'https://talent.cherry.vc' },
      { name: 'Point Nine', desc: { es: 'Board del portafolio de Point Nine, especializado en B2B SaaS.', en: 'Point Nine\u2019s portfolio board, focused on B2B SaaS.' }, url: 'https://jobs.pointnine.com' },
      { name: 'Landing.jobs', desc: { es: 'Empleo tech europeo con base en Portugal; mucho remoto.', en: 'European tech jobs based in Portugal; lots of remote.' }, url: 'https://landing.jobs' }
    ],
    latam: [
      { name: 'Kaszek', desc: { es: 'Vacantes del portafolio de Kaszek, el fondo early-stage líder de Latam.', en: 'Openings across Kaszek\u2019s portfolio, Latam\u2019s leading early-stage fund.' }, url: 'https://jobs.kaszek.com/jobs' },
      { name: 'Get on Board', desc: { es: 'El mayor agregador de empleo tech de Latam; fuente de las vacantes en vivo de arriba.', en: 'Latam\u2019s largest tech jobs aggregator; source of the live openings above.' }, url: 'https://www.getonbrd.com' }
    ]
  };

  var lang = (new URLSearchParams(location.search)).get('lang') === 'en' ? 'en' : 'es';
  var region = 'es';
  var jobsByRegion = {};
  var filter = '';

  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  function paint() {
    var t = T[lang];
    document.documentElement.lang = lang;
    $('l-es').classList.toggle('active', lang === 'es');
    $('l-en').classList.toggle('active', lang === 'en');
    $('k-kicker').textContent = t.kicker;
    $('k-h1').innerHTML = t.h1;
    $('k-lede').textContent = t.lede;
    $('k-h-live').innerHTML = t.hLive;
    $('k-h-boards').innerHTML = t.hBoards;
    $('k-n-boards').textContent = t.nBoards;
    $('k-foot').textContent = t.foot;
    $('q').placeholder = t.searchPh;
    var chips = $('chips'); chips.innerHTML = '';
    REGIONS.forEach(function (r) {
      var b = el('button', r === region ? 'active' : null, t.region[r]);
      b.addEventListener('click', function () { region = r; paint(); load(); });
      chips.appendChild(b);
    });
    var ink = el('span', 'chip-ink');
    chips.appendChild(ink);
    requestAnimationFrame(function () { requestAnimationFrame(function () {
      var act = chips.querySelector('button.active');
      if (act) { ink.style.left = act.offsetLeft + 'px'; ink.style.width = act.offsetWidth + 'px'; }
    }); });
    paintBoards();
    paintJobs();
  }

  function paintBoards() {
    var g = $('boards'); g.innerHTML = '';
    (BOARDS[region] || []).forEach(function (b) {
      var d = el('div', 'board');
      d.appendChild(el('span', 'tag', T[lang].region[region]));
      d.appendChild(el('h4', null, b.name));
      d.appendChild(el('p', null, b.desc[lang]));
      var a = el('a', null, b.url.replace(/^https?:\/\/(www\.)?/, '') + ' →');
      a.href = b.url; a.target = '_blank'; a.rel = 'noopener';
      d.appendChild(a);
      g.appendChild(d);
    });
  }

  function paintJobs() {
    var t = T[lang];
    var data = jobsByRegion[region];
    var box = $('jobs'); box.innerHTML = '';
    if (!data) { box.appendChild(el('p', 'loading', t.loading)); $('count').textContent = ''; return; }
    var list = data.jobs.filter(function (j) {
      if (!filter) return true;
      var hay = ((j.title || '') + ' ' + (j.company || '') + ' ' + (j.location || '')).toLowerCase();
      return hay.indexOf(filter) !== -1;
    });
    $('count').textContent = list.length + ' ' + t.of + (data.failed_sources && data.failed_sources.length ? ' · ' + t.failed + data.failed_sources.join(', ') : '');
    if (!list.length) { box.appendChild(el('p', 'loading', t.noJobs)); return; }
    list.slice(0, 500).forEach(function (j) {
      var a = el('a', 'job');
      a.href = j.url; a.target = '_blank'; a.rel = 'noopener';
      a.appendChild(el('span', 'co', j.company || ''));
      a.appendChild(el('span', 'ti', j.title || ''));
      a.appendChild(el('span', 'lo', j.location || ''));
      box.appendChild(a);
    });
  }

  function load() {
    if (jobsByRegion[region]) { paintJobs(); return; }
    paintJobs();
    fetch('/api/jobs?region=' + region)
      .then(function (r) { return r.json(); })
      .then(function (d) { jobsByRegion[region] = d; paintJobs(); })
      .catch(function () { jobsByRegion[region] = { jobs: [], failed_sources: [] }; paintJobs(); });
  }

  $('l-es').addEventListener('click', function () { lang = 'es'; paint(); });
  $('l-en').addEventListener('click', function () { lang = 'en'; paint(); });
  $('q').addEventListener('input', function (e) { filter = e.target.value.trim().toLowerCase(); paintJobs(); });
  paint();
  load();
})();
