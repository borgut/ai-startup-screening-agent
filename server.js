// Startup Scouting - servidor Express.
// Local: `npm start` -> http://localhost:3000
// Vercel: exporta `app` para @vercel/node.

const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const express = require('express');
const multer = require('multer');

const { extractWebsite } = require('./lib/extract');
const { generateMemo } = require('./lib/gemini');
const { buildUserPrompt } = require('./lib/prompt');
const db = require('./lib/db');

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

const MEMOS_DIR = path.join(__dirname, 'memos');
const MEMOS_EN_DIR = path.join(__dirname, 'memos-en');
// En Vercel el filesystem del proyecto es de solo lectura: los memos generados van a /tmp.
const GENERATED_DIR = process.env.VERCEL
  ? path.join('/tmp', '.generated')
  : path.join(__dirname, '.generated');
try {
  fs.mkdirSync(GENERATED_DIR, { recursive: true });
} catch (err) {
  console.warn('No se pudo crear el directorio de memos generados:', err.message);
}

app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, 'public')));
app.use('/logo-cache', express.static(GENERATED_DIR, { maxAge: '1h' }));

async function fetchLogo(logoUrl) {
  if (!logoUrl) return null;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(logoUrl, { signal: controller.signal, headers: { 'User-Agent': 'Mozilla/5.0' } });
    clearTimeout(timer);
    if (!res.ok) return null;
    const ct = (res.headers.get('content-type') || '').split(';')[0];
    const ext = { 'image/png': 'png', 'image/jpeg': 'jpg', 'image/svg+xml': 'svg', 'image/webp': 'webp', 'image/x-icon': 'ico', 'image/vnd.microsoft.icon': 'ico', 'image/gif': 'gif' }[ct];
    if (!ext) return null;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length > 2 * 1024 * 1024 || buf.length < 100) return null;
    return { ct, ext, buf };
  } catch { return null; }
}

// Destino del logo: Vercel Blob > Postgres bytea > /tmp (efímero, solo dev).
async function storeLogo(logo, id) {
  if (!logo) return null;
  const { ct, ext, buf } = logo;
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    try {
      const { put } = require('@vercel/blob');
      const blob = await put(`logos/logo-${id}.${ext}`, buf, { access: 'public', contentType: ct, addRandomSuffix: false });
      return blob.url;
    } catch (e) { console.warn('[logo] Blob no disponible:', e.message); }
  }
  if (db.ENABLED()) {
    try {
      await db.saveLogoBytes(id, ct, buf);
      return `/logo-db/${id}`;
    } catch (e) { console.warn('[logo] Postgres no disponible:', e.message); }
  }
  const file = `logo-${id}.${ext}`;
  fs.writeFileSync(path.join(GENERATED_DIR, file), buf);
  return `/logo-cache/${file}`;
}

const LOGOS_DIR = path.join(__dirname, 'public', 'logos');

function findStaticLogo(id) {
  try {
    const f = fs.readdirSync(LOGOS_DIR).find((x) => x.startsWith(id + '.'));
    return f ? `/logos/${f}` : null;
  } catch { return null; }
}

function staticRows() {
  const ids = fs.readdirSync(MEMOS_DIR).filter((f) => f.endsWith('.json')).map((f) => f.replace(/\.json$/, ''));
  return ids.map((id) => {
    const es = JSON.parse(fs.readFileSync(path.join(MEMOS_DIR, id + '.json'), 'utf8'));
    const enPath = path.join(MEMOS_EN_DIR, id + '.json');
    const en = fs.existsSync(enPath) ? JSON.parse(fs.readFileSync(enPath, 'utf8')) : null;
    return {
      id,
      url: es.web || '',
      nombre: es.nombre,
      sector: es.sector,
      recomendacion: es.recomendacion,
      score_global: es.score_global,
      logo: es.logo || findStaticLogo(id),
      memo_es: es,
      memo_en: en,
      created_at: es.fecha ? new Date(es.fecha + 'T12:00:00Z').toISOString() : new Date().toISOString(),
    };
  });
}

function listExamples(lang) {
  const dir = lang === 'en' && fs.existsSync(MEMOS_EN_DIR) ? MEMOS_EN_DIR : MEMOS_DIR;
  return fs.readdirSync(dir)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      const id = f.replace(/\.json$/, '');
      const memo = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8'));
      return {
        id,
        nombre: memo.nombre,
        sector: memo.sector,
        recomendacion: memo.recomendacion,
        score_global: memo.score_global,
        logo: memo.logo || findStaticLogo(id),
      };
    });
}

function readMemo(id, lang) {
  const safe = /^[a-z0-9-]+$/i.test(id) ? id : null;
  if (!safe) return null;
  const dirs = lang === 'en' && fs.existsSync(MEMOS_EN_DIR) ? [MEMOS_EN_DIR, GENERATED_DIR] : [MEMOS_DIR, GENERATED_DIR];
  for (const dir of dirs) {
    const p = path.join(dir, `${safe}.json`);
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  }
  return null;
}

app.get('/scouting', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'scouting.html'));
});

