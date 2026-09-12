// Capa de persistencia: Postgres (Vercel Postgres / Neon) cuando existe
// POSTGRES_URL; si no, todo degrada a los JSON estáticos y la app funciona igual.
// Los logos generados se guardan como bytea en la propia tabla (sin segundo store).

// Vercel Storage permite prefijo personalizado: si el usuario lo puso en minusculas
// (p.ej. postgres_POSTGRES_URL), alias a POSTGRES_URL antes de cargar la libreria.
if (!process.env.POSTGRES_URL) {
  const hit = Object.keys(process.env).find((k) => k.toUpperCase().endsWith('POSTGRES_URL') && !k.endsWith('NON_POOLING'));
  if (hit) process.env.POSTGRES_URL = process.env[hit];
}
let pg = null;
try { pg = require('@vercel/postgres'); } catch { pg = null; }

const ENABLED = () => Boolean(pg && process.env.POSTGRES_URL);
const DIAG = () => ({ pg_loaded: Boolean(pg), postgres_url_present: Boolean(process.env.POSTGRES_URL) });

let schemaPromise = null;
function ensureSchema() {
  if (!ENABLED()) return Promise.resolve(false);
  if (!schemaPromise) {
    schemaPromise = (async () => {
      await pg.sql`
        CREATE TABLE IF NOT EXISTS memos (
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
        )`;
      await pg.sql`CREATE INDEX IF NOT EXISTS memos_created_idx ON memos (created_at DESC)`;
      return true;
    })().catch((e) => {
      console.warn('[db] error de esquema:', e.message);
      schemaPromise = null; // reintenta en la próxima llamada
      throw e;
    });
  }
  return schemaPromise;
}

let seeded = false;
async function seedIfEmpty(staticRows) {
  if (seeded) return;
  const { rows } = await pg.sql`SELECT COUNT(*)::int AS n FROM memos`;
  if (rows[0].n > 0) { seeded = true; return; }
  for (const r of staticRows) {
    await pg.sql`
      INSERT INTO memos (id, url, nombre, sector, recomendacion, score_global, logo, memo_es, memo_en, created_at)
      VALUES (${r.id}, ${r.url}, ${r.nombre}, ${r.sector}, ${r.recomendacion}, ${r.score_global}, ${r.logo},
              ${JSON.stringify(r.memo_es)}, ${r.memo_en ? JSON.stringify(r.memo_en) : null}, ${r.created_at})
      ON CONFLICT (id) DO NOTHING`;
  }
  seeded = true;
  console.log(`[db] seed: ${staticRows.length} memos estáticos cargados`);
}

// Lista para "Últimas ediciones": dedupe por URL (la más reciente gana), fecha desc.
async function listMemos() {
  await ensureSchema();
  const { rows } = await pg.sql`
    SELECT DISTINCT ON (COALESCE(NULLIF(url, ''), id))
      id, nombre, sector, recomendacion, score_global, logo, created_at
    FROM memos
    ORDER BY COALESCE(NULLIF(url, ''), id), created_at DESC`;
  rows.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
  return rows;
}

async function getMemo(id, lang) {
  await ensureSchema();
  const { rows } = await pg.sql`SELECT memo_es, memo_en, logo, logo_mime, logo_bytes IS NOT NULL AS has_logo_bytes FROM memos WHERE id = ${id}`;
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
  await pg.sql`
    INSERT INTO memos (id, url, nombre, sector, recomendacion, score_global, logo, logo_mime, logo_bytes, memo_es)
    VALUES (${id}, ${url || ''}, ${m.nombre || ''}, ${m.sector || ''}, ${m.recomendacion || ''},
            ${m.score_global ?? null}, ${logo || null}, ${logoMime || null}, ${logoBytes || null}, ${JSON.stringify(m)})
    ON CONFLICT (id) DO NOTHING`;
}

async function getLogoBytes(id) {
  await ensureSchema();
  const { rows } = await pg.sql`SELECT logo_mime, logo_bytes FROM memos WHERE id = ${id}`;
  if (!rows.length || !rows[0].logo_bytes) return null;
  return { mime: rows[0].logo_mime || 'image/png', bytes: rows[0].logo_bytes };
}

async function saveLogoBytes(id, mime, bytes) {
  await ensureSchema();
  await pg.sql`UPDATE memos SET logo_mime = ${mime}, logo_bytes = ${bytes} WHERE id = ${id}`;
}

module.exports = { ENABLED, DIAG, ensureSchema, seedIfEmpty, listMemos, getMemo, insertMemo, getLogoBytes, saveLogoBytes };

async function setLogoPath(id, logoPath) {
  await ensureSchema();
  await pg.sql`UPDATE memos SET logo = ${logoPath} WHERE id = ${id}`;
}
module.exports.setLogoPath = setLogoPath;
