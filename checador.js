/* ============================================================
   AQUILES Patrón — Checador electrónico real
   Registra entrada/salida de los trabajadores con
   geolocalización real, guardado en Supabase, aislado por empresa.

   Depende de: sb, sesion, miEmpresa (backend.js).
   Sin sesión, el checador sigue mostrando la demo.
   ============================================================ */

let _chEmps = [];
let _chBusy = false;

function _chEsc(s) {
  return (s == null ? '' : String(s)).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
function _chIniciales(nombre) {
  return (nombre || '?').trim().split(/\s+/).map(w => w[0] || '').slice(0, 2).join('').toUpperCase();
}

// Se llama al abrir la pantalla del checador (desde showScreen).
async function checadorAlAbrir() {
  const real = document.getElementById('checador-real');
  const demo = document.getElementById('checador-demo-grid');
  const meta = document.querySelector('#checador-select .checador-meta');
  if (!real || !demo) return;

  if (!sb || !sesion || !miEmpresa) {
    // Sin sesión: modo demo (como siempre).
    real.style.display = 'none';
    demo.style.display = '';
    return;
  }

  demo.style.display = 'none';
  real.style.display = 'block';
  real.innerHTML = '<p style="color:rgba(244,241,234,0.6);font-size:13px;">Cargando trabajadores…</p>';

  try {
    const r = await sb.from('employees').select('id,full_name,position').order('full_name', { ascending: true });
    if (r.error) throw r.error;
    _chEmps = r.data || [];
  } catch (e) {
    real.innerHTML = `<p style="color:#e08278;font-size:13px;">No se pudieron cargar los trabajadores: ${_chEsc(e.message || '')}</p>`;
    return;
  }

  if (_chEmps.length === 0) {
    real.innerHTML = `<p style="color:rgba(244,241,234,0.7);font-size:13px;">Aún no hay trabajadores. Agrégalos en el panel del administrador.</p>`;
    return;
  }
  renderChecadorReal();
}

function renderChecadorReal() {
  const real = document.getElementById('checador-real');
  if (!real) return;
  const cards = _chEmps.map(e => `
    <div class="checador-emp" onclick="marcarChecada('${e.id}','entrada')" style="position:relative;">
      <div class="ce-av">${_chEsc(_chIniciales(e.full_name))}</div>
      <div class="ce-name">${_chEsc(e.full_name.split(' ')[0])}</div>
      <div style="display:flex;gap:4px;margin-top:6px;justify-content:center;">
        <button onclick="event.stopPropagation();marcarChecada('${e.id}','entrada')" style="font-size:10px;padding:3px 8px;border-radius:6px;border:none;background:rgba(120,200,150,0.25);color:#bfe8cf;cursor:pointer;">Entrada</button>
        <button onclick="event.stopPropagation();marcarChecada('${e.id}','salida')" style="font-size:10px;padding:3px 8px;border-radius:6px;border:none;background:rgba(200,150,120,0.25);color:#e8cfbf;cursor:pointer;">Salida</button>
      </div>
    </div>`).join('');
  real.innerHTML = `<div class="checador-emp-grid">${cards}</div>`;
}

// Obtiene la geolocalización (promesa). Resuelve null si no se puede.
function _obtenerUbicacion() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) { resolve(null); return; }
    const timeout = setTimeout(() => resolve(null), 8000);
    navigator.geolocation.getCurrentPosition(
      (pos) => { clearTimeout(timeout); resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude, precision: pos.coords.accuracy }); },
      () => { clearTimeout(timeout); resolve(null); },
      { enableHighAccuracy: true, timeout: 7000, maximumAge: 0 }
    );
  });
}

async function marcarChecada(empId, tipo) {
  if (_chBusy) return;
  if (!sb || !sesion || !miEmpresa) return;
  _chBusy = true;

  const emp = _chEmps.find(e => e.id === empId);
  const nombre = emp ? emp.full_name : 'Trabajador';

  // Mostrar la confirmación de inmediato con "obteniendo ubicación".
  mostrarChecadaConfirm(nombre, tipo, 'Obteniendo ubicación…');

  const ubi = await _obtenerUbicacion();

  const ahora = new Date();
  const hh = ahora.getHours().toString().padStart(2, '0');
  const mm = ahora.getMinutes().toString().padStart(2, '0');

  try {
    const fila = {
      company_id: miEmpresa,
      employee_id: empId,
      tipo,
      lat: ubi ? ubi.lat : null,
      lng: ubi ? ubi.lng : null,
      precision_m: ubi ? ubi.precision : null,
      estado: 'ok',
    };
    const { error } = await sb.from('checadas').insert([fila]);
    if (error) throw error;

    const ubiTxt = ubi
      ? `✓ ${ubi.lat.toFixed(5)}, ${ubi.lng.toFixed(5)} (±${Math.round(ubi.precision)} m)`
      : '⚠ Sin ubicación (permiso denegado o no disponible)';
    mostrarChecadaConfirm(nombre, tipo, `${hh}:${mm}`, ubiTxt, true);
  } catch (e) {
    console.warn('No se pudo registrar la checada.', e);
    mostrarChecadaConfirm(nombre, tipo, `${hh}:${mm}`, 'No se pudo guardar: ' + (e.message || ''), false);
  } finally {
    _chBusy = false;
  }
}

// Enganchar: cuando se abre la pantalla del checador, cargar lo real.
window.addEventListener('DOMContentLoaded', () => {
  const orig = window.showScreen;
  if (typeof orig === 'function') {
    window.showScreen = function (screenId) {
      orig.apply(this, arguments);
      if (screenId === 'screen-checador') checadorAlAbrir();
    };
  }
});

function mostrarChecadaConfirm(nombre, tipo, hora, ubiTxt, ok) {
  const sel = document.getElementById('checador-select');
  const done = document.getElementById('checador-done');
  if (sel) sel.style.display = 'none';
  if (done) done.style.display = 'block';
  const msg = document.getElementById('cf-msg');
  const detail = document.getElementById('cf-detail');
  const extra = document.getElementById('cf-extra');
  const lateWarn = document.getElementById('cf-late-warn');
  if (lateWarn) lateWarn.style.display = 'none';
  if (msg) msg.textContent = (tipo === 'salida' ? 'Salida registrada' : 'Entrada registrada');
  if (detail) detail.textContent = `${nombre} · ${hora}`;
  if (extra) {
    if (ubiTxt) {
      extra.innerHTML = `<span>${_chEsc(ubiTxt)}</span>` + (ok ? '<span>✓ Sellado en la nube</span>' : '');
    } else {
      extra.innerHTML = '';
    }
  }
}