app.get('/for-investors', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'for-investors.html'));
});

app.get('/raising', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'raising.html'));
});

app.get('/investor-map', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'investor-map.html'));
});

app.get('/would-you-invest', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'would-you-invest.html'));
});

app.get('/next-10', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'next10.html'));
});

app.get('/valoracion', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'valoracion.html'));
});

app.get('/red-team', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'red-team.html'));
});

// SEO: /founders/:stage/:vertical/:geo -> mapa con los filtros aplicados
const FOUNDER_SLUGS = {
  'pre-seed': 'Pre-seed', 'seed': 'Seed', 'series-a': 'Series A',
  'b2b-saas': 'B2B SaaS', 'fintech': 'Fintech', 'consumer': 'Consumer',
  'marketplace': 'Marketplace', 'deeptech': 'Deeptech', 'ai': 'AI',
  'espana': 'España', 'europa': 'Europa', 'latam': 'LatAm',
};
app.get('/founders/:stage/:vertical/:geo', (req, res) => {
  const stage = FOUNDER_SLUGS[req.params.stage];
  const vertical = FOUNDER_SLUGS[req.params.vertical];
  const geo = FOUNDER_SLUGS[req.params.geo];
  if (!stage || !vertical || !geo) return res.redirect('/investor-map');
  const q = new URLSearchParams({ lang: 'es', vertical, stage, geo });
  res.redirect(`/investor-map?${q.toString()}`);
});

app.get('/memo/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'memo.html'));
});

app.get('/ic/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'ic.html'));
});

app.get('/market-map', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'market-map.html'));
});

app.get('/dealflow', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dealflow.html'));
});

app.get('/brief', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'brief.html'));
});

app.get('/regulatory-watch', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'regulatory.html'));
});

app.get('/api/health', async (req, res) => {
  const out = { ok: true, db_enabled: db.ENABLED(), ...db.DIAG() };
  out.db_env_names = Object.keys(process.env).filter((k) => /POSTGRES|PGSQL|DATABASE|STORAGE|NEON|SUPABASE/i.test(k));
  if (db.ENABLED()) {
    try { await db.ensureSchema(); out.db_reachable = true; }
    catch (e) { out.db_reachable = false; out.db_error = String(e.message || e).slice(0, 200); }
  }
  res.json(out);
});

app.get('/api/examples', async (req, res) => {
  try {
    if (db.ENABLED()) {
      await db.seedIfEmpty(staticRows());
      const rows = await db.listMemos();
      return res.json({ examples: rows, source: 'db' });
    }
  } catch (err) {
    console.warn('[examples] Postgres no disponible, uso estáticos:', err.message);
  }
  try {
    res.json({ examples: listExamples(req.query.lang), source: 'static' });
  } catch (err) {
    res.status(500).json({ error: 'No se pudieron cargar los ejemplos' });
  }
});

app.get('/api/stats', async (req, res) => {
  try {
    if (db.ENABLED()) {
      await db.seedIfEmpty(staticRows());
      const s = await db.memoStats();
      if (s && s.memos > 0) return res.json({ ok: true, memos: s.memos, claims: s.claims, fuentes: s.fuentes, source: 'db' });
    }
  } catch (err) {
    console.warn('[stats] Postgres no disponible, uso estaticos:', err.message);
  }
  try {
    const ids = fs.readdirSync(MEMOS_DIR).filter((f) => f.endsWith('.json'));
    let claims = 0, fuentes = 0;
    for (const f of ids) {
      try {
        const m = JSON.parse(fs.readFileSync(path.join(MEMOS_DIR, f), 'utf8'));
        if (Array.isArray(m.claims)) claims += m.claims.length;
        if (Array.isArray(m.fuentes)) fuentes += m.fuentes.length;
      } catch {}
    }
    res.json({ ok: true, memos: ids.length, claims, fuentes, source: 'static' });
  } catch (err) {
    res.status(500).json({ error: 'No se pudieron cargar las stats' });
  }
});

// Logos guardados en Postgres (bytea)
app.get('/logo-db/:id', async (req, res) => {
  try {
    const logo = await db.getLogoBytes(req.params.id);
    if (!logo) return res.status(404).end();
    res.set('Content-Type', logo.mime);
    res.set('Cache-Control', 'public, max-age=86400');
    res.send(logo.bytes);
  } catch { res.status(404).end(); }
});

app.get('/api/memo/:id', async (req, res) => {
  try {
    if (db.ENABLED()) {
      const memo = await db.getMemo(req.params.id, req.query.lang);
      if (memo) {
        // Los cinco demos ya estaban sembrados antes de añadir founder_team.
        // Completa solo esta sección editorial desde el JSON versionado, sin tocar
        // el resto del memo vivo ni el análisis en producción.
        if (!memo.founder_team) {
          const enriched = readMemo(req.params.id, req.query.lang);
          if (enriched && enriched.founder_team) memo.founder_team = enriched.founder_team;
        }
        return res.json({ memo, source: 'db' });
      }
    }
  } catch (err) {
    console.warn('[memo] Postgres no disponible, uso estáticos:', err.message);
  }
  const memo = readMemo(req.params.id, req.query.lang);
  if (!memo) return res.status(404).json({ error: 'Memo no encontrado' });
  res.json({ memo, source: 'static' });
});

