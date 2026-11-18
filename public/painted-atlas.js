(() => {
 'use strict';
 let en=new URLSearchParams(location.search).get('lang')==='en';
 const routes=[
 ['/', 'Inicio','Home','lighthouse'],['/for-investors','Inversores','Investors','compass'],['/raising','Founders','Founders','seed'],
 ['/scouting','Radar','Radar','radar'],['/investor-map','Mapa de inversores','Investor map','map'],['/valoracion','Valoración','Valuation','scale'],
 ['/red-team-idea','Prueba de idea','Idea test','spark'],['/would-you-invest','Mirada inversora','Investor lens','eye'],['/next-10','Siguientes pasos','Next steps','steps'],
 ['/market-map','Mapa de mercado','Market map','globe'],['/dealflow','Dealflow','Dealflow','flow'],['/brief','Brief','Brief','page'],['/regulatory-watch','Regulación','Regulation','shield'],['/como-esta-hecho','El método','The method','tools'],['/empleos','Empleos','Jobs','steps'],['/red-team','Preguntas difíciles','Hard questions','question']
 ];
 const paths={lighthouse:'M19 32h10l-2-19h-6z M18 13h12V8H18z M17 8l7-5 7 5 M6 37c7-5 11 4 18 0s10-2 18 0 M18 10 3 6 M18 11 3 15',compass:'M24 4a20 20 0 1 0 0 40 20 20 0 0 0 0-40 M31 16l-4 12-11 5 5-13z',seed:'M24 40V20 M24 28C7 29 6 15 7 11c13 0 18 8 17 17 M24 22c1-12 8-18 19-17 0 13-7 18-19 17',radar:'M24 5a19 19 0 1 0 19 19 M24 13a11 11 0 1 0 11 11 M24 24 39 9 M24 24h1 M12 33h1 M15 17h1',map:'M4 9l13-5 14 5 13-5v34l-13 6-14-6-13 5z M17 4v34 M31 9v35 M11 21l8 5 12-8 7 6',scale:'M24 5v36 M13 41h22 M7 14h34 M10 14 3 30h14z M38 14l-7 16h14z',spark:'M24 3l5 14 15 7-15 6-5 15-6-15L3 24l15-7z',eye:'M3 24C14 7 34 7 45 24 34 41 14 41 3 24z M24 16a8 8 0 1 0 0 16 8 8 0 0 0 0-16',steps:'M5 40h11V29h11V18h11V7 M29 7h9v9',globe:'M24 4a20 20 0 1 0 0 40 20 20 0 0 0 0-40 M4 24h40 M24 4c-12 9-12 31 0 40 M24 4c12 9 12 31 0 40 M9 12c10 5 20 5 30 0 M9 36c10-5 20-5 30 0',flow:'M5 10h11v9H5z M32 5h11v9H32z M32 31h11v9H32z M16 14h8v21h8 M24 14V9h8',page:'M10 4h21l9 10v30H10z M31 4v11h9 M17 24h16 M17 31h16 M17 37h9',shield:'M24 3 41 10v13c0 11-17 22-17 22S7 34 7 23V10z M16 24l6 6 12-14',tools:'M7 9l32 32 M4 6l8 2 2 6-4 3-6-5z M37 5l-7 8 5 5 8-7c2 9-3 15-11 13L13 43 5 35l19-19C21 8 28 2 37 5',deck:'M8 7h30v34H8z M14 15h18 M14 22h18 M14 29h10 M14 35h14',search:'M21 5a15 15 0 1 0 0 30 15 15 0 0 0 0-30 M32 32l12 12',question:'M15 14c0-13 23-13 23 0 0 9-14 7-14 17 M24 39h.1'};
 function symbol(id){const span=document.createElement('span');span.className='atlas-symbol';span.setAttribute('aria-hidden','true');const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');svg.setAttribute('viewBox','0 0 48 48');const path=document.createElementNS(svg.namespaceURI,'path');path.setAttribute('d',paths[id]||paths.page);path.setAttribute('fill','none');path.setAttribute('stroke','currentColor');path.setAttribute('stroke-width','1.6');path.setAttribute('stroke-linecap','round');path.setAttribute('stroke-linejoin','round');svg.append(path);span.append(svg);return span;}
 const defs=document.createElementNS('http://www.w3.org/2000/svg','svg');defs.style.cssText='position:absolute;width:0;height:0;overflow:hidden';defs.innerHTML='<defs><filter id="atlas-ink-edge"><feTurbulence type="fractalNoise" baseFrequency=".055" numOctaves="3" result="grain"/><feDisplacementMap in="SourceGraphic" in2="grain" scale=".65"/></filter></defs>';document.body.append(defs);
 let pathname=location.pathname.replace(/\.html$/,'');if(pathname==='/index')pathname='/';
 let record=routes.find(r=>r[0]===pathname);
 if(pathname.startsWith('/memo/')||pathname==='/memo')record=['/memo', 'Memo de inversión','Investment memo','page'];
 if(pathname.startsWith('/ic/')||pathname==='/ic')record=['/ic','Comité de inversión','Investment committee','scale'];
 if(pathname==='/founder-intake')record=['/founder-intake','Tu siguiente paso','Your next step','seed'];
 if(!record)record=[pathname,'Scouting','Scouting','compass'];
 if(!document.body.classList.contains('painted-landing')){const main=document.querySelector('main,.wrap')||document.body;const mark=document.createElement('div');mark.className='atlas-banner';mark.append(symbol(record[3]),document.createTextNode(en?record[2]:record[1]));main.prepend(mark);}
 if(!document.body.classList.contains('painted-landing')){const object=symbol(record[3]);object.classList.add('atlas-object');document.body.append(object);}
 if(document.querySelector('#s-hero')){const sea=document.createElement('div');sea.className='atlas-sea';sea.setAttribute('aria-hidden','true');document.body.prepend(sea);}
 const chapterSymbols=['lighthouse','deck','search','page','question','compass'];
 document.querySelectorAll('#indexOverlay ol a').forEach((a,i)=>{a.prepend(symbol(chapterSymbols[i]));});
 document.querySelectorAll('section.screen').forEach((s,i)=>{const k=s.querySelector('.kicker,.word-mark');if(k)k.prepend(symbol(chapterSymbols[i+1]));});
 const marker=document.querySelector('#cmChapter');if(marker){const mark=symbol('lighthouse');marker.before(mark);const observer=new MutationObserver(()=>{const n=parseInt(marker.textContent,10)||0;mark.replaceChildren(symbol(chapterSymbols[n]).firstChild);});observer.observe(marker,{childList:true});}
 const index=document.createElement('details');index.className='atlas-directory';const summary=document.createElement('summary');summary.textContent=en?'The atlas. Every section.':'El atlas. Todas las secciones.';index.append(summary);const grid=document.createElement('div');grid.className='atlas-directory-grid';for(const [url,es,eng,id] of routes){const a=document.createElement('a');a.href=url+'?lang='+(en?'en':'es');a.append(symbol(id),document.createTextNode(en?eng:es));grid.append(a);}index.append(grid);const foot=document.querySelector('.ss-cross-navigation');(foot||document.body).before(index);
 document.querySelectorAll('.ss-cross-navigation a').forEach(a=>{const r=routes.find(r=>r[0]===new URL(a.href).pathname);if(r)a.prepend(symbol(r[3]));});
 // Material continuity is retained between documents. A short veil is the fallback on browsers without document transitions.
 document.addEventListener('click',event=>{
  const a=event.target.closest('a[href]');if(!a||event.defaultPrevented||event.metaKey||event.ctrlKey||event.shiftKey||a.target==='_blank'||a.hasAttribute('download'))return;
  const url=new URL(a.href);if(url.origin!==location.origin||url.pathname===location.pathname||url.pathname.startsWith('/api/'))return;
  if(matchMedia('(max-width:760px), (prefers-reduced-motion: reduce)').matches||('onpageswap' in window))return;
  event.preventDefault();document.body.classList.add('atlas-leaving');setTimeout(()=>location.assign(url.href),220);
 });
 window.addEventListener('pageshow',()=>document.body.classList.remove('atlas-leaving'));
 const translateAtlas=()=>{
  en=document.documentElement.lang==='en';
  const banner=document.querySelector('.atlas-banner');if(banner)banner.lastChild.textContent=en?record[2]:record[1];
  summary.textContent=en?'The atlas. Every section.':'El atlas. Todas las secciones.';
  [...grid.children].forEach((a,i)=>{a.lastChild.textContent=en?routes[i][2]:routes[i][1];a.href=routes[i][0]+'?lang='+(en?'en':'es');});
 };
 new MutationObserver(translateAtlas).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 const arrival=document.querySelector('main,.wrap,.gateway');if(arrival)arrival.classList.add('atlas-arrive');
})();
