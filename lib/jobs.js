// Agregador de empleo en startups: fuentes vivas (ATS publicos) + boards curados.
// Sin API keys: Greenhouse boards API, Lever postings API y Get on Board son publicos.

const COMPANIES = {
  es: [
    { name: 'Cabify', ats: 'greenhouse', slug: 'cabify' },
    { name: 'Wallapop', ats: 'greenhouse', slug: 'wallapop' },
    { name: 'Typeform', ats: 'greenhouse', slug: 'typeform' },
    { name: 'Packlink', ats: 'greenhouse', slug: 'packlink' },
    { name: 'Fever', ats: 'greenhouse', slug: 'feverup' },
    { name: 'Clarity AI', ats: 'greenhouse', slug: 'clarityai' },
    { name: 'Jobandtalent', ats: 'lever', slug: 'jobandtalent' },
    { name: 'Exoticca', ats: 'workable', slug: 'exoticca' },
    { name: 'Seedtag', ats: 'teamtailor', slug: 'https://jobs.seedtag.com/jobs.rss' },
    { name: 'Glovo', ats: 'glovo-sitemap', slug: 'https://careers.glovoapp.com/job-sitemap.xml' },
  ],
  eu: [
    { name: 'Celonis', ats: 'greenhouse', slug: 'celonis' },
    { name: 'N26', ats: 'greenhouse', slug: 'n26' },
    { name: 'Doctolib', ats: 'greenhouse', slug: 'doctolib' },
    { name: 'Contentful', ats: 'greenhouse', slug: 'contentful' },
    { name: 'Remote', ats: 'greenhouse', slug: 'remotecom' },
    { name: 'Staffbase', ats: 'greenhouse', slug: 'staffbase' },
    { name: 'air up', ats: 'greenhouse', slug: 'airup' },
    { name: 'Flix', ats: 'greenhouse', slug: 'flix' },
    { name: 'GetYourGuide', ats: 'greenhouse', slug: 'getyourguide' },
    { name: 'Qonto', ats: 'lever', slug: 'qonto' },
  ],
  latam: [
    { name: 'Bitso', ats: 'greenhouse', slug: 'bitso' },
    { name: 'Clara', ats: 'greenhouse', slug: 'clara' },
    { name: 'VTEX', ats: 'greenhouse', slug: 'vtex' },
    { name: 'Kavak', ats: 'lever', slug: 'kavak' },
  ],
};

const TIMEOUT_MS = 8000;

