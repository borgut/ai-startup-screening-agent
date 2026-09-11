// AI Startup Screening Agent - servidor Express.
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

const app = express();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 },
});

const MEMOS_DIR = path.join(__dirname, 'memos');
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

async function cacheLogo(logoUrl, id) {
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
    const file = `logo-${id}.${ext}`;
    fs.writeFileSync(path.join(GENERATED_DIR, file), buf);
    return `/logo-cache/${file}`;
  } catch { return null; }
}

const LOGOS_DIR = path.join(__dirname, 'public', 'logos');

function findStaticLogo(id) {
  try {
    const f = fs.readdirSync(LOGOS_DIR).find((x) => x.startsWith(id + '.'));
    return f ? `/logos/${f}` : null;
  } catch { return null; }
}

function listExamples() {
  return fs.readdirSync(MEMOS_DIR)
    .filter((f) => f.endsWith('.json'))
    .map((f) => {
      const id = f.replace(/\.json$/, '');
      const memo = JSON.parse(fs.readFileSync(path.join(MEMOS_DIR, f), 'utf8'));
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

function readMemo(id) {
  const safe = /^[a-z0-9-]+$/i.test(id) ? id : null;
  if (!safe) return null;
  for (const dir of [MEMOS_DIR, GENERATED_DIR]) {
    const p = path.join(dir, `${safe}.json`);
    if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, 'utf8'));
  }
  return null;
}

app.get('/memo/:id', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'memo.html'));
});

app.get('/api/examples', (req, res) => {
  try {
    res.json({ examples: listExamples() });
  } catch (err) {
    res.status(500).json({ error: 'No se pudieron cargar los ejemplos' });
  }
});

app.get('/api/memo/:id', (req, res) => {
  const memo = readMemo(req.params.id);
  if (!memo) return res.status(404).json({ error: 'Memo no encontrado' });
  res.json({ memo });
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
      error: 'El análisis en vivo no está activado en esta demo. Mientras tanto, puedes ver los ejemplos de abajo.',
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
    const logoPath = await cacheLogo(website.logoUrl, id);
    if (logoPath) memo.logo = logoPath;
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


module.exports = app;

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => {
    console.log(`\nAI Startup Screening Agent`);
    console.log(`  -> http://localhost:${port}`);
    console.log(process.env.GEMINI_API_KEY
      ? '  Clave Gemini detectada: screening en vivo activado.'
      : '  Sin GEMINI_API_KEY: modo demo (solo ejemplos pre-generados).');
  });
}
