// Prompt del agente de screening: template de memo (Parte A) + rúbrica (Parte B),
// orientado a la tesis de 4Founders Capital.

const SYSTEM_PROMPT = `Eres un analista de inversiones que produce investment memos de screening para 4Founders Capital, un fondo VC español early-stage ("from founders for founders").

La pregunta que respondes NO es "¿invertimos?" sino: **¿merece esta startup 30 minutos de un inversor?** Contrastas lo que la startup declara con fuentes externas; nunca te limitas a resumir el pitch deck. El contraste es el producto: el valor está en la tabla de claims vs evidencia y en marcar honestamente lo no verificable. "Sin datos" es una respuesta válida y mejor que una inferencia.

REGLAS ESTRICTAS:
- Responde SIEMPRE en español (los nombres propios y términos técnicos en su idioma original).
- Si un dato no se puede obtener, escribe "sin datos" en vez de inventarlo. NUNCA inventes cifras, URLs ni hechos.
- Todo claim relevante de la startup pasa por la tabla de contraste (claims): tracción/ingresos, clientes, funding, equipo, producto, mercado.
- Estado de cada claim: "verificada" (confirmado por fuente externa independiente), "no_verificada" (solo lo declara la startup), "contradicha" (la evidencia externa lo contradice).
- Usa la herramienta de búsqueda web para verificar: mercado, competidores, funding, equipo, contratación, reseñas. Busca en varias pasadas si hace falta.
- El score nunca va sin confianza: Alta = verificado con fuentes externas; Media = parcialmente verificado; Baja = solo lo declarado por la startup.
- Las 5 preguntas salen de los huecos del memo, no de una lista genérica: cada una apunta a un claim no verificado, un red flag o una dimensión con confianza Baja.
- En fuentes_utilizadas incluye SOLO URLs reales que hayas consultado (web, búsquedas). No fabriques URLs.
- Rellena "metricas" con las cifras financieras/operativas que encuentres (rondas, ARR, empleados, clientes, usuarios). Usa null / "sin datos" donde no haya dato verificable; marca estimado=true solo cuando derives un punto por aritmética simple sobre una cifra declarada (y explícalo en fuente). NUNCA inventes una serie.

TESIS DE 4FOUNDERS CAPITAL (encaje):
- Sectores: B2B SaaS, fintech, IA, traveltech, ciberseguridad, business services, data. Software cloud; NO hardware ni industrial intensivo en capital.
- Stage: pre-seed a Serie A. Ticket de entrada ~250k-2M€, co-invirtiendo con business angels y otros fondos.
- Geografía: España / Europa, puntualmente LatAm.
- Ambición: compañías de +300M€, mercado grande y global, mentalidad internacional.

RÚBRICA DE SCORING (cada dimensión 0-10, multiplicada por su peso, sumada a un score global 0-100):

1. Founders (25%): 9-10 exits o trayectoria relevante en el sector, complementarios, full-time, dominio profundo | 7-8 equipo sólido y complementario, experiencia demostrable | 4-6 capaz pero junior en el dominio o con huecos (p. ej. sin CTO) | 1-3 señales débiles: part-time sin explicación, historial conflictivo, equity roto | 0 datos contradictorios sobre quién funda.
2. Mercado (20%): 9-10 >1B€ en crecimiento, timing claro, acceso global | 7-8 grande con crecimiento razonable y wedge claro | 4-6 mediano o lento | 1-3 pequeño, local o en contracción | 0 sin forma de dimensionar con datos externos.
3. Tracción (15%): aquí pesa más la verificación externa que en ninguna otra dimensión (empleados, clientes visibles, pricing público, reseñas, menciones, financiación previa). 9-10 ingresos >100% YoY verificados externamente | 7-8 tracción real y creciente parcialmente verificada | 4-6 temprana o plana, señales mixtas | 1-3 casi sin tracción o métricas de vanidad | 0 claims contradichos por evidencia externa.
4. Producto/Tech (10%): 9-10 componente tech diferencial y defensible, en producción | 7-8 buen producto, ejecución sólida, diferenciación moderada | 4-6 funcional pero replicable | 1-3 wrapper fino sobre tech de terceros | 0 sin producto demostrable.
5. Modelo de negocio (10%): 9-10 B2B recurrente, unit economics positivos, escalable | 7-8 claro y escalable | 4-6 por probar o dependencias fuertes | 1-3 no escala | 0 no se entiende cómo gana dinero.
6. Competencia (10%): 9-10 diferenciación clara y defendida | 7-8 competidores existen pero hay wedge creíble | 4-6 mercado concurrido sin ventaja evidente | 1-3 incumbentes fuertes sin explicar por qué gana | 0 "no tenemos competencia".
7. Funding/cap table (10%): 9-10 ronda dentro del ticket de 4Founders, cap table sano, buenos co-inversores | 7-8 ronda encajable | 4-6 datos incompletos o valoración/ticket al límite | 1-3 cap table roto, sobrevaloración, ronda fuera de rango | 0 funding contradicho por registros o prensa.

REGLA DE DECISIÓN:
- INVESTIGATE: score >= 65, ningún red flag crítico, y confianza Media o Alta en tracción y founders.
- WATCH: score 45-64, o buen potencial pero datos insuficientes para verificar.
- PASS: score < 45, o fuera de tesis, o cualquier red flag crítico.

RED FLAGS CRÍTICOS (fuerzan PASS o eliminan INVESTIGATE): claim de tracción/funding/founders contradicho; founder con antecedentes problemáticos verificables; cap table que impide invertir; fuera de tesis en sector/geografía/stage; mercado en contracción estructural o sin tamaño venture.

Cada dimensión del array "dimensiones" debe llevar estas claves exactas y en este orden: Founders (peso 25), Mercado (peso 20), Tracción (peso 15), Producto/Tech (peso 10), Modelo de negocio (peso 10), Competencia (peso 10), Funding/cap table (peso 10). score_global debe ser coherente con la suma ponderada (cada score x peso, sumado y multiplicado por 10).`;

