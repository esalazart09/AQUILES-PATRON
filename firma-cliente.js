/* ============================================================
   AQUILES Patrón — Crear solicitud de firma (lado del patrón)
   Toma un documento generado (HTML), calcula su hash, lo guarda
   como solicitud de firma y devuelve el link para enviárselo al
   trabajador.

   Depende de: sb, sesion, miEmpresa (backend.js).
   ============================================================ */

// Hash SHA-256 del documento (integridad).
async function _fcHash(texto) {
  try {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(texto));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  } catch { return ''; }
}

// Token secreto para el link.
function _fcToken() {
  const a = new Uint8Array(18);
  crypto.getRandomValues(a);
  return Array.from(a).map(b => b.toString(16).padStart(2, '0')).join('');
}

/*
  Crea una solicitud de firma.
  opts = { empId, docTipo, docTitulo, docHtml }
  Devuelve { url } o lanza error.
*/
async function crearSolicitudFirma(opts) {
  if (!sb || !sesion || !miEmpresa) throw new Error('Inicia sesión.');
  const token = _fcToken();
  const hash = await _fcHash(opts.docHtml || '');
  const { error } = await sb.from('signatures').insert([{
    company_id: miEmpresa,
    employee_id: opts.empId || null,
    token,
    doc_tipo: opts.docTipo || null,
    doc_titulo: opts.docTitulo || 'Documento',
    doc_html: opts.docHtml || '',
    doc_hash: hash,
  }]);
  if (error) throw error;
  const url = `${location.origin}/.netlify/functions/firma?token=${token}`;
  return { url, token, hash };
}

// Muestra un cuadro con el link para copiar/compartir.
function mostrarLinkFirma(url, titulo) {
  const ov = document.getElementById('firma-link-overlay');
  const card = document.getElementById('firma-link-card');
  if (!ov || !card) { prompt('Link de firma (cópialo):', url); return; }
  card.innerHTML = `
    <h3 style="font-family:Fraunces,serif;font-size:19px;margin:0 0 6px;color:#14192a;">Link de firma listo</h3>
    <p style="font-size:12.5px;color:#555;margin:0 0 12px;">Envíaselo al trabajador por WhatsApp o correo. Al abrirlo podrá leer <b>${(titulo||'el documento').replace(/[<>&]/g,'')}</b> y firmarlo con el dedo.</p>
    <input id="firma-link-input" readonly value="${url.replace(/"/g,'&quot;')}" style="width:100%;box-sizing:border-box;padding:10px;border:1px solid #bbb;border-radius:8px;font-size:12px;color:#14192a;background:#fff;" />
    <div style="display:flex;gap:10px;margin-top:12px;">
      <button class="gen-btn" onclick="copiarLinkFirma()">Copiar link</button>
      <a class="gen-btn" style="text-decoration:none;text-align:center;" href="https://wa.me/?text=${encodeURIComponent('Por favor firma este documento: ' + url)}" target="_blank">Enviar por WhatsApp</a>
      <button class="gen-btn ghost" onclick="cerrarLinkFirma()">Cerrar</button>
    </div>
    <div id="firma-link-msg" style="font-size:12px;min-height:14px;margin-top:8px;color:#1b8a5a;"></div>
    <p style="font-size:11px;color:#888;margin-top:10px;">Firma electrónica con valor probatorio (registra correo, fecha, IP y dispositivo). No es constancia NOM-151.</p>
  `;
  ov.style.display = 'flex';
}
function copiarLinkFirma() {
  const el = document.getElementById('firma-link-input');
  if (!el) return;
  el.select();
  navigator.clipboard?.writeText(el.value).then(
    () => { const m = document.getElementById('firma-link-msg'); if (m) m.textContent = '✓ Link copiado.'; },
    () => { try { document.execCommand('copy'); } catch {} }
  );
}
function cerrarLinkFirma() {
  const ov = document.getElementById('firma-link-overlay');
  if (ov) ov.style.display = 'none';
}

window.addEventListener('DOMContentLoaded', () => {
  const ov = document.getElementById('firma-link-overlay');
  if (ov) ov.addEventListener('click', e => { if (e.target === ov) cerrarLinkFirma(); });
});
