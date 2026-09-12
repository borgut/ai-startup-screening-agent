// Capa de persistencia: Postgres (Vercel Storage / Neon) cuando hay cadena de
// conexion; si no, todo degrada a los JSON estaticos y la app funciona igual.
// Los logos generados se guardan como bytea en la propia tabla (sin segundo store).
// Driver: pg (node-postgres, TCP/TLS) - el driver WebSocket de @vercel/postgres
// no acepta las cadenas del marketplace actual de Neon.

// Vercel Storage permite prefijo personalizado (p.ej. postgres_POSTGRES_URL).
if (!process.env.POSTGRES_URL) {
  const hit = Object.keys(process.env).find((k) => k.toUpperCase().endsWith('POSTGRES_URL') && !k.endsWith('NON_POOLING'));
  if (hit) process.env.POSTGRES_URL = process.env[hit];
}

let PgClient = null;
try { PgClient = require('pg').Client; } catch { PgClient = null; }

const ENABLED = () => Boolean(PgClient && process.env.POSTGRES_URL);
const DIAG = () => ({ pg_loaded: Boolean(PgClient), postgres_url_present: Boolean(process.env.POSTGRES_URL) });

// Candidatas: todas las variables *POSTGRES_URL / *DATABASE_URL, valores unicos,
// POSTGRES_URL primero, luego las pooled (PRISMA/pooler) y el resto.
function connCandidates() {
  const keys = Object.keys(process.env).filter((k) => /(POSTGRES_URL|DATABASE_URL)$/i.test(k) && !/NON_POOLING/i.test(k));
  keys.sort((a, b) => {
    const rank = (k) => (k === 'POSTGRES_URL' ? 0 : /PRISMA/i.test(k) ? 1 : /POSTGRES_URL/i.test(k) ? 2 : 3);
    return rank(a) - rank(b);
  });
  const seen = new Set();
  const out = [];
  for (const k of keys) {
    const v = process.env[k];
    if (v && !seen.has(v)) { seen.add(v); out.push(v); }
  }
  return out;
}

let _client = null;
async function getClient() {
  if (_client) return _client;
  let lastErr = null;
  for (const cs of connCandidates()) {
    try {
      const c = new PgClient({ connectionString: cs, ssl: { rejectUnauthorized: false }, connectionTimeoutMillis: 8000 });
      await c.connect();
      _client = c;
      return c;
    } catch (e) { lastErr = e; }
  }
  throw lastErr || new Error('sin cadena de conexion Postgres');
}

// Consulta con un reintento si la conexion murio entre invocaciones.
async function q(text, params) {
  try {
    const c = await getClient();
    return await c.query(text, params);
  } catch (e) {
    if (_client) { try { await _client.end(); } catch {} _client = null; }
    const c = await getClient();
    return c.query(text, params);
  }
}

let schemaPromise = null;
function ensureSchema() {
  if (!ENABLED()) return Promise.resolve(false);
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await q(`CREATE TABLE IF NOT EXISTS memos (
          id TEXT PRIMARY KEY,
          url TEXT,
          nombre TEXT,
          sector TEXT,
          recomendacion TEXT,
          score_global NUMERIC,
          logo TEXT,
          logo_mime TEXT,
          logo_bytes BYTEA,
          memo_es JSONB,
          memo_en JSONB,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )`);
      await q('CREATE INDEX IF NOT EXISTS memos_created_idx ON memos (created_at DESC)');
      return true;
    })().catch((e) => {
      console.warn('[db] error de esquema:', e.message);
      schemaPromise = null; // reintenta en la proxima llamada
      throw e;
    });
  }
  return schemaPromise;
}

let seeded = false;
async function seedIfEmpty(staticRows) {
  if (seeded) return;
  const { rows } = await q('SELECT COUNT(*)::int AS n FROM memos');
  if (rows[0].n > 0) { seeded = true; return; }
  for (const r of staticRows) {
    await q(
      `INSERT INTO memos (id, url, nombre, sector, recomendacion, score_global, logo, memo_es, memo_en, created_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
       ON CONFLICT (id) DO NOTHING`,
      [r.id, r.url, r.nombre, r.sector, r.recomendacion, r.score_global, r.logo,
       JSON.stringify(r.memo_es), r.memo_en ? JSON.stringify(r.memo_en) : null, r.created_at]
    );
  }
  seeded = true;
  console.log(`[db] seed: ${staticRows.length} memos estaticos cargados`);
}

// Lista para "Ultimas ediciones": dedupe por URL (la mas reciente gana), fecha desc.
async function listMemos() {
  await ensureSchema();
  const { rows } = await q(
    `SELECT DISTINCT ON (COALESCE(NULLIF(url, ''), id))
      id, nombre, sector, recomendacion, score_global, logo, created_at
     FROM memos
     ORDER BY COALESCE(NULLIF(url, ''), id), created_at DESC`
  );
  rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return rows;
}

async function getMemo(id, lang) {
  await ensureSchema();
  const { rows } = await q('SELECT memo_es, memo_en, logo, logo_mime, logo_bytes IS NOT NULL AS has_logo_bytes FROM memos WHERE id = $1', [id]);
  if (!rows.length) return null;
  const r = rows[0];
  const memo = (lang === 'en' && r.memo_en) ? r.memo_en : r.memo_es;
  if (memo && r.has_logo_bytes) memo.logo = `/logo-db/${id}`;
  else if (memo && r.logo) memo.logo = r.logo;
  return memo;
}

async function insertMemo({ id, url, memoEs, logo, logoMime, logoBytes }) {
  await ensureSchema();
  const m = memoEs || {};
  await q(
    `INSERT INTO memos (id, url, nombre, sector, recomendacion, score_global, logo, logo_mime, logo_bytes, memo_es)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10)
     ON CONFLICT (id) DO NOTHING`,
    [id, url || '', m.nombre || '', m.sector || '', m.recomendacion || '',
     m.score_global ?? null, logo || null, logoMime || null, logoBytes || null, JSON.stringify(m)]
  );
}

async function getLogoBytes(id) {
  await ensureSchema();
  const { rows } = await q('SELECT logo_mime, logo_bytes FROM memos WHERE id = $1', [id]);
  if (!rows.length || !rows[0].logo_bytes) return null;
  return { mime: rows[0].logo_mime || 'image/png', bytes: rows[0].logo_bytes };
}

async function saveLogoBytes(id, mime, bytes) {
  await ensureSchema();
  await q('UPDATE memos SET logo_mime = $2, logo_bytes = $3 WHERE id = $1', [id, mime, bytes]);
}

async function setLogoPath(id, logoPath) {
  await ensureSchema();
  await q('UPDATE memos SET logo = $2 WHERE id = $1', [id, logoPath]);
}

module.exports = { ENABLED, DIAG, ensureSchema, seedIfEmpty, listMemos, getMemo, insertMemo, getLogoBytes, saveLogoBytes, setLogoPath };
