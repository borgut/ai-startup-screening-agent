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
      hCo: 'Empresa', hTi: 'Vacante', hLo: 'Localización',
      unc: 'Ubicación sin confirmar', allCo: 'Todas las empresas', allLo: 'Todas las ubicaciones', noLo: 'Sin ubicación', reset: 'Restablecer filtros', offers: 'ofertas', offer: 'Oferta', shown: 'de',
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
      hCo: 'Company', hTi: 'Opening', hLo: 'Location',
      unc: 'Location unconfirmed', allCo: 'All companies', allLo: 'All locations', noLo: 'No location', reset: 'Reset filters', offers: 'postings', offer: 'Posting', shown: 'of',
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
  var filter = '', fCo = '', fLo = '';
  function city(j) { if (j.loc_unconfirmed) return '__unc'; return (j.location || '').split('\u00b7')[0].trim(); }

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

  function fillSelect(sel, all, values, current) {
    sel.innerHTML = '';
    var o = el('option', null, all); o.value = ''; sel.appendChild(o);
    values.forEach(function (v) { var x = el('option', null, v[1]); x.value = v[0]; sel.appendChild(x); });
    sel.value = current;
    if (sel.value !== current) sel.value = '';
  }

  function paintJobs() {
    var t = T[lang];
    var data = jobsByRegion[region];
    var box = $('jobs'); box.innerHTML = '';
    $('h-co').textContent = t.hCo; $('h-ti').textContent = t.hTi; $('h-lo').textContent = t.hLo;
    $('f-co-l').textContent = t.hCo; $('f-lo-l').textContent = t.hLo; $('f-reset').textContent = t.reset;
    if (!data) { box.appendChild(el('p', 'loading', t.loading)); $('count').textContent = ''; return; }
    var all = data.jobs;
    var cos = {}, los = {};
    all.forEach(function (j) { cos[j.company] = (cos[j.company] || 0) + 1; var c = city(j); los[c] = (los[c] || 0) + 1; });
    var coList = Object.keys(cos).sort(function (a, b) { return a.localeCompare(b); }).map(function (k) { return [k, k + ' (' + cos[k] + ')']; });
    var loList = Object.keys(los).filter(function (k) { return k && k !== '__unc'; }).sort(function (a, b) { return a.localeCompare(b); }).map(function (k) { return [k, k + ' (' + los[k] + ')']; });
    if (los['__unc']) loList.push(['__unc', t.unc + ' (' + los['__unc'] + ')']);
    if (los['']) loList.push(['__none', t.noLo + ' (' + los[''] + ')']);
    fillSelect($('f-co'), t.allCo, coList, fCo);
    fillSelect($('f-lo'), t.allLo, loList, fLo);
    fCo = $('f-co').value; fLo = $('f-lo').value;
    $('f-reset').hidden = !(fCo || fLo || filter);
    var list = all.filter(function (j) {
      if (fCo && j.company !== fCo) return false;
      if (fLo && (fLo === '__none' ? city(j) !== '' : city(j) !== fLo)) return false;
      if (!filter) return true;
      var hay = ((j.title || '') + ' ' + (j.company || '') + ' ' + (j.loc_unconfirmed ? '' : (j.location || ''))).toLowerCase();
      return hay.indexOf(filter) !== -1;
    });
    var cnt = list.length + (list.length !== all.length ? ' ' + t.shown + ' ' + all.length : '') + ' ' + t.of;
    $('count').textContent = cnt + (data.failed_sources && data.failed_sources.length ? ' \u00b7 ' + t.failed + data.failed_sources.join(', ') : '');
    if (!list.length) { box.appendChild(el('p', 'loading', t.noJobs)); return; }
    list.slice(0, 500).forEach(function (j) {
      if (j.tr) { var pick = j.tr.filter(function (x) { return x.lang === lang; })[0] || j.tr[0]; j = Object.assign({}, j, { title: pick.title, url: pick.url }); }
      var multi = j.variants && j.variants.length > 1;
      var a = el(multi ? 'div' : 'a', 'job');
      if (!multi) { a.href = j.url; a.target = '_blank'; a.rel = 'noopener'; }
      a.appendChild(el('span', 'co', j.company || ''));
      var ti = el('span', 'ti');
      if (multi) {
        var main = el('a', null, j.title || ''); main.href = j.variants[0]; main.target = '_blank'; main.rel = 'noopener'; ti.appendChild(main);
        var vs = el('span', 'vs'); vs.appendChild(document.createTextNode(j.variants.length + ' ' + t.offers + ':'));
        j.variants.forEach(function (u, i) { var l = el('a', null, String(i + 1)); l.href = u; l.target = '_blank'; l.rel = 'noopener'; l.setAttribute('aria-label', t.offer + ' ' + (i + 1)); vs.appendChild(l); });
        ti.appendChild(vs);
      } else ti.textContent = j.title || '';
      a.appendChild(ti);
      a.appendChild(el('span', 'lo', j.loc_unconfirmed ? t.unc : (j.location || '')));
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
  $('f-co').addEventListener('change', function (e) { fCo = e.target.value; paintJobs(); });
  $('f-lo').addEventListener('change', function (e) { fLo = e.target.value; paintJobs(); });
  $('f-reset').addEventListener('click', function () { fCo = ''; fLo = ''; filter = ''; $('q').value = ''; paintJobs(); });
  paint();
  load();
})();
