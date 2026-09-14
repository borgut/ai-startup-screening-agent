// Agregador de empleo en startups: fuentes vivas (ATS publicos) + boards curados.
// Sin API keys: Greenhouse boards API, Lever postings API y Get on Board son publicos.

const COMPANIES = {
  es: [
    { name: 'Cabify', ats: 'greenhouse', slug: 'cabify' },
    { name: 'Wallapop', ats: 'greenhouse', slug: 'wallapop' },
    { name: 'Typeform', ats: 'greenhouse', slug: 'typeform' },
    { name: 'Packlink', ats: 'greenhouse', slug: 'packlink' },
    { name: 'Jobandtalent', ats: 'lever', slug: 'jobandtalent' },
  ],
  eu: [
    { name: 'Celonis', ats: 'greenhouse', slug: 'celonis' },
    { name: 'N26', ats: 'greenhouse', slug: 'n26' },
    { name: 'Doctolib', ats: 'greenhouse', slug: 'doctolib' },
    { name: 'Contentful', ats: 'greenhouse', slug: 'contentful' },
  ],
  latam: [
    { name: 'Bitso', ats: 'greenhouse', slug: 'bitso' },
    { name: 'Clara', ats: 'greenhouse', slug: 'clara' },
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
  if (region === 'latam') tasks.push(fetchGetOnBoard());
  const settled = await Promise.allSettled(tasks);
  const jobs = [];
  const errors = [];
  settled.forEach((r, i) => {
    if (r.status === 'fulfilled') jobs.push(...r.value.filter((j) => keepJob(region, j)));
    else errors.push(companies[i] ? companies[i].name : 'Get on Board');
  });
  jobs.sort((a, b) => (a.company || '').localeCompare(b.company || '') || (a.title || '').localeCompare(b.title || ''));
  const out = { ts: Date.now(), jobs, errors };
  cache.set(region, out);
  return out;
}

module.exports = { getJobs, COMPANIES };
