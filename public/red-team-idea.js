/* Red team de ideas para founders: formulario + render del memo. ES/EN. */
(function () {
  var SECTORES = ['B2B SaaS', 'Fintech', 'Consumer', 'Marketplace', 'Deeptech', 'AI', 'Health', 'Otro'];
  var ETAPAS = { es: ['Solo una idea', 'MVP sin usuarios', 'MVP con usuarios', 'Ingresos iniciales'],
                 en: ['Just an idea', 'MVP, no users', 'MVP with users', 'Early revenue'] };
  var RIVALES = { es: [['vc', 'Un VC early-stage (estándar)'], ['amigo', 'Un ángel conocido (benevolente)'], ['serieb', 'Un partner de Serie B (sin piedad)']],
                  en: [['vc', 'An early-stage VC (standard)'], ['amigo', 'An angel you know (kind)'], ['serieb', 'A Series B partner (merciless)']] };

  var T = {
    es: {
      kicker: 'Red team · Para founders',
      h1: 'Tu idea, <em>destrozada</em> antes que por un VC.',
      lede: 'Pega tu web o cuenta la idea en dos frases. Te devolvemos lo que tendrías que demostrar, quién murió intentándolo, la objeción que te va a hacer un VC y el experimento más barato para la semana que viene. Sin notas numéricas: el juicio va en texto.',
      lDesc: 'La idea',
      lUrl: 'Web (opcional)',
      lSector: 'Sector',
      lEtapa: 'Etapa',
      lRival: 'Quién te destroza',
      nextLabel: 'Si la idea sobrevive',
      next: [['/valoracion', 'Ponle un rango →'], ['/investor-map', 'Quién la financiaría →']],
      go: 'Ejecutar el red team',
      going: 'Desmontando la idea… (30–60 s)',
      needInput: 'Cuenta la idea o pega la web: uno de los dos es obligatorio.',
      hClaims: 'Lo que tendrías que <em>demostrar</em>',
      nClaims: 'Ordenado de más difícil a más fácil de demostrar. Si el primero no cierra, los demás no importan.',
      hMuertos: 'Quién <em>murió</em> intentándolo',
      nMuertos: 'Empresas reales que intentaron algo parecido. Aprender de sus autopsias es gratis; repetirlas, no.',
      hObj: 'La objeción que te va a hacer un VC',
      hExp: 'El experimento más <em>barato</em> para la semana que viene',
      coste: 'Coste estimado',
      senal: 'Señal de éxito',
      hRisk: 'Semáforo de <em>riesgos</em>',
      dif: { alta: 'difícil', media: 'media', baja: 'fácil' },
      tip: { alta: 'Lo que más tarda en demostrarse. Si esto no cierra, lo demás no importa.', media: 'Demostrable en semanas, no en años.', baja: 'Casi gratis de demostrar; no es donde muere la idea.' },
      nivel: { alto: 'alto', medio: 'medio', bajo: 'bajo' },
      fuentes: 'Fuentes',
      foot: 'Esto no es una nota ni un diagnóstico cerrado: es la lista de cosas que un VC va a poner en duda antes que tú. Generado con IA y verificación web; confirma los datos que vayas a usar.',
      paused: 'El análisis al momento está en pausa. Mientras tanto, aquí tienes un ejemplo real de red team sobre la idea “entrega de comida casera en 20 minutos en Madrid”.',
      verFuente: 'Fuente →'
    },
    en: {
      kicker: 'Red team · For founders',
      h1: 'Your idea, <em>torn apart</em> before a VC does it.',
      lede: 'Paste your site or describe the idea in two sentences. You get what you would have to prove, who died trying, the objection a VC will raise, and the cheapest experiment for next week. No numeric scores: the judgment is in the text.',
      lDesc: 'The idea',
      lUrl: 'Website (optional)',
      lSector: 'Sector',
      lEtapa: 'Stage',
      lRival: 'Who tears it apart',
      nextLabel: 'If the idea survives',
      next: [['/valoracion', 'Put a range on it →'], ['/investor-map', 'Who would fund it →']],
      go: 'Run the red team',
      going: 'Taking the idea apart… (30–60 s)',
      needInput: 'Describe the idea or paste the site: one of the two is required.',
      hClaims: 'What you would have to <em>prove</em>',
      nClaims: 'Ordered from hardest to easiest to prove. If the first one does not hold, the rest do not matter.',
      hMuertos: 'Who <em>died</em> trying',
      nMuertos: 'Real companies that tried something similar. Learning from their autopsies is free; repeating them is not.',
      hObj: 'The objection a VC will raise',
      hExp: 'The <em>cheapest</em> experiment for next week',
      coste: 'Estimated cost',
      senal: 'Success signal',
      hRisk: 'Risk <em>semaphore</em>',
      dif: { alta: 'hard', media: 'medium', baja: 'easy' },
      tip: { alta: 'The hardest to prove. If this does not hold, the rest does not matter.', media: 'Provable in weeks, not years.', baja: 'Nearly free to prove; not where the idea dies.' },
      nivel: { alto: 'high', medio: 'medium', bajo: 'low' },
      fuentes: 'Sources',
      foot: 'This is not a score or a closed diagnosis: it is the list of things a VC will doubt before you do. Generated with AI and web verification; confirm any data you plan to use.',
      paused: 'Live analysis is paused right now. Meanwhile, here is a real red-team example on the idea “home-cooked meal delivery in 20 minutes in Madrid”.',
      verFuente: 'Source →'
    }
  };

  var EXAMPLE = {
    es: {
      idea_resumen: 'Entrega de comida cocinada en casa en 20 minutos en Madrid: la promesa es mejor producto que un restaurante de delivery, a precio parecido, con cocineros caseros como oferta.',
      claims: [
        { claim: 'La economía unitaria cierra a 20 minutos', dificultad: 'alta', por_que: 'Rider + cocinero + empaquetado tienen que salir de un ticket de 12–15 €. Sin densidad de pedidos por barrio, el rider espera más de lo que reparte.' },
        { claim: 'Hay demanda real sin descuentos', dificultad: 'alta', por_que: 'La categoría se movió históricamente a base de cupones. La prueba es recompra a precio pleno en semana 3, no pedidos de lanzamiento.' },
        { claim: 'Puedes reclutar cocineros caseros con margen para ellos y para ti', dificultad: 'media', por_que: 'Si el cocinero gana menos que en alternativas, la oferta se cae; si gana más, tu margen desaparece.' },
        { claim: 'La regulación te deja operar', dificultad: 'media', por_que: 'Cocinar comida para terceros en cocinas domésticas no licenciadas es un problema sanitario y legal en España.' },
        { claim: 'La tecnología se puede construir', dificultad: 'baja', por_que: 'Una app de pedidos es commodity; no es donde muere esta idea.' }
      ],
      muertos: [
        { nombre: 'Take Eat Easy', que_hacian: 'Delivery de restaurantes en Europa, modelo casi idéntico a Deliveroo.', que_paso: 'Quebró en 2016 tras levantar ~16 M€: el coste de reparto por pedido nunca bajó lo suficiente y el capital se acabó antes que la densidad llegara.', fuente: 'https://techcrunch.com/2016/07/26/european-restaurant-delivery-startup-take-eat-easy-ceases-trading-as-it-tries-to-find-a-buyer/' },
        { nombre: 'Sprig', que_hacian: 'Comida preparada en cocina propia, entregada en minutos en San Francisco.', que_paso: 'Cerró en 2017 con ~57 M$ levantados: cocinar y repartir a la vez son dos negocios de bajo margen; la suma no cerró ni con escala.', fuente: 'https://www.bloomberg.com/news/articles/2017-05-26/food-delivery-startup-sprig-shuts-down-as-it-fails-to-find-buyer' },
        { nombre: 'Homejoy', que_hacian: 'Servicio a domicilio bajo demanda (limpieza), misma mecánica de marketplace de oferta dispersa.', que_paso: 'Cerró en 2015: adquirir clientes costaba más de lo que cada cliente pagaba en su vida, y retener oferta buena era igual de caro.', fuente: 'https://techcrunch.com/2015/07/17/homejoy-is-shutting-down-at-the-end-of-the-month/' }
      ],
      objecion_vc: 'Deliveroo, Glovo y Just Eat quemaron cientos de millones en esta categoría con más capital, más marca y más densidad de la que tendrás jamás. ¿Qué sabes tú que ellos no supieron?',
      experimento: { que: 'Un barrio de Madrid, 10 cocineros, 2 riders freelance y pedidos por WhatsApp con una landing. Dos fines de semana, sin app.', coste_estimado: 'Menos de 500 €', senal_de_exito: '30 pedidos al día con margen de más de 2 € por pedido después de pagar rider y cocinero, y recompra la segunda semana sin descuento.' },
      riesgos: [
        { nivel: 'alto', texto: 'Economía unitaria: la promesa de 20 minutos y el precio de 12–15 € pelean entre sí.' },
        { nivel: 'alto', texto: 'Regulación: cocinas domésticas cocinando para terceros sin licencia sanitaria.' },
        { nivel: 'medio', texto: 'Demanda sin descuentos: la categoría educó al cliente a cupones.' },
        { nivel: 'bajo', texto: 'Tecnología: pedidos por app está resuelto cien veces.' }
      ],
      fuentes: [
        'https://techcrunch.com/2016/07/26/european-restaurant-delivery-startup-take-eat-easy-ceases-trading-as-it-tries-to-find-a-buyer/',
        'https://www.bloomberg.com/news/articles/2017-05-26/food-delivery-startup-sprig-shuts-down-as-it-fails-to-find-buyer',
        'https://techcrunch.com/2015/07/17/homejoy-is-shutting-down-at-the-end-of-the-month/'
      ]
    },
    en: {
      idea_resumen: 'Home-cooked meal delivery in 20 minutes in Madrid: the promise is a better product than restaurant delivery at a similar price, with home cooks as supply.',
      claims: [
        { claim: 'Unit economics work at 20 minutes', dificultad: 'alta', por_que: 'Rider + cook + packaging have to come out of a €12–15 basket. Without order density per neighbourhood, the rider waits more than they deliver.' },
        { claim: 'There is real demand without discounts', dificultad: 'alta', por_que: 'The category historically moved on coupons. The proof is full-price reorder in week 3, not launch orders.' },
        { claim: 'You can recruit home cooks with margin for them and for you', dificultad: 'media', por_que: 'If the cook earns less than their alternatives, supply collapses; if more, your margin disappears.' },
        { claim: 'Regulation lets you operate', dificultad: 'media', por_que: 'Cooking food for third parties in unlicensed home kitchens is a health and legal problem in Spain.' },
        { claim: 'The technology can be built', dificultad: 'baja', por_que: 'An ordering app is a commodity; that is not where this idea dies.' }
      ],
      muertos: [
        { nombre: 'Take Eat Easy', que_hacian: 'Restaurant delivery in Europe, nearly identical to Deliveroo.', que_paso: 'Went bankrupt in 2016 after raising ~€16M: the per-order delivery cost never dropped enough and the capital ran out before density arrived.', fuente: 'https://techcrunch.com/2016/07/26/european-restaurant-delivery-startup-take-eat-easy-ceases-trading-as-it-tries-to-find-a-buyer/' },
        { nombre: 'Sprig', que_hacian: 'Meals cooked in-house, delivered in minutes in San Francisco.', que_paso: 'Shut down in 2017 with ~$57M raised: cooking and delivering at once are two low-margin businesses; the sum never closed, even at scale.', fuente: 'https://www.bloomberg.com/news/articles/2017-05-26/food-delivery-startup-sprig-shuts-down-as-it-fails-to-find-buyer' },
        { nombre: 'Homejoy', que_hacian: 'On-demand home service (cleaning), same marketplace mechanics with dispersed supply.', que_paso: 'Shut down in 2015: acquiring a customer cost more than their lifetime spend, and retaining good supply was just as expensive.', fuente: 'https://techcrunch.com/2015/07/17/homejoy-is-shutting-down-at-the-end-of-the-month/' }
      ],
      objecion_vc: 'Deliveroo, Glovo and Just Eat burned hundreds of millions in this category with more capital, more brand and more density than you will ever have. What do you know that they did not?',
      experimento: { que: 'One Madrid neighbourhood, 10 cooks, 2 freelance riders, orders via WhatsApp with a landing page. Two weekends, no app.', coste_estimado: 'Under €500', senal_de_exito: '30 orders a day with more than €2 margin per order after paying rider and cook, plus week-two reorder with no discount.' },
      riesgos: [
        { nivel: 'alto', texto: 'Unit economics: the 20-minute promise and the €12–15 price fight each other.' },
        { nivel: 'alto', texto: 'Regulation: unlicensed home kitchens cooking for third parties.' },
        { nivel: 'medio', texto: 'Demand without discounts: the category trained customers to expect coupons.' },
        { nivel: 'bajo', texto: 'Technology: app ordering has been solved a hundred times.' }
      ],
      fuentes: [
        'https://techcrunch.com/2016/07/26/european-restaurant-delivery-startup-take-eat-easy-ceases-trading-as-it-tries-to-find-a-buyer/',
        'https://www.bloomberg.com/news/articles/2017-05-26/food-delivery-startup-sprig-shuts-down-as-it-fails-to-find-buyer',
        'https://techcrunch.com/2015/07/17/homejoy-is-shutting-down-at-the-end-of-the-month/'
      ]
    }
  };

  var lang = (new URLSearchParams(location.search)).get('lang') === 'en' ? 'en' : 'es';
  var currentMemo = null;

  function $(id) { return document.getElementById(id); }
  function el(tag, cls, text) { var e = document.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }
  function dot(color) { var d = el('span', 'dot'); d.style.background = color; return d; }
  var DIFCOLOR = { alta: 'var(--red)', media: 'var(--amber)', baja: 'var(--green)' };
  var RISKCOLOR = { alto: 'var(--red)', medio: 'var(--amber)', bajo: 'var(--green)' };
  var DIFORDER = { alta: 0, media: 1, baja: 2 };

  var ftip = null;
  function ensureTip() {
    if (!ftip) { ftip = el('div', 'ftip'); document.body.appendChild(ftip); }
    return ftip;
  }
  function bindTips() {
    var tp = ensureTip();
    document.querySelectorAll('.claim .tag').forEach(function (tag) {
      tag.addEventListener('mouseenter', function () {
        tp.textContent = tag.getAttribute('data-tip') || '';
        var r = tag.getBoundingClientRect();
        tp.style.left = Math.max(12, r.left - 190) + 'px';
        tp.style.top = (r.top - 14) + 'px';
        tp.style.transform = 'translateY(-100%)';
        tp.classList.add('on');
      });
      tag.addEventListener('mouseleave', function () { tp.classList.remove('on'); });
    });
  }

  function paint() {
    var t = T[lang];
    document.documentElement.lang = lang;
    $('l-es').classList.toggle('active', lang === 'es');
    $('l-en').classList.toggle('active', lang === 'en');
    $('k-kicker').textContent = t.kicker;
    $('k-h1').innerHTML = t.h1;
    $('k-lede').textContent = t.lede;
    $('k-l-desc').textContent = t.lDesc;
    $('k-l-url').textContent = t.lUrl;
    $('k-l-sector').textContent = t.lSector;
    $('k-l-etapa').textContent = t.lEtapa;
    $('k-l-rival').textContent = t.lRival;
    $('b-go').textContent = t.go;
    $('k-h-claims').innerHTML = t.hClaims;
    $('k-n-claims').textContent = t.nClaims;
    $('k-h-muertos').innerHTML = t.hMuertos;
    $('k-n-muertos').textContent = t.nMuertos;
    $('k-h-obj').textContent = t.hObj;
    $('k-h-exp').innerHTML = t.hExp;
    $('k-coste').textContent = t.coste;
    $('k-senal').textContent = t.senal;
    $('k-h-risk').innerHTML = t.hRisk;
    $('k-foot').textContent = t.foot;
    var fs = $('f-sector');
    if (!fs.options.length) SECTORES.forEach(function (s) { fs.appendChild(el('option', null, s)); });
    var fe = $('f-etapa');
    fe.innerHTML = '';
    ETAPAS[lang].forEach(function (s) { fe.appendChild(el('option', null, s)); });
    var fr = $('f-rival');
    fr.innerHTML = '';
    RIVALES[lang].forEach(function (p) { var o = el('option', null, p[1]); o.value = p[0]; fr.appendChild(o); });
    var nx = $('next'); nx.innerHTML = '';
    nx.appendChild(el('b', null, t.nextLabel));
    t.next.forEach(function (p, i) { var a = el('a'); a.href = p[0]; var n = el('span', 'num', '0' + (i + 1)); var s = el('span', null, p[1].replace(/\s*\u2192\s*$/, '')); a.appendChild(n); a.appendChild(s); nx.appendChild(a); });
    if (currentMemo === EXAMPLE.es || currentMemo === EXAMPLE.en) currentMemo = EXAMPLE[lang];
    if (currentMemo) render(currentMemo);
  }

  function render(m) {
    var t = T[lang];
    $('r-sum').textContent = m.idea_resumen || '';
    var claims = (m.claims || []).slice().sort(function (a, b) { return (DIFORDER[a.dificultad] != null ? DIFORDER[a.dificultad] : 1) - (DIFORDER[b.dificultad] != null ? DIFORDER[b.dificultad] : 1); });
    var c = $('r-claims'); c.innerHTML = '';
    claims.forEach(function (x) {
      var row = el('div', 'claim');
      row.appendChild(dot(DIFCOLOR[x.dificultad] || 'var(--amber)'));
      var body = el('div');
      body.appendChild(el('h4', null, x.claim));
      body.appendChild(el('p', null, x.por_que));
      row.appendChild(body);
      var tag = el('span', 'tag', t.dif[x.dificultad] || '');
      tag.setAttribute('data-tip', t.tip[x.dificultad] || '');
      row.appendChild(tag);
      c.appendChild(row);
    });
    bindTips();
    var md = $('r-muertos'); md.innerHTML = '';
    (m.muertos || []).forEach(function (x) {
      var row = el('div', 'muerto');
      row.appendChild(el('h4', null, x.nombre));
      row.appendChild(el('p', 'did', x.que_hacian));
      row.appendChild(el('p', 'end', x.que_paso));
      if (x.fuente && /^https?:\/\//.test(x.fuente)) {
        var a = el('a', null, t.verFuente); a.href = x.fuente; a.target = '_blank'; a.rel = 'noopener';
        row.appendChild(a);
      }
      md.appendChild(row);
    });
    $('r-obj').textContent = m.objecion_vc || '';
    $('r-exp-what').textContent = (m.experimento && m.experimento.que) || '';
    $('r-exp-coste').textContent = (m.experimento && m.experimento.coste_estimado) || '';
    $('r-exp-senal').textContent = (m.experimento && m.experimento.senal_de_exito) || '';
    var rk = $('r-risks'); rk.innerHTML = '';
    (m.riesgos || []).forEach(function (x) {
      var row = el('div', 'risk');
      row.appendChild(dot(RISKCOLOR[x.nivel] || 'var(--amber)'));
      row.appendChild(el('span', null, (t.nivel[x.nivel] ? t.nivel[x.nivel] + ' — ' : '') + (x.texto || '')));
      rk.appendChild(row);
    });
    var fu = $('r-fuentes'); fu.innerHTML = '';
    var urls = (m.fuentes || []).filter(function (u) { return /^https?:\/\//.test(u); });
    if (urls.length) {
      fu.appendChild(el('b', null, t.fuentes + ': '));
      urls.forEach(function (u, i) {
        if (i) fu.appendChild(document.createTextNode(' · '));
        var a = el('a', null, u.replace(/^https?:\/\/(www\.)?/, '').split('/')[0]);
        a.href = u; a.target = '_blank'; a.rel = 'noopener';
        fu.appendChild(a);
      });
    }
    $('result').classList.remove('hidden');
  }

  function go() {
    var t = T[lang];
    $('err').textContent = '';
    $('paused').classList.add('hidden');
    var desc = $('f-desc').value.trim();
    var url = $('f-url').value.trim();
    if (!desc && !url) { $('err').textContent = t.needInput; return; }
    var btn = $('b-go');
    btn.disabled = true; btn.textContent = t.going;
    fetch('/api/redteam', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: url, descripcion: desc, sector: $('f-sector').value, etapa: $('f-etapa').value, adversario: $('f-rival').value, lang: lang })
    }).then(function (r) { return r.json().then(function (j) { return { status: r.status, body: j }; }); })
      .then(function (res) {
        if (res.status === 200 && res.body.memo) {
          currentMemo = res.body.memo;
          render(currentMemo);
          $('result').scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else if (res.body && res.body.code === 'NO_API_KEY') {
          $('paused').textContent = t.paused;
          $('paused').classList.remove('hidden');
          currentMemo = EXAMPLE[lang];
          render(currentMemo);
          $('result').scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          $('err').textContent = (res.body && res.body.error) || 'Error';
        }
      })
      .catch(function () { $('err').textContent = 'Error'; })
      .finally(function () { btn.disabled = false; btn.textContent = t.go; });
  }

  $('l-es').addEventListener('click', function () { lang = 'es'; paint(); });
  $('l-en').addEventListener('click', function () { lang = 'en'; paint(); });
  $('b-go').addEventListener('click', go);
  paint();
})();