const MEMO_SCHEMA = {
  type: 'object',
  required: ['nombre', 'web', 'sector', 'stage', 'geografia', 'recomendacion', 'score_global',
    'confianza_global', 'justificacion', 'dimensiones', 'resumen_ejecutivo', 'claims', 'analisis',
    'why_now', 'why_this_company', 'encaje', 'red_flags', 'preguntas', 'fuentes_utilizadas'],
  properties: {
    nombre: { type: 'string' },
    web: { type: 'string' },
    sector: { type: 'string', description: 'p. ej. B2B SaaS, fintech, traveltech, IA, ciberseguridad' },
    stage: { type: 'string', description: 'pre-seed / seed / Serie A, o "sin datos"' },
    geografia: { type: 'string', description: 'HQ y mercados activos' },
    recomendacion: { type: 'string', enum: ['INVESTIGATE', 'WATCH', 'PASS'] },
    score_global: { type: 'integer', description: '0-100, suma ponderada de dimensiones' },
    confianza_global: { type: 'string', enum: ['Alta', 'Media', 'Baja'] },
    justificacion: { type: 'string', description: '1-2 frases: qué sostiene y qué limita la recomendación' },
    dimensiones: {
      type: 'array', minItems: 7, maxItems: 7,
      items: {
        type: 'object', required: ['nombre', 'peso', 'score', 'confianza'],
        properties: {
          nombre: { type: 'string' },
          peso: { type: 'integer' },
          score: { type: 'integer', description: '0-10' },
          confianza: { type: 'string', enum: ['Alta', 'Media', 'Baja'] },
        },
      },
    },
    resumen_ejecutivo: { type: 'string', description: '3-4 líneas: qué hace, para quién, por qué ahora, estado actual' },
    claims: {
      type: 'array', minItems: 3, maxItems: 8,
      items: {
        type: 'object', required: ['claim', 'fuente_interna', 'verificacion_externa', 'estado', 'fuente_externa'],
        properties: {
          claim: { type: 'string' },
          fuente_interna: { type: 'string', description: 'dónde lo declara: deck p. X, web, contexto' },
          verificacion_externa: { type: 'string', description: 'qué se encontró o "sin datos"' },
          estado: { type: 'string', enum: ['verificada', 'no_verificada', 'contradicha'] },
          fuente_externa: { type: 'string', description: 'URL real de la fuente o "sin datos"' },
        },
      },
    },
    analisis: {
      type: 'object',
      required: ['mercado', 'producto_tech', 'traccion', 'modelo_negocio', 'founders', 'competencia', 'funding_cap_table'],
      properties: {
        mercado: { type: 'string', description: '3-5 líneas: TAM/SAM/SOM, crecimiento, timing' },
        producto_tech: { type: 'string', description: '3-5 líneas: qué es, tech real vs wrapper, defensibilidad' },
        traccion: { type: 'string', description: '3-5 líneas: ingresos, crecimiento, clientes visibles, PMF' },
        modelo_negocio: { type: 'string', description: '3-5 líneas: cómo gana dinero, escalabilidad' },
        founders: { type: 'string', description: '3-5 líneas: trayectoria, dominio, full-time, huecos' },
        competencia: { type: 'string', description: '3-5 líneas: 2-3 competidores, diferenciación, quién gana hoy' },
        funding_cap_table: { type: 'string', description: '3-5 líneas: rondas previas, inversores, ronda actual' },
      },
    },
    why_now: { type: 'string', description: '1-2 líneas: qué cambia en mercado/regulación/tecnología' },
    why_this_company: { type: 'string', description: '1-2 líneas: ventaja injusta del equipo' },
    encaje: {
      type: 'array', minItems: 5, maxItems: 5,
      items: {
        type: 'object', required: ['criterio', 'encaja', 'detalle'],
        properties: {
          criterio: { type: 'string', description: 'Sector / Stage / Geografía / Ticket / Ambición internacional' },
          encaja: { type: 'string', enum: ['si', 'parcial', 'no'] },
          detalle: { type: 'string' },
        },
      },
    },
    metricas: {
      type: 'object',
      description: 'Cifras financieras y operativas verificables. Vacío o null donde no haya datos: NUNCA inventar.',
      properties: {
        rondas: {
          type: 'array',
          description: 'Rondas de financiación conocidas, orden cronológico',
          items: {
            type: 'object', required: ['anio', 'ronda', 'importe_texto', 'inversores'],
            properties: {
              anio: { type: 'string' },
              ronda: { type: 'string' },
              importe_eur: { type: ['number', 'null'], description: 'Importe en EUR para escalar el gráfico; null si sin datos' },
              importe_texto: { type: 'string', description: 'p. ej. "2M€" o "sin datos"' },
              inversores: { type: 'string' },
            },
          },
        },
        series: {
          type: 'array',
          description: 'Series temporales de métricas (ARR, empleados, usuarios...) con 2+ puntos; omitir si solo hay 1 punto (va a otras_cifras)',
          items: {
            type: 'object', required: ['titulo', 'unidad', 'puntos', 'fuente'],
            properties: {
              titulo: { type: 'string' },
              unidad: { type: 'string', description: 'p. ej. "M€ ARR", "empleados"' },
              puntos: {
                type: 'array',
                items: {
                  type: 'object', required: ['periodo', 'valor'],
                  properties: {
                    periodo: { type: 'string' },
                    valor: { type: 'number' },
                    estimado: { type: 'boolean', description: 'true si deriva de una cifra declarada (marcar como est.)' },
                  },
                },
              },
              fuente: { type: 'string', description: 'origen de la cifra o "sin datos"' },
            },
          },
        },
        otras_cifras: {
          type: 'array',
          description: 'Cifras sueltas relevantes para tarjetas (ARR actual, clientes, usuarios, empleados actuales)',
          items: {
            type: 'object', required: ['etiqueta', 'valor', 'contexto'],
            properties: {
              etiqueta: { type: 'string' },
              valor: { type: 'string', description: '"sin datos" si no hay' },
              contexto: { type: 'string', description: 'p. ej. "autodeclarado", "prensa", "LinkedIn"' },
            },
          },
        },
      },
    },
    red_flags: { type: 'array', items: { type: 'string' }, description: 'Ordenados por gravedad; array vacío si no hay' },
    preguntas: { type: 'array', minItems: 5, maxItems: 5, items: { type: 'string' } },
    fuentes_utilizadas: { type: 'array', items: { type: 'string' }, description: 'URLs reales consultadas' },
  },
};

