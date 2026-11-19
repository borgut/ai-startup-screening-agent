(()=>{'use strict';
const lang=()=>document.documentElement.lang==='en';
const asset=id=>'/art/'+id+'.webp';
function object(id,cls=''){const i=document.createElement('img');i.src=asset(id);i.alt='';i.setAttribute('aria-hidden','true');i.className=cls;i.decoding='async';return i;}
function objectFor(path){if(path==='/')return'boat';if(/valoracion|regulatory/.test(path))return'evidence';if(/raising|founder|red-team-idea|next-10|empleos/.test(path))return'boat';if(/scouting|dealflow|regulatory/.test(path))return'signal';if(/memo|ic\/|brief|red-team|would-you-invest|como-esta-hecho/.test(path))return'evidence';return'compass';}
const pageObject=objectFor(location.pathname);document.body.dataset.artObject=pageObject;
document.querySelectorAll('.atlas-banner>.atlas-symbol').forEach(el=>el.replaceWith(object(pageObject,'art-banner-object')));
 document.querySelectorAll('#indexOverlay a .atlas-symbol').forEach((el,i)=>el.replaceWith(object(['boat','boat','evidence','evidence','evidence','compass'][i]||'compass','art-chapter-object')));
 document.querySelector('.atlas-object')?.remove();document.querySelector('.atlas-sea')?.remove();
const title=document.querySelector('h1');if(title&&!document.body.classList.contains('painted-landing')&&!document.querySelector('#s-hero')){title.classList.add('art-title');title.append(object(pageObject,'art-title-object'));}
// The complete index is part of navigation, never a surprise block after the page.
const directory=document.querySelector('.atlas-directory'),grid=directory?.querySelector('.atlas-directory-grid');
if(grid){
 const dialog=document.createElement('dialog');dialog.className='art-index';dialog.id='art-index';dialog.setAttribute('aria-labelledby','art-index-heading');
 const head=document.createElement('div');head.className='art-index-head';const h=document.createElement('h2');h.id='art-index-heading';h.textContent=lang()?'Find your course.':'Encuentra tu rumbo.';
 const close=document.createElement('button');close.type='button';close.textContent=lang()?'Close':'Cerrar';close.className='art-index-close';head.append(h,close);dialog.append(head,grid);document.body.append(dialog);directory.remove();
 grid.querySelectorAll('a').forEach(a=>{a.querySelector('.atlas-symbol')?.remove();a.prepend(object(objectFor(new URL(a.href).pathname),'art-index-object'));});
 const triggers=[];const hosts=document.querySelectorAll('.approach-top,.gateway>nav,.atlas-banner');
 for(const host of hosts){const b=document.createElement('button');b.type='button';b.className='art-index-trigger';b.textContent=lang()?'Index':'Índice';b.setAttribute('aria-haspopup','dialog');b.setAttribute('aria-controls','art-index');b.onclick=()=>{dialog.showModal();document.body.classList.add('art-index-open');};host.append(b);triggers.push(b);}
 close.onclick=()=>dialog.close();dialog.addEventListener('click',e=>{if(e.target===dialog)dialog.close();});dialog.addEventListener('close',()=>document.body.classList.remove('art-index-open'));
 new MutationObserver(()=>{h.textContent=lang()?'Find your course.':'Encuentra tu rumbo.';close.textContent=lang()?'Close':'Cerrar';triggers.forEach(b=>b.textContent=lang()?'Index':'Índice');}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
}
// Navigation keeps words for clarity and uses tactile objects, not arrows.
function cleanNavigation(){
 const title=document.querySelector('h1');if(title&&!document.body.classList.contains('painted-landing')&&!document.querySelector('#s-hero')){title.classList.add('art-title');if(!title.querySelector('.art-title-object'))title.append(object(pageObject,'art-title-object'));}

 document.querySelectorAll('a,button,summary').forEach(el=>{if(el.closest('svg'))return;const walker=document.createTreeWalker(el,NodeFilter.SHOW_TEXT);let n;while(n=walker.nextNode()){const clean=n.nodeValue.replace(/[←→↗↘↙↖↓↑↔‹›»«]/g,'').replace(/ {2,}/g,' ');if(clean!==n.nodeValue)n.nodeValue=clean;}const label=el.getAttribute('aria-label');if(label&&/[←→↗↘↙↖↓↑]/.test(label))el.setAttribute('aria-label',label.replace(/[←→↗↘↙↖↓↑]/g,''));});
 const navSelector='.gateway nav a,.back-link,.quiet-nav a,.wyi-nav a,.memo-topbar>a,.top>a,.wordmark,.cm-left,.ss-cross-navigation a,.role-cta';
 document.querySelectorAll('a').forEach(a=>{let path;try{path=new URL(a.href).pathname;}catch{return;}if(['/','/raising','/for-investors'].includes(path)&&/volver|inicio|startup scouting|home|back|elegir de nuevo/i.test(a.textContent))a.classList.add('art-home-link');});
 document.querySelectorAll(navSelector+',.art-home-link').forEach(a=>{if(a.tagName!=='A'||a.closest('.art-index,.approach-top')||a.querySelector('.art-nav-image'))return;a.querySelector('.atlas-symbol')?.remove();a.classList.add('art-nav');let path;try{path=new URL(a.href).pathname;}catch{return;}a.prepend(object(a.matches('.wordmark,.cm-left')||a.closest('.role-page')&&a.id!=='role-back'&&a.closest('nav')?'lighthouse':a.matches('.back-link,.art-home-link')||path==='/'?'boat':objectFor(path),'art-nav-image'));a.querySelector('.wm-sq')?.remove();if(a.closest('.role-page')&&a.closest('nav')&&a.id!=='role-back')a.href='/?lang='+(lang()?'en':'es');});
 document.querySelectorAll('.gate-list a').forEach(a=>{if(a.querySelector('.art-choice-object'))return;a.querySelector('span')?.remove();a.prepend(object(a.id==='bubble-founder'?'boat':'compass','art-choice-object'));});
}
function alignLamp(){const coast=document.querySelector('.approach-coast'),beam=coast?.querySelector('.coast-light');if(!beam)return;const w=coast.clientWidth,h=coast.clientHeight,mobile=innerWidth<=760,scale=mobile?h*.66/804:Math.max(w/1429,h/804),iw=1429*scale,ih=804*scale;Object.assign(beam.style,{inset:'auto',width:iw+'px',height:ih+'px',left:((w-iw)*(mobile?.77:.74))+'px',top:(mobile?h-ih:(h-ih)/2)+'px'});}alignLamp();window.addEventListener('resize',alignLamp);
let queued=false;const observer=new MutationObserver(()=>{if(queued)return;queued=true;requestAnimationFrame(()=>{queued=false;cleanNavigation();});});observer.observe(document.body,{childList:true,subtree:true,characterData:true});cleanNavigation();
})();
