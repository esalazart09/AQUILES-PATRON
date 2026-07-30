/* ============================================================
   AQUILES Patrón — Función de servidor: leer documento con IA
   Recibe una imagen (INE, comprobante de domicilio, CURP, etc.),
   se la manda a Claude (que "ve" la imagen) y devuelve los datos
   extraídos en formato estructurado, listos para llenar la ficha.

   La API key vive SOLO aquí (variable de entorno del servidor),
   nunca en la app del navegador.
   ============================================================ */

const Anthropic = require('@anthropic-ai/sdk');

// Modelo configurable por variable de entorno (a prueba de futuro).
const MODELO = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5';

// Qué datos pedimos según el tipo de documento.
const INSTRUCCIONES = {
  INE: `Es una credencial para votar (INE) de México. Extrae, si aparecen:
- full_name (nombre completo, en orden natural Nombre Apellidos)
- curp
- address (domicilio completo)
- birth_date (fecha de nacimiento en formato AAAA-MM-DD)
- sex`,
  CURP: `Es una constancia de CURP de México. Extrae si aparecen:
- full_name (nombre completo)
- curp
- birth_date (AAAA-MM-DD)
- rfc (si aparece)`,
  'Comprobante de domicilio': `Es un comprobante de domicilio (recibo de luz, agua, etc.). Extrae si aparece:
- full_name (titular del recibo)
- address (domicilio completo)`,
  NSS: `Es un documento del IMSS. Extrae si aparece:
- full_name
- nss (Número de Seguridad Social, 11 dígitos)
- curp`,
  Otro: `Extrae los datos personales que reconozcas: full_name, curp, rfc, nss, address, birth_date (AAAA-MM-DD).`,
};

exports.handler = async (event) => {
  // Solo POST.
  if (event.httpMethod !== 'POST') {
    return json(405, { error: 'Método no permitido' });
  }
  if (!process.env.ANTHROPIC_API_KEY) {
    return json(500, { error: 'Falta configurar ANTHROPIC_API_KEY en el servidor.' });
  }

  let body;
  try {
    body = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: 'Cuerpo inválido.' });
  }

  const { imageBase64, mediaType, docType } = body;
  if (!imageBase64 || !mediaType) {
    return json(400, { error: 'Falta la imagen o su tipo.' });
  }
  // Límite defensivo (~7 MB en base64 ≈ 5 MB de imagen).
  if (imageBase64.length > 7_500_000) {
    return json(413, { error: 'La imagen es muy grande (máx. ~5 MB).' });
  }

  const instruccion = INSTRUCCIONES[docType] || INSTRUCCIONES.Otro;

  try {
    const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
    const msg = await client.messages.create({
      model: MODELO,
      max_tokens: 1024,
      system:
        'Eres un asistente que extrae datos de documentos oficiales mexicanos. ' +
        'Devuelve EXCLUSIVAMENTE un objeto JSON válido, sin texto adicional, sin markdown. ' +
        'Usa null en los campos que no aparezcan con claridad. No inventes datos. ' +
        'Las fechas en formato AAAA-MM-DD.',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mediaType, data: imageBase64 } },
            {
              type: 'text',
              text:
                instruccion +
                '\n\nResponde solo con el JSON. Claves posibles: full_name, curp, rfc, nss, address, birth_date, sex.',
            },
          ],
        },
      ],
    });

    const texto = (msg.content || [])
      .filter((b) => b.type === 'text')
      .map((b) => b.text)
      .join('')
      .trim();

    const datos = extraeJson(texto);
    if (!datos) {
      return json(502, { error: 'La IA no devolvió datos legibles.', raw: texto.slice(0, 300) });
    }
    return json(200, { ok: true, datos });
  } catch (e) {
    return json(502, { error: 'No se pudo leer el documento.', detalle: String(e && e.message || e) });
  }
};

// Extrae el primer objeto JSON del texto (por si el modelo agrega algo).
function extraeJson(texto) {
  if (!texto) return null;
  try { return JSON.parse(texto); } catch {}
  const a = texto.indexOf('{');
  const b = texto.lastIndexOf('}');
  if (a > -1 && b > a) {
    try { return JSON.parse(texto.slice(a, b + 1)); } catch {}
  }
  return null;
}

function json(status, obj) {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(obj),
  };
}
