// Extracción de contenido web: página principal + subpáginas clave.
// Sin dependencias externas: fetch nativo de Node 22 + limpieza de HTML.

const MAX_CHARS_PER_PAGE = 12000;
const MAX_TOTAL_CHARS = 30000;
const FETCH_TIMEOUT_MS = 15000;

const INTERESTING_PATHS = /about|pricing|precios|product|producto|team|equipo|customers|clientes|features|funciones|security|seguridad/i;

function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<(br|\/p|\/div|\/li|\/h[1-6]|\/tr)[^>]*>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
}

function extractTitle(html) {
  const m = html.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
  return m ? m[1].trim().slice(0, 200) : '';
}

function extractLinks(html, baseUrl) {
  const links = new Set();
  const re = /href=["']([^"'#]+)["']/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    try {
      const u = new URL(m[1], baseUrl);
      if (u.origin !== new URL(baseUrl).origin) continue;
      if (/\.(png|jpg|jpeg|gif|svg|css|js|ico|pdf|zip)(\?|$)/i.test(u.pathname)) continue;
      if (INTERESTING_PATHS.test(u.pathname)) links.add(u.href.split('?')[0]);
    } catch { /* url inválida, ignorar */ }
  }
  return [...links].slice(0, 4);
}

async function fetchPage(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: 'follow',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'es,en;q=0.8',
      },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const contentType = res.headers.get('content-type') || '';
    if (!contentType.includes('text/html') && !contentType.includes('xhtml')) {
      throw new Error(`Contenido no HTML (${contentType})`);
    }
    return await res.text();
  } finally {
    clearTimeout(timer);
  }
}

async function extractWebsite(url) {
  const normalized = /^https?:\/\//i.test(url) ? url : `https://${url}`;
  const result = { url: normalized, ok: false, title: '', text: '', pages: [], error: null };
  try {
    const html = await fetchPage(normalized);
    result.ok = true;
    result.title = extractTitle(html);
    const mainText = htmlToText(html).slice(0, MAX_CHARS_PER_PAGE);
    result.pages.push({ url: normalized, chars: mainText.length });
    let combined = `=== PÁGINA PRINCIPAL (${normalized}) ===\nTítulo: ${result.title}\n\n${mainText}`;

    const subLinks = extractLinks(html, normalized);
    for (const link of subLinks) {
      if (combined.length >= MAX_TOTAL_CHARS) break;
      try {
        const subHtml = await fetchPage(link);
        const subText = htmlToText(subHtml).slice(0, 6000);
        result.pages.push({ url: link, chars: subText.length });
        combined += `\n\n=== SUBPÁGINA (${link}) ===\n${subText}`;
      } catch { /* subpágina inaccesible: se ignora */ }
    }
    result.text = combined.slice(0, MAX_TOTAL_CHARS);
  } catch (err) {
    result.error = err.name === 'AbortError' ? 'Tiempo de espera agotado' : err.message;
  }
  return result;
}

module.exports = { extractWebsite };