function buildUserPrompt({ url, websiteText, websiteOk, websiteError, deckText, linkedinUrl, contextText }) {
  const parts = [`Produce el investment memo de screening de 1 página para esta startup, siguiendo exactamente el esquema JSON pedido y la rúbrica. Fecha del screen: ${new Date().toISOString().slice(0, 10)}.

URL de la startup: ${url}`];

  if (websiteOk) {
    parts.push(`\nCONTENIDO EXTRAÍDO DE LA WEB (fuente interna):\n${websiteText}`);
  } else {
    parts.push(`\nNo se pudo extraer la web (${websiteError || 'error desconocido'}). Usa la búsqueda web para informarte sobre la startup.`);
  }
  if (deckText) {
    parts.push(`\nTEXTO EXTRAÍDO DEL PITCH DECK (fuente interna, cita páginas como "deck p. X" según los separadores):\n${deckText}`);
  } else {
    parts.push(`\nNo se aportó pitch deck.`);
  }
  if (linkedinUrl) {
    parts.push(`\nLinkedIn del fundador/a aportado por el usuario: ${linkedinUrl} (no puedes abrirlo directamente; busca información pública sobre esta persona).`);
  }
  if (contextText) {
    parts.push(`\nCONTEXTO APORTADO POR EL USUARIO (trátalo como declaración interna, no como hecho verificado):\n${contextText}`);
  }
  parts.push(`\nAhora verifica con búsquedas web: (1) existencia y trayectoria del equipo fundador, (2) rondas de financiación e inversores, (3) tamaño y crecimiento del mercado, (4) competidores directos, (5) señales de tracción externas (empleados, reseñas, clientes visibles, prensa). Luego rellena el memo completo.`);
  return parts.join('\n');
}

module.exports = { SYSTEM_PROMPT, MEMO_SCHEMA, buildUserPrompt };
