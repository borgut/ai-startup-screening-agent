(async () => {
  const [$data, $comps] = await Promise.all([
    fetch('/valoracion-data.json').then(r => r.json()),
    fetch('/next10-data.json').then(r => r.json()),
  ]);
  let lang = new URLSearchParams(location.search).get('lang') === 'en' ? 'en' : 'es';
  const t = {
    es: {
      k:'PARA FOUNDERS', h:'¿Cuánto vale <em>tu startup?</em>', p:'Un rango, no una cifra. Dos métodos transparentes, cada supuesto editable. Si aceptas los supuestos, el rango aguanta una conversación con un fondo.',
      back:'← Volver', sector:'Sector', etapa:'Etapa', arr:'ARR actual (€)', growth:'Crecimiento anual (%)', equipo:'Equipo', mercado:'Mercado', raise:'Ronda que levantas (€)', go:'Calcular el rango →',
      sectors:[['saas','SaaS B2B'],['fintech','Fintech'],['climate','Climate / Energy'],['health','Healthtech'],['consumer','Consumer'],['devtools','DevTools / Cyber'],['otro','Otro']],
      stages:[['preseed','Pre-seed'],['seed','Seed'],['seriesA','Serie A']], teams:[['exit','Exit previo / equipo probado'],['exp','Experiencia relevante'],['first','Primer equipo']], markets:[['big','> €1.000M'],['mid','€250–1.000M'],['small','< €250M']],
      rk:'RANGO ORIENTATIVO PRE-MONEY', between:(a,b)=>`Entre <em>${a}</em> y <em>${b}</em>`, cond:'si aceptas estos supuestos. Edítalos: el rango cambia contigo.', score:'Scorecard', vc:'Método VC',
      assumptions:{base:'Mediana de etapa', arrbench:'ARR de referencia', team:'Factor equipo', market:'Factor mercado', traction:'Factor tracción', growth:'Factor crecimiento', sector:'Factor sector', multiple:'Múltiplo de salida', roi:'Retorno objetivo', years:'Años hasta salida', future:'ARR proyectado', exit:'Valor a salida'},
      compTitle:'Rondas públicas <em>comparables</em>', compNote:'Son rondas anunciadas, no valoraciones. Sirven para calibrar el tamaño y momento de la financiación, no para fingir un múltiplo que la fuente no publica.', th:['Startup','Vertical','Ronda','Fuente'], source:'Ver ↗', noVc:'Sin ARR no hay base suficiente para aplicar el método VC. Añade ARR o usa el scorecard como referencia inicial.', nextLabel:'El recorrido completo', xact:'Llevarme el rango', xactCopy:'Copiar el rango', xactLink:'Copiar enlace', copied:'Copiado ✓', next:[['/red-team-idea','Que un VC la destroce primero →'],['/investor-map','Quién invierte en ese rango →']], disclaimer:'Herramienta orientativa, no una tasación ni asesoramiento financiero. El rango depende de supuestos editables y datos aportados por ti. Una valoración real también depende de términos, dilución, preferencia de liquidación, geografía y negociación.',
    },
    en: {
      k:'FOR FOUNDERS', h:'What is <em>your startup</em> worth?', p:'A range, not a single number. Two transparent methods, every assumption editable. If the assumptions hold, the range can hold up in a fund conversation.',
      back:'← Back', sector:'Sector', etapa:'Stage', arr:'Current ARR (€)', growth:'Annual growth (%)', equipo:'Team', mercado:'Market', raise:'Round being raised (€)', go:'Calculate the range →',
      sectors:[['saas','B2B SaaS'],['fintech','Fintech'],['climate','Climate / Energy'],['health','Healthtech'],['consumer','Consumer'],['devtools','DevTools / Cyber'],['otro','Other']],
      stages:[['preseed','Pre-seed'],['seed','Seed'],['seriesA','Series A']], teams:[['exit','Prior exit / proven team'],['exp','Relevant experience'],['first','First-time team']], markets:[['big','> €1bn'],['mid','€250m–1bn'],['small','< €250m']],
      rk:'INDICATIVE PRE-MONEY RANGE', between:(a,b)=>`Between <em>${a}</em> and <em>${b}</em>`, cond:'if you accept these assumptions. Edit them: the range moves with you.', score:'Scorecard', vc:'VC method',
      assumptions:{base:'Stage median', arrbench:'ARR benchmark', team:'Team factor', market:'Market factor', traction:'Traction factor', growth:'Growth factor', sector:'Sector factor', multiple:'Exit multiple', roi:'Target return', years:'Years to exit', future:'Projected ARR', exit:'Exit value'},
      compTitle:'Public <em>comparable rounds</em>', compNote:'These are announced rounds, not valuations. They calibrate financing size and timing; they do not invent a multiple the source did not publish.', th:['Startup','Vertical','Round','Source'], source:'View ↗', noVc:'Without ARR there is not enough basis for the VC method. Add ARR or use scorecard as an initial reference.', nextLabel:'The full journey', xact:'Take the range with you', xactCopy:'Copy the range', xactLink:'Copy link', copied:'Copied ✓', next:[['/red-team-idea','Have a VC tear it apart first →'],['/investor-map','Who invests at that range →']], disclaimer:'Indicative tool, not a valuation or financial advice. The range depends on editable assumptions and the data you provide. A real valuation also depends on terms, dilution, liquidation preference, geography and negotiation.',
    }
  };
  const $ = id => document.getElementById(id);
  const setSelect = (id, rows) => { $(id).innerHTML = rows.map(([v,l])=>`<option value="${v}">${l}</option>`).join(''); };
  const money = n => {
    if (!Number.isFinite(n) || n < 0) return 'sin datos';
    if (n >= 1e6) return (n/1e6).toLocaleString(lang==='es'?'es-ES':'en-GB',{maximumFractionDigits:1})+' M€';
    return Math.round(n/1000).toLocaleString(lang==='es'?'es-ES':'en-GB')+' k€';
  };
  const num = id => Math.max(0, Number($(id).value) || 0);
  function copy() {
    const x=t[lang]; document.documentElement.lang=lang;
    $('k').textContent=x.k; $('h').innerHTML=x.h; $('p').textContent=x.p; $('back').textContent=x.back; $('back').href='/raising?lang='+lang;
    [['f-sector','sector'],['f-etapa','etapa'],['f-arr','arr'],['f-growth','growth'],['f-equipo','equipo'],['f-mercado','mercado'],['f-raise','raise']].forEach(([id,k])=>$(id).textContent=x[k]);
    setSelect('in-sector',x.sectors); setSelect('in-etapa',x.stages); setSelect('in-equipo',x.teams); setSelect('in-mercado',x.markets);
    $('go').textContent=x.go; $('l-es').classList.toggle('active',lang==='es'); $('l-en').classList.toggle('active',lang==='en');
  }
  const editable = (label,key,value,suffix='') => `<div class="assume"><b>${label}</b><span><input data-a="${key}" type="number" min="0" step="0.1" value="${value}">${suffix}</span></div>`;
  const readA = (key, fallback) => { const e=document.querySelector(`[data-a="${key}"]`); return e ? Math.max(0,Number(e.value)||0) : fallback; };
  function calculate(fromAssumptions=false) {
    const x=t[lang], stage=$('in-etapa').value, sector=$('in-sector').value, arr=num('in-arr'), growth=num('in-growth'), raise=num('in-raise');
    const team=$('in-equipo').value, market=$('in-mercado').value;
    const base=readA('base',$data.basePreMoney[stage]);
    const arrbench=readA('arrbench',$data.arrBenchmark[stage]);
    const multiple=readA('multiple',$data.exitMultiple[sector]);
    const roi=readA('roi',$data.roiTarget[stage]);
    const years=readA('years',$data.yearsToExit);
    const teamF=$data.mult.equipo[team], marketF=$data.mult.mercado[market];
    const growthF=growth>=150?1.4:growth>=60?1.1:.85;
    const tractionF=arrbench ? Math.max(.7,Math.min(1.5,arr/arrbench)) : (arr>0?1.25:1);
    const sectorF=Math.max(.8,Math.min(1.3,$data.exitMultiple[sector]/5));
    const w=$data.weights;
    const factor=w.equipo*teamF+w.mercado*marketF+w.traccion*tractionF+w.crecimiento*growthF+w.sector*sectorF;
    const scoreValue=base*factor;
    // Growth tapers instead of compounding today's rate unchanged for six years.
    const g=Math.min(growth/100,.8), first=Math.min(years,3), rest=Math.max(0,years-3);
    const futureARR=arr*Math.pow(1+g,first)*Math.pow(1.25,rest);
    const exitValue=futureARR*multiple;
    const vcValue=arr>0&&roi>0 ? Math.max(0,exitValue/roi-raise) : NaN;
    let low,high;
    if(Number.isFinite(vcValue)&&vcValue>0){ low=Math.min(scoreValue,vcValue)*.85; high=Math.max(scoreValue,vcValue)*1.15; }
    else { low=scoreValue*.8; high=scoreValue*1.2; }
    $('result').classList.remove('hidden'); $('r-kicker').textContent=x.rk; $('r-range').innerHTML=x.between(money(low),money(high)); $('r-cond').textContent=x.cond;
    $('m1-t').textContent=x.score; $('m1-val').textContent=money(scoreValue);
    $('m2-t').textContent=x.vc; $('m2-val').textContent=Number.isFinite(vcValue)&&vcValue>0?money(vcValue):'sin datos';
    $('m1-assume').innerHTML = editable(x.assumptions.base,'base',Math.round(base),' €')+editable(x.assumptions.arrbench,'arrbench',Math.round(arrbench),' €')+
      `<div class="assume"><b>${x.assumptions.team}</b><span class="ro">${teamF.toFixed(2)}×</span></div><div class="assume"><b>${x.assumptions.market}</b><span class="ro">${marketF.toFixed(2)}×</span></div><div class="assume"><b>${x.assumptions.traction}</b><span class="ro">${tractionF.toFixed(2)}×</span></div><div class="assume"><b>${x.assumptions.growth}</b><span class="ro">${growthF.toFixed(2)}×</span></div><div class="assume"><b>${x.assumptions.sector}</b><span class="ro">${sectorF.toFixed(2)}×</span></div>`;
    $('m2-assume').innerHTML = arr>0 ? editable(x.assumptions.multiple,'multiple',multiple,'×')+editable(x.assumptions.roi,'roi',roi,'×')+editable(x.assumptions.years,'years',years,'')+`<div class="assume"><b>${x.assumptions.future}</b><span class="ro">${money(futureARR)}</span></div><div class="assume"><b>${x.assumptions.exit}</b><span class="ro">${money(exitValue)}</span></div>` : `<p class="nodata">${x.noVc}</p>`;
    document.querySelectorAll('[data-a]').forEach(e=>e.oninput=()=>calculate(true));
    $('c-t').innerHTML=x.compTitle; $('c-note').textContent=x.compNote; x.th.forEach((v,i)=>$('th'+(i+1)).textContent=v);
    const words={saas:['SaaS','SalesTech','Future of work','E-commerce','Supply-chain'],fintech:['Fintech'],climate:['Climate','Energy'],health:['Health'],consumer:['Consumer'],devtools:['DevTools','Cyber'],otro:[]}[sector];
    let rows=$comps.companies.filter(c=>!words.length||words.some(w=>(c.vertical||'').toLowerCase().includes(w.toLowerCase())));
    if(rows.length<3) rows=$comps.companies.filter(c=>c.stage.toLowerCase().replace('serie ','series')===stage.toLowerCase() || c.stage.toLowerCase()===(stage==='seriesA'?'series a':stage)).slice(0,4);
    if(rows.length<3) rows=$comps.companies.slice(0,4); else rows=rows.slice(0,5);
    $('comps-body').innerHTML=rows.map(c=>`<tr><td>${c.name}</td><td>${c.vertical}</td><td>${c.stage} · ${c.round}</td><td><a href="${c.source}" target="_blank" rel="noopener">${x.source}</a></td></tr>`).join('');
    $('disclaimer').textContent=x.disclaimer;
    const xa=$('xact'); xa.classList.remove('open');
    $('xact-go').textContent=x.xact; $('xact-copy').textContent=x.xactCopy; $('xact-link').textContent=x.xactLink;
    $('xact-go').onclick=()=>xa.classList.toggle('open');
    const done=(b)=>{const o=b.textContent; b.textContent=x.copied; setTimeout(()=>{b.textContent=o;},1600);};
    $('xact-copy').onclick=(e)=>{navigator.clipboard&&navigator.clipboard.writeText(document.querySelector('#r-range').textContent+' — '+x.cond); done(e.target);};
    $('xact-link').onclick=(e)=>{navigator.clipboard&&navigator.clipboard.writeText(location.href); done(e.target);};
    const nx=$('next'); nx.innerHTML=''; nx.appendChild(Object.assign(document.createElement('b'),{textContent:x.nextLabel}));
    x.next.forEach(p=>{const a=document.createElement('a'); a.href=p[0]; a.textContent=p[1]; nx.appendChild(a);});
  }
  $('go').onclick=()=>{calculate(); $('result').scrollIntoView({behavior:'smooth'});};
  $('l-es').onclick=()=>{lang='es';copy();}; $('l-en').onclick=()=>{lang='en';copy();};
  copy();
})();