function fetchJson(url) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  return fetch(url, { signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0' } })
    .then((r) => { if (!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
    .finally(() => clearTimeout(t));
}

async function fetchCompany(c) {
  if (c.ats === 'greenhouse') {
    const d = await fetchJson(`https://boards-api.greenhouse.io/v1/boards/${c.slug}/jobs`);
    return (d.jobs || []).map((j) => ({
      company: c.name, title: j.title, location: j.location && j.location.name, url: j.absolute_url,
    }));
  }
  if (c.ats === 'lever') {
    const d = await fetchJson(`https://api.lever.co/v0/postings/${c.slug}?mode=json`);
    return (d || []).map((j) => ({
      company: c.name, title: j.text, location: j.categories && j.categories.location, url: j.hostedUrl,
    }));
  }
  if (c.ats === 'workable') {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const r = await fetch(`https://apply.workable.com/api/v3/accounts/${c.slug}/jobs`, {
        method: 'POST', signal: ctrl.signal,
        headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
        body: JSON.stringify({ query: '', location: [], department: [], worktype: [], remote: [] }),
      });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const d = await r.json();
      return (d.results || []).map((j) => ({
        company: c.name,
        title: j.title,
        location: j.location && [j.location.city, j.location.country].filter(Boolean).join(', '),
        url: `https://apply.workable.com/${c.slug}/j/${j.shortcode}/`,
      }));
    } finally { clearTimeout(t); }
  }
  if (c.ats === 'teamtailor') {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const r = await fetch(c.slug, { signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const xml = await r.text();
      const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];
      return items.map((m) => {
        const it = m[1];
        const pick = (tag) => { const x = it.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`)); return x ? x[1].replace(/<!\\[CDATA\\[|\\]\\]>/g, '').trim() : null; };
        return { company: c.name, title: pick('title'), location: null, url: pick('link') };
      }).filter((j) => j.title && j.url);
    } finally { clearTimeout(t); }
  }
  if (c.ats === 'glovo-sitemap') {
    const ctrl = new AbortController();
    const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
    try {
      const r = await fetch(c.slug, { signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0' } });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const xml = await r.text();
      return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)]
        .map((m) => m[1]).filter((u) => u.includes('/job/'))
        .map((u) => {
          const slugPart = u.split('/job/')[1].replace(/\/$/, '').replace(/-jid-\d+$/, '');
          const inIdx = slugPart.lastIndexOf('-in-');
          const titleSlug = inIdx > 0 ? slugPart.slice(0, inIdx) : slugPart;
          const locSlug = inIdx > 0 ? slugPart.slice(inIdx + 4) : '';
          const pretty = (x) => x.replace(/\b(they|she|he)\b/g, '').replace(/-+/g, ' ').trim().replace(/\b\w/g, (ch) => ch.toUpperCase());
          return { company: c.name, title: pretty(titleSlug), location: locSlug ? pretty(locSlug) : null, url: u };
        });
    } finally { clearTimeout(t); }
  }
  return [];
}

async function fetchGetOnBoard() {
  const d = await fetchJson('https://www.getonbrd.com/api/v0/search/jobs?remote=true&per_page=25&expand[]=company');
  return (d.data || []).map((j) => {
    const a = j.attributes || {};
    const company = a.company && a.company.data && a.company.data.attributes && a.company.data.attributes.name;
    const countries = Array.isArray(a.countries) && a.countries.length ? a.countries.join(' / ') : 'Remote';
    return {
      company: company || 'Get on Board',
      title: a.title,
      location: countries,
      url: `https://www.getonbrd.com/jobs/${j.id}`,
    };
  });
}


// nothiring (agencia AI-native de Madrid) publica sus vacantes en
// https://app.nothiring.me/jobs: pagina publica renderizada en servidor (Next.js)
// con el array de trabajos embebido en el payload flight. Sin API publica, pero
// el HTML es estable: decodificamos los chunks self.__next_f.push y extraemos "jobs".
const NOTHIRING_MODE = { hybrid: 'Híbrido', remote: 'Remoto', onsite: 'Presencial' };

async function fetchNothiring() {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const r = await fetch('https://app.nothiring.me/jobs', { signal: ctrl.signal, headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    const html = await r.text();
    const chunks = [];
    const re = /self\.__next_f\.push\(\[1,"((?:[^"\\]|\\.)*)"\]\)/g;
    let m;
    while ((m = re.exec(html))) chunks.push(JSON.parse('"' + m[1] + '"'));
    const data = chunks.join('');
    const key = '"jobs":[';
    const start = data.indexOf(key);
    if (start < 0) return [];
    let i = start + key.length - 1;
    let depth = 0;
    let inStr = false;
    for (; i < data.length; i++) {
      const ch = data[i];
      if (inStr) { if (ch === '\\') i++; else if (ch === '"') inStr = false; continue; }
      if (ch === '"') inStr = true;
      else if (ch === '[' || ch === '{') depth++;
      else if (ch === ']' || ch === '}') { depth--; if (depth === 0) { i++; break; } }
    }
    const arr = JSON.parse(data.slice(start + key.length - 1, i));
    return (arr || []).filter((j) => j && j.id && j.title).map((j) => {
      const mode = NOTHIRING_MODE[j.work_mode];
      const loc = [j.location, mode].filter(Boolean).join(' · ');
      return {
        company: 'nothiring',
        title: j.title,
        location: loc || null,
        url: `https://app.nothiring.me/jobs/${j.id}`,
      };
    });
  } finally { clearTimeout(t); }
}

// Limpieza: sin plantillas internas ni oficinas sin nombre, y cada region
// ensena solo lo relevante para su audiencia (o remoto).
const JUNK_TITLE = /template|update office/i;
const LOCATION_KEEP = {
  es: /madrid|barcelona|valencia|bilbao|sevilla|málaga|malaga|zaragoza|spain|españa|remote|teletrabajo|híbrido|hibrido/i,
  eu: /london|berlin|munich|münchen|paris|amsterdam|lisbon|lisboa|dublin|stockholm|copenhagen|helsinki|oslo|vienna|wien|zurich|milan|milano|rome|roma|warsaw|prague|brussels|madrid|barcelona|europe|emea|remote/i,
  latam: null,
};

function keepJob(region, j) {
  if (!j.title || JUNK_TITLE.test(j.title)) return false;
  if (j.location && JUNK_TITLE.test(j.location)) return false;
  const re = LOCATION_KEEP[region];
  if (!re) return true;
  if (!j.location) return true;
  // "Remote, US" no es remoto para nuestra audiencia.
  if (/(^|,|\s)US(,|$)|United States/i.test(j.location) && !re.test(j.location.replace(/remote/i, ''))) return false;
  return re.test(j.location);
}

const cache = new Map(); // region -> { ts, jobs, errors }
const TTL = 6 * 60 * 60 * 1000;

async function getJobs(region) {
  const hit = cache.get(region);
  if (hit && Date.now() - hit.ts < TTL) return hit;
  const companies = COMPANIES[region] || [];
  const tasks = companies.map((c) => fetchCompany(c));
  const labels = companies.map((c) => c.name);
  if (region === 'es') { tasks.push(fetchNothiring()); labels.push('nothiring'); }
  if (region === 'latam') { tasks.push(fetchGetOnBoard()); labels.push('Get on Board'); }
  const settled = await Promise.allSettled(tasks);
  const jobs = [];
  const errors = [];
  settled.forEach((r, i) => {
    if (r.status === 'fulfilled') jobs.push(...r.value.filter((j) => keepJob(region, j)));
    else errors.push(labels[i] || 'fuente');
  });
  jobs.sort((a, b) => (a.company || '').localeCompare(b.company || '') || (a.title || '').localeCompare(b.title || ''));
  const out = { ts: Date.now(), jobs, errors };
  cache.set(region, out);
  return out;
}

module.exports = { getJobs, COMPANIES };
