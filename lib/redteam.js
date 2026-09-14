// Red team de ideas para founders: prompt, esquema y prompt de usuario.
// Misma disciplina que el memo inversor: nada inventado, "sin datos" es valido.

const REDTEAM_SYSTEM_PROMPT = `Eres un inversor de venture capital early-stage haciendo red team de la IDEA de un founder. Tu trabajo no es animar: es encontrar por que puede fallar antes de que lo haga.

REGLAS ESTRICTAS:
- NUNCA des una nota numerica (ni 8/10 ni scores). El juicio va en texto: que hay que demostrar, quien murio, la objecion real.
- "Quien murio intentandolo" solo con empresas REALES y documentadas que encontraste con la busqueda web; incluye la URL de la fuente. Si no encuentras comparables fallidos reales, escribe "sin datos" en ese apartado antes que inventar.
- No inventes cifras, nombres ni URLs. "sin datos" es mejor que una inferencia.
- Claims ordenados por dificultad de demostrarlos: "alta" (lo que mas tarda en probarse), "media", "baja".
- La objecion del VC es UNA, la mas dura, la que decidiria el pase.
- El experimento debe ser realmente ejecutable en una semana con presupuesto casi cero.
- Responde en el idioma pedido (es o en). Terminos tecnicos en su idioma original.`;

const REDTEAM_SCHEMA = {
  type: 'object',
  properties: {
    idea_resumen: { type: 'string' },
    claims: { type: 'array', items: { type: 'object', properties: {
      claim: { type: 'string' }, dificultad: { type: 'string', enum: ['alta', 'media', 'baja'] }, por_que: { type: 'string' } }, required: ['claim', 'dificultad', 'por_que'] } },
    muertos: { type: 'array', items: { type: 'object', properties: {
      nombre: { type: 'string' }, que_hacian: { type: 'string' }, que_paso: { type: 'string' }, fuente: { type: 'string' } }, required: ['nombre', 'que_hacian', 'que_paso', 'fuente'] } },
    objecion_vc: { type: 'string' },
    experimento: { type: 'object', properties: {
      que: { type: 'string' }, coste_estimado: { type: 'string' }, senal_de_exito: { type: 'string' } }, required: ['que', 'coste_estimado', 'senal_de_exito'] },
    riesgos: { type: 'array', items: { type: 'object', properties: {
      nivel: { type: 'string', enum: ['alto', 'medio', 'bajo'] }, texto: { type: 'string' } }, required: ['nivel', 'texto'] } },
  },
  required: ['idea_resumen', 'claims', 'muertos', 'objecion_vc', 'experimento', 'riesgos'],
};

function buildRedTeamPrompt({ url, websiteText, websiteOk, descripcion, sector, etapa, lang }) {
  const idioma = lang === 'en' ? 'ENGLISH' : 'SPANISH';
  return `Red team de esta idea de startup. RESPONDE EN ${idioma}.

IDEA (lo que declara el founder):
${descripcion || '(sin descripcion escrita)'}
${url ? `\nWeb: ${url}\nContenido extraido de la web (${websiteOk ? 'ok' : 'no accesible'}):\n${(websiteText || 'sin datos').slice(0, 6000)}` : ''}
Sector declarado: ${sector || 'sin datos'} · Etapa: ${etapa || 'sin datos'}

Usa la busqueda web para: (1) encontrar empresas reales que intentaron algo parecido y murieron o pivotaron, con fuente; (2) comprobar si el problema y el mercado existen como los cuenta el founder; (3) detectar al competidor obvio que el founder no menciona.

Devuelve el JSON del esquema: idea_resumen (2 frases, sin palabreria), claims (lo que tendria que demostrar, ordenado por dificultad), muertos (comparables fallidos REALES con URL de fuente), objecion_vc (una sola, la mas dura), experimento (el mas barato para esta semana, con coste y señal de exito), riesgos (semaforo alto/medio/bajo con texto corto).`;
}

module.exports = { REDTEAM_SYSTEM_PROMPT, REDTEAM_SCHEMA, buildRedTeamPrompt };