app.get('/api/status', (req, res) => {
  res.json({ api_key_configured: Boolean(process.env.GEMINI_API_KEY) });
});

async function parseDeck(buffer) {
  const { PDFParse } = require('pdf-parse');
  const parser = new PDFParse({ data: buffer });
  try {
    const result = await parser.getText();
    const text = (result.text || '').slice(0, 25000);
    return { text, pages: result.total || null };
  } finally {
    await parser.destroy().catch(() => {});
  }
}

app.post('/api/screen', upload.single('deck'), async (req, res) => {
  const url = (req.body.url || '').trim();
  const linkedinUrl = (req.body.linkedin || '').trim();
  const contextText = (req.body.context || '').trim().slice(0, 4000);

  if (!url) return res.status(400).json({ error: 'La URL de la startup es obligatoria.' });
  try {
    new URL(/^https?:\/\//i.test(url) ? url : `https://${url}`);
  } catch {
    return res.status(400).json({ error: 'La URL no parece válida.' });
  }
  if (!process.env.GEMINI_API_KEY) {
    return res.status(503).json({
      error: 'El análisis al momento está en pausa. Mientras tanto, puedes explorar los ejemplos.',
      code: 'NO_API_KEY',
    });
  }

  try {
    // 1. Web de la startup
    const website = await extractWebsite(url);

    // 2. Deck (opcional)
    let deckText = null;
    if (req.file) {
      if (req.file.mimetype !== 'application/pdf' && !req.file.originalname.toLowerCase().endsWith('.pdf')) {
        return res.status(400).json({ error: 'El deck debe ser un PDF.' });
      }
      try {
        const deck = await parseDeck(req.file.buffer);
        deckText = deck.text;
      } catch {
        return res.status(400).json({ error: 'No se pudo leer el PDF del deck.' });
      }
    }

    // 3. Verificación externa + memo vía Gemini (con grounding de búsqueda)
    const userPrompt = buildUserPrompt({
      url,
      websiteText: website.text,
      websiteOk: website.ok,
      websiteError: website.error,
      deckText,
      linkedinUrl,
      contextText,
    });
    const memo = await generateMemo(userPrompt);
    memo._meta = { ...(memo._meta || {}), input_url: url, website_ok: website.ok, pages_fetched: undefined };
    if (!memo.fecha) memo.fecha = new Date().toISOString().slice(0, 10);

    const id = `gen-${Date.now().toString(36)}-${crypto.randomBytes(3).toString('hex')}`;
    if (db.ENABLED()) {
      try {
        await db.insertMemo({ id, url, memoEs: memo }); // la fila existe antes de guardar el logo
      } catch (e) { console.warn('[screen] no se pudo persistir el memo:', e.message); }
    }
    const logoPath = await storeLogo(await fetchLogo(website.logoUrl), id);
    if (logoPath) memo.logo = logoPath;
    if (db.ENABLED() && logoPath && logoPath.startsWith('http')) {
      try { await db.setLogoPath(id, logoPath); } catch { /* no crítico */ }
    }
    fs.writeFileSync(path.join(GENERATED_DIR, `${id}.json`), JSON.stringify(memo, null, 2));
    res.json({ id, memo });
  } catch (err) {
    console.error('[screen] Error:', err);
    if (err.code === 'NO_API_KEY') {
      return res.status(503).json({ error: 'Falta GEMINI_API_KEY.', code: 'NO_API_KEY' });
    }
    res.status(502).json({ error: `Error generando el memo: ${err.message}` });
  }
});


// Captura de emails del mapa de inversores (opcional, sin envío automático)
app.post('/api/founder-interest', async (req, res) => {
  const email = String((req.body && req.body.email) || '').trim().slice(0, 200);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return res.status(400).json({ ok: false, error: 'Email no válido' });
  }
  const meta = {
    vertical: String((req.body && req.body.vertical) || '').slice(0, 60),
    stage: String((req.body && req.body.stage) || '').slice(0, 60),
    geo: String((req.body && req.body.geo) || '').slice(0, 60),
    raise: String((req.body && req.body.raise) || '').slice(0, 60),
  };
  try {
    if (db.ENABLED()) {
      await db.saveFounderInterest(email, meta);
      return res.json({ ok: true, source: 'db' });
    }
  } catch (err) {
    console.warn('[founder-interest] Postgres no disponible:', err.message);
  }
  // Sin base de datos: se acepta pero solo queda en el log de la función.
  console.log('[founder-interest]', email, JSON.stringify(meta));
  res.json({ ok: true, source: 'log' });
});

module.exports = app;

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`\nStartup Scouting - screening de startups`);
    console.log(`  -> http://localhost:${port}`);
    console.log(process.env.GEMINI_API_KEY
      ? '  Clave Gemini detectada: screening en vivo activado.'
      : '  Sin GEMINI_API_KEY: solo ejemplos precargados.');
  });
}
