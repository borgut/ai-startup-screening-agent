(() => {
  'use strict';
  const here = new URL(location.href);
  const lang = () => {
    const explicit = new URLSearchParams(location.search).get('lang');
    if (explicit === 'en' || explicit === 'es') return explicit;
    try { return localStorage.getItem('ss-lang') === 'en' ? 'en' : 'es'; } catch { return 'es'; }
  };
  const founderRoutes = ['/raising', '/investor-map', '/valoracion', '/red-team-idea', '/empleos'];
  const isFounder = founderRoutes.includes(location.pathname);
  const cover = location.pathname === '/' ? '/' : (isFounder ? '/raising' : '/for-investors');
  function carry(anchor) {
    const raw = anchor.getAttribute('href');
    if (!raw || raw.startsWith('#') || anchor.hasAttribute('download')) return;
    let url;
    try { url = new URL(raw, location.href); } catch { return; }
    if (url.origin !== location.origin || url.pathname.startsWith('/api/') || /\.[a-z0-9]+$/i.test(url.pathname)) return;
    url.searchParams.set('lang', lang());
    const theme = here.searchParams.get('tema');
    if (theme && !url.searchParams.has('tema')) url.searchParams.set('tema', theme);
    const next = url.pathname + url.search + url.hash;
    if (next !== raw) anchor.setAttribute('href', next);
  }
  // The masthead is a real link, not inert typography.
  document.querySelectorAll('.wordmark, .cm-left, .gateway > nav > span').forEach(mark => {
    if (mark.tagName === 'A' || mark.closest('a')) return;
    const link = document.createElement('a');
    link.className = mark.className;
    link.setAttribute('href', cover);
    while (mark.firstChild) link.appendChild(mark.firstChild);
    mark.replaceWith(link);
  });
  const footer = document.createElement('nav');
  footer.className = 'ss-cross-navigation';
  footer.setAttribute('aria-label', lang() === 'en' ? 'Explore Startup Scouting' : 'Navegar por Startup Scouting');
  const links = lang() === 'en'
    ? [['/', 'Home'], ['/for-investors', 'For investors'], ['/scouting', 'Radar'], ['/raising', 'For founders']]
    : [['/', 'Inicio'], ['/for-investors', 'Para inversores'], ['/scouting', 'Radar'], ['/raising', 'Para founders']];
  for (const [href, label] of links) {
    const a = document.createElement('a'); a.href = href; a.textContent = label;
    if (location.pathname === href) a.setAttribute('aria-current', 'page');
    footer.appendChild(a);
  }
  document.body.appendChild(footer);
  function updateLinks() { document.querySelectorAll('a[href]').forEach(carry); }
  updateLinks();
  new MutationObserver(updateLinks).observe(document.body, { childList: true, subtree: true });
  // Also covers links inserted synchronously by an interaction before its click.
  document.addEventListener('click', event => {
    const anchor = event.target.closest?.('a[href]');
    if (anchor) carry(anchor);
  }, true);
})();
