// Radar early-stage: senales de startups PEQUENAS y TEMPRANAS, todas publicas,
// todas con fecha y fuente. Sin API keys.
// Fuentes:
//  - Boards ATS publicos de startups early espaniolas (watchlist curada): Greenhouse + Teamtailor.
//  - Get on Board (API publica, country_code=ES): fichajes tech en startups pequenas.
//  - Product Hunt (feed Atom publico): lanzamientos nuevos.
//  - Dealflow curado (public/next10-data.json): solo rondas pre-seed/seed, con fuente enlazada.

const path = require('path');
const fs = require('fs');

const TIMEOUT_MS = 8000;

const unesc = (x) => String(x || '').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
const TTL = 6 * 60 * 60 * 1000; // 6h
let cache = null;

function fetchJson(url, opts) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  return fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0' }, ...opts })
    .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
    .finally(() => clearTimeout(t));
}

function fetchText(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  return fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0' } })
    .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.text(); })
    .finally(() => clearTimeout(t));
}

// 1. Watchlist ATS: startups early espanolas con board publico resoluble.
const EARLY_ATS = [
  { name: 'Enginy', ats: 'greenhouse', slug: 'enginy' },
  { name: 'Flanks', ats: 'teamtailor', slug: 'flanks' },
];

async function hiringATS() {
  const out = [];
  for (const c of EARLY_ATS) {
    try {
      if (c.ats === 'greenhouse') {
        const d = await fetchJson(`https://boards-api.greenhouse.io/v1/boards/${c.slug}/jobs`);
        const jobs = (d.jobs || []).filter((j) => j.title);
        if (!jobs.length) continue;
        const sorted = [...jobs].sort((a, b) => new Date(b.updated_at || 0) - new Date(a.updated_at || 0));
        out.push({
          type: 'hiring', kind: 'ats', name: c.name,
          jobs: jobs.length, last: sorted[0].title,
          date: sorted[0].updated_at || null,
          url: `https://boards.greenhouse.io/${c.slug}`,
          source: 'Greenhouse',
        });
      } else if (c.ats === 'teamtailor') {
        const d = await fetchJson(`https://${c.slug}.teamtailor.com/jobs.json`);
        const items = (d.items || []).filter((j) => j.title);
        if (!items.length) continue;
        const sorted = [...items].sort((a, b) => new Date(b.date_published || 0) - new Date(a.date_published || 0));
        out.push({
          type: 'hiring', kind: 'ats', name: c.name,
          jobs: items.length, last: sorted[0].title,
          date: sorted[0].date_published || null,
          url: `https://${c.slug}.teamtailor.com/jobs`,
          source: 'Teamtailor',
        });
      }
    } catch { /* esa fuente no responde hoy: sin datos */ }
  }
  return out;
}

// 2. Fichajes tech/producto en empresas pequenas en Espana (Get on Board).
const TECH_ROLE = /engineer|developer|desarrollador|software|backend|front[- ]?end|full[- ]?stack|product|data|devops|cto|founding|machine learning|ia\b|designer|diseñador/i;

async function hiringGOB() {
  const d = await fetchJson('https://www.getonbrd.com/api/v0/search/jobs?country_code=ES&per_page=40&expand[]=company');
  const by = {};
  (d.data || []).forEach((j) => {
    const a = j.attributes || {};
    const co = (a.company && a.company.data && a.company.data.attributes && a.company.data.attributes.name) || '';
    if (!co || !TECH_ROLE.test(a.title || '')) return;
    const ts = (a.published_at || 0) * 1000;
    if (!ts) return;
    if (!by[co] || ts > by[co].ts) by[co] = { ts, title: a.title, url: `https://www.getonbrd.com/jobs/${j.id}` };
  });
  return Object.entries(by).sort((p, q) => q[1].ts - p[1].ts).slice(0, 6).map(([co, v]) => ({
    type: 'hiring', kind: 'job', name: co,
    last: v.title,
    date: new Date(v.ts).toISOString(),
    url: v.url,
    source: 'Get on Board',
  }));
}

// 3. Lanzamientos nuevos (Product Hunt, feed Atom publico).
async function launchesPH() {
  const xml = await fetchText('https://www.producthunt.com/feed');
  return [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)].slice(0, 8).map((m) => {
    const e = m[1];
    const pick = (tag) => { const x = e.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`)); return x ? x[1].trim() : ''; };
    const title = unesc(pick('title').replace(/<!\[CDATA\[|\]\]>/g, ''));
    const link = (e.match(/<link[^>]*href="([^"]+)"/) || [])[1] || '';
    const content = pick('content');
    const tagline = (content.match(/&lt;p&gt;\s*([\s\S]*?)\s*&lt;\/p&gt;/) || [])[1] || '';
    return {
      type: 'launch', name: title,
      tagline: unesc(tagline).slice(0, 140),
      date: pick('published') || null,
      url: link,
      source: 'Product Hunt',
    };
  }).filter((s) => s.name && s.date);
}

// 4. Rondas pre-seed/seed del dealflow curado (con fuente enlazada).
const MONTHS = { ene: 1, enero: 1, feb: 2, febrero: 2, mar: 3, marzo: 3, abr: 4, abril: 4, apr: 4, may: 5, mayo: 5, jun: 6, junio: 6, jul: 7, julio: 7, ago: 8, agosto: 8, aug: 8, sep: 9, sept: 9, septiembre: 9, oct: 10, octubre: 10, nov: 11, noviembre: 11, dec: 12, dic: 12, diciembre: 12 };

function rounds() {
  const d = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'public', 'next10-data.json'), 'utf8'));
  return (d.companies || []).filter((c) => /^(pre-?seed|seed)$/i.test(c.stage || '')).map((c) => {
    const dtxt = String(c.round || '').split('·').slice(1).join('·').trim();
    const my = dtxt.match(/(20\d{2})/);
    let dt = null;
    if (my) {
      const mm = Object.keys(MONTHS).find((k) => dtxt.toLowerCase().includes(k));
      dt = mm ? new Date(+my[1], MONTHS[mm] - 1, 1) : new Date(+my[1], 6, 1);
    }
    return {
      type: 'round', name: c.name,
      stage: c.stage, round: c.round, city: c.city,
      date: dt ? dt.toISOString() : null,
      url: c.source,
      source: 'dealflow curado',
    };
  });
}

async function getRadar() {
  if (cache && Date.now() - cache.ts < TTL) return cache;
  const settled = await Promise.allSettled([hiringATS(), hiringGOB(), launchesPH()]);
  const names = ['ATS early (Greenhouse/Teamtailor)', 'Get on Board', 'Product Hunt'];
  const signals = [...rounds()];
  const failed = [];
  settled.forEach((r, i) => {
    if (r.status === 'fulfilled') signals.push(...r.value);
    else failed.push(names[i]);
  });
  signals.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0));
  cache = { ts: Date.now(), signals, failed_sources: failed, fetched_at: new Date().toISOString() };
  return cache;
}

module.exports = { getRadar };
