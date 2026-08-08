/* ============================================================
   AQUILES Patrón — Función de firma electrónica
   - GET  ?token=XXX  → muestra la página para firmar el documento.
   - POST (token, email, nombre, firma) → guarda la firma + evidencia.

   Usa la llave de SERVICIO de Supabase (solo en el servidor) para
   el flujo público por token, sin exponer toda la base.

   Firma electrónica SIMPLE con valor probatorio. NO es NOM-151.
   ============================================================ */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://hecvpmibfqarilgegobx.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function admin() {
  return createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });
}

function esc(s) {
  return (s == null ? '' : String(s)).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

exports.handler = async (event) => {
  if (!SERVICE_KEY) {
    return html(500, paginaError('Falta configurar la llave del servidor (SUPABASE_SERVICE_ROLE_KEY).'));
  }

  // ---------- GET: mostrar la página de firma ----------
  if (event.httpMethod === 'GET') {
    const token = (event.queryStringParameters || {}).token;
    if (!token) return html(400, paginaError('Link inválido (falta el token).'));
    try {
      const sb = admin();
      const { data, error } = await sb.from('signatures').select('*').eq('token', token).maybeSingle();
      if (error) throw error;
      if (!data) return html(404, paginaError('Este documento no existe o el link expiró.'));
      if (data.estado === 'firmado') return html(200, paginaYaFirmado(data));
      return html(200, paginaFirmar(data));
    } catch (e) {
      return html(500, paginaError('No se pudo cargar el documento. ' + (e.message || '')));
    }
  }

  // ---------- POST: guardar la firma ----------
  if (event.httpMethod === 'POST') {
    let body;
    try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Datos inválidos.' }); }
    const { token, email, nombre, firmaImg } = body;
    if (!token || !email || !firmaImg) return json(400, { error: 'Falta correo o firma.' });

    try {
      const sb = admin();
      const { data: sig, error: e1 } = await sb.from('signatures').select('id,estado').eq('token', token).maybeSingle();
      if (e1) throw e1;
      if (!sig) return json(404, { error: 'Documento no encontrado.' });
      if (sig.estado === 'firmado') return json(409, { error: 'Este documento ya fue firmado.' });

      const ip = event.headers['x-nf-client-connection-ip'] || event.headers['x-forwarded-for'] || '';
      const ua = event.headers['user-agent'] || '';

      const { error: e2 } = await sb.from('signatures').update({
        estado: 'firmado',
        firmante_email: String(email).slice(0, 200),
        firmante_nombre: nombre ? String(nombre).slice(0, 200) : null,
        firma_img: firmaImg,
        firmado_at: new Date().toISOString(),
        firmante_ip: ip,
        firmante_ua: ua.slice(0, 400),
      }).eq('id', sig.id);
      if (e2) throw e2;

      return json(200, { ok: true });
    } catch (e) {
      return json(500, { error: 'No se pudo guardar la firma. ' + (e.message || '') });
    }
  }

  return json(405, { error: 'Método no permitido' });
};

/* ---------- Páginas HTML ---------- */

function paginaFirmar(d) {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Firmar: ${esc(d.doc_titulo || 'Documento')}</title>
<style>
  body{margin:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;background:#eee7d8;color:#14192a;}
  .bar{background:#0a0e1a;color:#f4f1ea;padding:14px 18px;font-size:14px;text-align:center;}
  .wrap{max-width:720px;margin:0 auto;padding:18px 16px 60px;}
  .doc{background:#fff;border:1px solid #d8d0c0;border-radius:10px;padding:22px 20px;font-family:Georgia,serif;font-size:13px;line-height:1.55;text-align:justify;max-height:50vh;overflow-y:auto;}
  .panel{background:#fff;border:1px solid #d8d0c0;border-radius:10px;padding:18px;margin-top:16px;}
  label{display:block;font-size:12px;font-weight:600;margin:10px 0 4px;}
  input{width:100%;box-sizing:border-box;padding:10px;border:1px solid #bbb;border-radius:8px;font-size:14px;}
  canvas{border:1px dashed #999;border-radius:8px;width:100%;height:180px;touch-action:none;background:#fcfcfc;}
  .row{display:flex;gap:10px;margin-top:10px;}
  button{flex:1;padding:12px;border:none;border-radius:8px;font-size:14px;font-weight:600;cursor:pointer;}
  .clear{background:#eee;color:#333;}
  .sign{background:#0a0e1a;color:#fff;}
  .aviso{font-size:11px;color:#777;margin-top:12px;line-height:1.5;}
  .ok{text-align:center;padding:40px 20px;}
  .ok .big{font-size:48px;color:#1b8a5a;}
</style></head><body>
<div class="bar">AQUILES Patrón · Firma de documento</div>
<div class="wrap">
  <h2 style="font-family:Georgia,serif;">${esc(d.doc_titulo || 'Documento')}</h2>
  <p style="font-size:13px;color:#555;">Lee el documento y firma al final para dar tu conformidad.</p>
  <div class="doc">${d.doc_html || '<p>(documento)</p>'}</div>

  <div class="panel" id="panel">
    <label>Tu correo electrónico</label>
    <input id="email" type="email" placeholder="tu@correo.com" />
    <label>Tu nombre completo</label>
    <input id="nombre" type="text" placeholder="Nombre y apellidos" />
    <label>Dibuja tu firma</label>
    <canvas id="cv"></canvas>
    <div class="row">
      <button class="clear" onclick="limpiar()">Borrar</button>
      <button class="sign" onclick="firmar()">Firmar y aceptar</button>
    </div>
    <div id="msg" style="font-size:12px;min-height:16px;margin-top:8px;"></div>
    <p class="aviso">Al firmar aceptas el contenido de este documento. Se registrará tu correo, la fecha y hora, tu dirección IP y dispositivo como evidencia de aceptación. Firma electrónica con valor probatorio (no es constancia NOM-151).</p>
  </div>
</div>
<script>
  var cv=document.getElementById('cv'),ctx=cv.getContext('2d'),dib=false,vacio=true;
  function fit(){var r=cv.getBoundingClientRect();cv.width=r.width;cv.height=r.height;ctx.lineWidth=2.2;ctx.lineCap='round';ctx.strokeStyle='#14192a';}
  fit();window.addEventListener('resize',fit);
  function pos(e){var r=cv.getBoundingClientRect();var t=e.touches?e.touches[0]:e;return{x:t.clientX-r.left,y:t.clientY-r.top};}
  function start(e){dib=true;var p=pos(e);ctx.beginPath();ctx.moveTo(p.x,p.y);e.preventDefault();}
  function move(e){if(!dib)return;var p=pos(e);ctx.lineTo(p.x,p.y);ctx.stroke();vacio=false;e.preventDefault();}
  function end(){dib=false;}
  cv.addEventListener('mousedown',start);cv.addEventListener('mousemove',move);window.addEventListener('mouseup',end);
  cv.addEventListener('touchstart',start);cv.addEventListener('touchmove',move);cv.addEventListener('touchend',end);
  function limpiar(){ctx.clearRect(0,0,cv.width,cv.height);vacio=true;}
  function msg(t,c){var m=document.getElementById('msg');m.textContent=t;m.style.color=c||'#555';}
  function firmar(){
    var email=document.getElementById('email').value.trim();
    var nombre=document.getElementById('nombre').value.trim();
    if(!email||email.indexOf('@')<0){msg('Escribe un correo válido.','#c0392b');return;}
    if(vacio){msg('Dibuja tu firma en el recuadro.','#c0392b');return;}
    msg('Enviando…');
    var firmaImg=cv.toDataURL('image/png');
    fetch(location.pathname,{method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({token:${JSON.stringify(d.token)},email:email,nombre:nombre,firmaImg:firmaImg})})
      .then(function(r){return r.json();}).then(function(d){
        if(d.ok){document.getElementById('panel').innerHTML='<div class="ok"><div class="big">✓</div><h3>¡Documento firmado!</h3><p>Gracias. Tu firma quedó registrada.</p></div>';}
        else{msg(d.error||'No se pudo firmar.','#c0392b');}
      }).catch(function(){msg('Error de conexión. Intenta de nuevo.','#c0392b');});
  }
</script>
</body></html>`;
}

function paginaYaFirmado(d) {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Documento ya firmado</title></head>
<body style="font-family:system-ui,sans-serif;background:#eee7d8;color:#14192a;text-align:center;padding:60px 20px;">
<div style="font-size:48px;color:#1b8a5a;">✓</div>
<h2>Este documento ya fue firmado</h2>
<p style="color:#555;">${esc(d.doc_titulo || '')}<br>Firmado el ${esc(d.firmado_at || '')}.</p>
</body></html>`;
}

function paginaError(m) {
  return `<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Aviso</title></head>
<body style="font-family:system-ui,sans-serif;background:#eee7d8;color:#14192a;text-align:center;padding:60px 20px;">
<div style="font-size:40px;">⚠️</div><h2>No se pudo abrir el documento</h2><p style="color:#555;">${esc(m)}</p></body></html>`;
}

function html(status, body) {
  return { statusCode: status, headers: { 'Content-Type': 'text/html; charset=utf-8' }, body };
}
function json(status, obj) {
  return { statusCode: status, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(obj) };
}
