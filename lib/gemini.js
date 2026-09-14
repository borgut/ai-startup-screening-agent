// Llamada a la API de Google Gemini con grounding de búsqueda web.
// La clave se lee SIEMPRE de process.env.GEMINI_API_KEY; nunca se hardcodea.

const MODEL_FALLBACKS = (process.env.GEMINI_MODEL || 'gemini-3.6-flash,gemini-3.5-flash,gemini-flash-latest')
  .split(',').map((s) => s.trim()).filter(Boolean);
let activeModel = MODEL_FALLBACKS[0];

const { SYSTEM_PROMPT, MEMO_SCHEMA } = require('./prompt');
const { REDTEAM_SYSTEM_PROMPT, REDTEAM_SCHEMA } = require('./redteam');

function extractJson(text) {
  if (!text) throw new Error('Respuesta vacía del modelo');
  let t = text.trim();
  const fence = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (fence) t = fence[1].trim();
  const start = t.indexOf('{');
  const end = t.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('La respuesta no contiene JSON');
  return JSON.parse(t.slice(start, end + 1));
}

async function callGemini({ userPrompt, withSchema, systemPrompt, schema }) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    const err = new Error('GEMINI_API_KEY no configurada');
    err.code = 'NO_API_KEY';
    throw err;
  }
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${activeModel}:generateContent`;
  const generationConfig = { temperature: 0.2, maxOutputTokens: 8192 };
  if (withSchema && schema) {
    generationConfig.responseMimeType = 'application/json';
    generationConfig.responseJsonSchema = schema;
  }
  const body = {
    systemInstruction: { parts: [{ text: systemPrompt }] },
    contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
    tools: [{ googleSearch: {} }],
    generationConfig,
  };
  const res = await fetch(endpoint, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const errText = await res.text().catch(() => '');
    const err = new Error(`Gemini API HTTP ${res.status}: ${errText.slice(0, 500)}`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

function groundingSources(response) {
  const urls = [];
  const chunks = response?.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
  for (const c of chunks) {
    if (c?.web?.uri) urls.push(c.web.uri);
  }
  return urls;
}

function responseText(response) {
  const parts = response?.candidates?.[0]?.content?.parts || [];
  return parts.map((p) => p.text || '').join('');
}

async function tryGenerate(userPrompt, opts) {
  try {
    // Intento 1: salida estructurada + grounding de búsqueda.
    return await callGemini({ userPrompt, withSchema: true, ...opts });
  } catch (err) {
    if (err.status === 429 || err.status === 404) throw err; // lo gestiona el nivel superior
    // Algunas versiones no aceptan esquema + herramienta de búsqueda a la vez:
    // reintenta pidiendo JSON solo por prompt.
    console.warn('[gemini] Intento con esquema falló, reintentando sin esquema:', err.message);
    return await callGemini({ userPrompt, withSchema: false, ...opts });
  }
}

// Bucle compartido de fallback de modelos para todas las generaciones.
async function generate(userPrompt, opts, sourcesField) {
  let response;
  let lastErr;
  for (const model of MODEL_FALLBACKS) {
    activeModel = model;
    try {
      response = await tryGenerate(userPrompt, opts);
      lastErr = null;
      break;
    } catch (err) {
      lastErr = err;
      if (err.status === 429 || err.status === 404) {
        console.warn(`[gemini] Modelo ${model} no disponible (${err.status}), probando el siguiente...`);
        continue;
      }
      throw err;
    }
  }
  if (lastErr) throw lastErr;
  const out = extractJson(responseText(response));
  const extraSources = groundingSources(response);
  out[sourcesField] = [...new Set([...(out[sourcesField] || []), ...extraSources])];
  out._meta = {
    model: activeModel,
    generated_at: new Date().toISOString(),
    grounding_chunks: extraSources.length,
  };
  return out;
}

async function generateMemo(userPrompt) {
  return generate(userPrompt, { systemPrompt: SYSTEM_PROMPT, schema: MEMO_SCHEMA }, 'fuentes_utilizadas');
}

async function generateRedTeam(userPrompt) {
  return generate(userPrompt, { systemPrompt: REDTEAM_SYSTEM_PROMPT, schema: REDTEAM_SCHEMA }, 'fuentes');
}

module.exports = { generateMemo, generateRedTeam };
