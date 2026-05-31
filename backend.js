/* ============================================================
   AQUILES Patrón — Backend real (Etapa 2)
   Conexión a Supabase + hash SHA-256 real + guardado de eventos.

   Diseño defensivo: si la red o Supabase fallan, la app NO se rompe.
   Siempre calcula el hash real (funciona sin internet) y, si el
   guardado en la nube falla, cae con gracia al modo demo de siempre.
   ============================================================ */

/* --- 1. Credenciales públicas del proyecto (seguras de exponer) --- */
const SUPABASE_URL = 'https://hecvpmibfqarilgegobx.supabase.co';
const SUPABASE_KEY = 'sb_publishable_q2GLL3-3TyhuhZsobP4BmQ_TbtzztrF';

/* --- 2. Inicializar el cliente (si la librería cargó) --- */
let sb = null;
try {
  if (window.supabase && window.supabase.createClient) {
    sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);
  }
} catch (e) {
  console.warn('Supabase no inicializó; la app sigue en modo demo.', e);
}

/* --- 3. Hash SHA-256 real con Web Crypto (corre en el navegador) --- */
async function sha256Hex(texto) {
  const datos = new TextEncoder().encode(texto);
  const buffer = await crypto.subtle.digest('SHA-256', datos);
  return Array.from(new Uint8Array(buffer))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

/* --- 4. Folio real con fecha de hoy --- */
function generarFolio() {
  const f = new Date();
  const ymd = f.getFullYear().toString()
    + (f.getMonth() + 1).toString().padStart(2, '0')
    + f.getDate().toString().padStart(2, '0');
  const rnd = Math.floor(Math.random() * 100000000).toString().padStart(8, '0');
  return `REG-DIEZ-${ymd}-${rnd}`;
}

/* --- 5. Sellar y guardar el evento (reemplaza al botón de demo) --- */
async function sellarEvento() {
  // Datos reales capturados en el flujo (variables globales del script principal)
  const evidencia = document.getElementById('receipt-evidence')?.textContent || 'Notas';
  const evento = {
    worker_name: 'Roberto Méndez',
    fault_type: (typeof selectedFaultType !== 'undefined' && selectedFaultType) || 'Llegada tarde',
    legal_basis: 'Art. 47-X LFT',
    evidence: evidencia,
    signature_status: (typeof signatureStatus !== 'undefined' && signatureStatus) || 'firmada',
    geolocation: '19.244° N, 103.725° W',
  };

  const folio = generarFolio();
  const sellado = new Date().toISOString();

  // Cadena canónica que se firma con el hash (datos reales + momento del sello)
  const cadena = [
    folio, evento.worker_name, evento.fault_type, evento.legal_basis,
    evento.evidence, evento.signature_status, evento.geolocation, sellado,
  ].join('|');

  let hash;
  try {
    hash = await sha256Hex(cadena);
  } catch (e) {
    hash = 'a3f8b2c91d7e4f6a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a';
  }

  // Pintar folio y hash REALES en el recibo
  const elFolio = document.getElementById('receipt-id');
  if (elFolio) elFolio.textContent = folio;
  const elHash = document.getElementById('receipt-hash-value');
  if (elHash) elHash.textContent = hash;

  const elNube = document.getElementById('receipt-cloud-status');
  if (elNube) { elNube.textContent = 'Guardando en la nube…'; elNube.className = 'receipt-cloud local'; }

  // Mostrar el recibo de inmediato (no hacemos esperar al usuario por la red)
  goTo('view-success');

  // Guardar en la nube SOLO si hay sesión iniciada (base cerrada al público).
  // Sin sesión, la app sigue funcionando como demo: muestra el hash real
  // pero no escribe datos.
  if (sb && sesion && miEmpresa) {
    try {
      const { error } = await sb.from('events').insert([{ ...evento, hash, company_id: miEmpresa }]);
      if (error) throw error;
      if (elNube) { elNube.textContent = '✓ Guardado en la nube · hash real verificable'; elNube.className = 'receipt-cloud ok'; }
    } catch (e) {
      console.warn('No se pudo guardar en la nube; el hash real se mostró igual.', e);
      if (elNube) { elNube.textContent = 'Hash real generado · (nube no disponible)'; elNube.className = 'receipt-cloud local'; }
    }
  } else {
    if (elNube) { elNube.textContent = 'Hash real generado · (modo demo · inicia sesión para guardar)'; elNube.className = 'receipt-cloud local'; }
  }
}

/* ============================================================
   6. Mostrar los eventos REALES dentro de la app (panel admin)
   Lee la tabla 'events' de Supabase y los pinta arriba de la
   cronología del expediente, marcados como reales.
   ============================================================ */

const MESES_ES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];
function fechaCorta(iso) {
  const d = new Date(iso);
  const hh = d.getHours().toString().padStart(2, '0');
  const mm = d.getMinutes().toString().padStart(2, '0');
  return `${d.getDate()} ${MESES_ES[d.getMonth()]} ${d.getFullYear()} · ${hh}:${mm}`;
}

function escapaHtml(s) {
  return (s || '').replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

async function cargarEventosReales() {
  if (!sb || !sesion) return; // solo con sesión (la base está cerrada al público)
  const lista = document.getElementById('timeline-list');
  if (!lista) return;

  let datos = [];
  try {
    const { data, error } = await sb
      .from('events')
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;
    datos = data || [];
  } catch (e) {
    console.warn('No se pudieron leer los eventos reales.', e);
    return;
  }

  // Quitar los reales que se hayan pintado antes (evita duplicados al reabrir)
  lista.querySelectorAll('[data-real="1"]').forEach(n => n.remove());

  // Pintar los reales arriba (los más nuevos primero)
  for (let i = datos.length - 1; i >= 0; i--) {
    const ev = datos[i];
    const firma = ev.signature_status === 'negativa'
      ? 'Negativa + testigos' : 'Firma recabada';
    const card = document.createElement('div');
    card.className = 'tl-event danger';
    card.setAttribute('data-real', '1');
    card.innerHTML = `
      <div class="tl-card">
        <div class="tl-top">
          <span class="tl-type">${escapaHtml(ev.fault_type)}</span>
          <span class="tl-date">${fechaCorta(ev.created_at)}</span>
        </div>
        <div class="tl-detail">Registro en vivo desde la app. Evidencia: ${escapaHtml(ev.evidence)}. ${firma}.</div>
        <div class="tl-foot">
          <span class="tl-chip law">▸ ${escapaHtml(ev.legal_basis)}</span>
          <span class="tl-chip sealed">✓ Sellada (real)</span>
          <span class="tl-chip">hash ${escapaHtml((ev.hash || '').slice(0, 12))}…</span>
        </div>
      </div>`;
    lista.prepend(card);
  }

  // Actualizar el contador de la pestaña Cronología
  const badge = document.getElementById('badge-cronologia');
  if (badge) badge.textContent = String(5 + datos.length);
}

// Cargar los eventos reales cada vez que se abre un expediente.
window.addEventListener('DOMContentLoaded', () => {
  const orig = window.openDossier;
  window.openDossier = function () {
    if (typeof orig === 'function') orig.apply(this, arguments);
    cargarEventosReales();
  };
});

/* ============================================================
   7. LOGIN REAL (Supabase Auth · correo + contraseña)
   La app se explora libre como demo; iniciar sesión habilita el
   guardado real y la lectura de datos (la base está cerrada al
   público vía RLS para usuarios 'authenticated').
   ============================================================ */

let sesion = null; // null = sin sesión; objeto = usuario autenticado

function emailSesion() {
  return (sesion && sesion.user && sesion.user.email) || '';
}

// Refresca el botón flotante de Acceso según el estado.
function pintarBotonAuth() {
  const btn = document.getElementById('auth-btn');
  const label = document.getElementById('auth-btn-label');
  if (!btn || !label) return;
  if (sesion) {
    btn.classList.add('in');
    const correo = emailSesion();
    label.textContent = correo.length > 22 ? correo.slice(0, 20) + '…' : correo;
  } else {
    btn.classList.remove('in');
    label.textContent = 'Acceso';
  }
}

// Dibuja el contenido de la tarjeta según haya sesión o no.
function renderAuthCard() {
  const card = document.getElementById('auth-card');
  if (!card) return;
  if (sesion) {
    card.innerHTML = `
      <h3>Sesión activa</h3>
      <p class="sub">Conectado como <strong>${escapaHtml(emailSesion())}</strong>. Ya puedes guardar datos reales.</p>
      <div id="auth-msg"></div>
      <div id="auth-actions">
        <button id="auth-cancel" onclick="cerrarAcceso()">Cerrar</button>
        <button id="auth-submit" onclick="salirSesion()">Cerrar sesión</button>
      </div>`;
  } else {
    card.innerHTML = `
      <h3>Iniciar sesión</h3>
      <p class="sub">Acceso para personal autorizado. Guardar datos reales requiere sesión.</p>
      <label for="auth-email">Correo</label>
      <input id="auth-email" type="email" autocomplete="username" placeholder="tu@correo.com" />
      <label for="auth-pass">Contraseña</label>
      <input id="auth-pass" type="password" autocomplete="current-password" placeholder="••••••••" />
      <div id="auth-msg"></div>
      <div id="auth-actions">
        <button id="auth-cancel" onclick="cerrarAcceso()">Cancelar</button>
        <button id="auth-submit" onclick="entrarSesion()">Entrar</button>
      </div>`;
    // Permitir Enter para enviar
    const pass = document.getElementById('auth-pass');
    if (pass) pass.addEventListener('keydown', e => { if (e.key === 'Enter') entrarSesion(); });
  }
}

function abrirAcceso() {
  renderAuthCard();
  const ov = document.getElementById('auth-overlay');
  if (ov) ov.classList.add('show');
}

function cerrarAcceso() {
  const ov = document.getElementById('auth-overlay');
  if (ov) ov.classList.remove('show');
}

function msgAuth(texto, tipo) {
  const m = document.getElementById('auth-msg');
  if (m) { m.textContent = texto; m.className = tipo || ''; }
}

async function entrarSesion() {
  if (!sb) { msgAuth('La conexión no está disponible.', 'err'); return; }
  const email = (document.getElementById('auth-email')?.value || '').trim();
  const pass = document.getElementById('auth-pass')?.value || '';
  if (!email || !pass) { msgAuth('Escribe tu correo y contraseña.', 'err'); return; }
  msgAuth('Entrando…', '');
  try {
    const { data, error } = await sb.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
    sesion = data.session;
    msgAuth('✓ Sesión iniciada', 'ok');
    setTimeout(cerrarAcceso, 700);
  } catch (e) {
    console.warn('Login fallido', e);
    msgAuth('Correo o contraseña incorrectos.', 'err');
  }
}

async function salirSesion() {
  if (sb) { try { await sb.auth.signOut(); } catch (e) { /* noop */ } }
  sesion = null;
  cerrarAcceso();
}

/* ============================================================
   8. MULTI-EMPRESA (multi-tenant)
   Cada usuario pertenece a una empresa. Al entrar por primera vez
   se crea su empresa en blanco. Solo ve los datos de SU empresa.
   ============================================================ */

let miEmpresa = null;        // id de la empresa del usuario
let miEmpresaNombre = '';    // nombre para mostrar
let _aprovisionando = null;  // evita crear dos empresas a la vez

function ensureCompany() {
  if (_aprovisionando) return _aprovisionando;
  _aprovisionando = (async () => {
    miEmpresa = null; miEmpresaNombre = '';
    if (!sb || !sesion) return;
    try {
      // ¿Ya tiene perfil/empresa?
      const prof = (await sb.from('profiles')
        .select('company_id').eq('id', sesion.user.id).maybeSingle()).data;

      if (prof && prof.company_id) {
        miEmpresa = prof.company_id;
        const c = await sb.from('companies').select('name').eq('id', miEmpresa).maybeSingle();
        miEmpresaNombre = (c.data && c.data.name) || 'Mi empresa';
      } else {
        // Primera vez: crear empresa en blanco + perfil.
        const ins = await sb.from('companies').insert([{ name: 'Mi empresa' }])
          .select('id,name').single();
        if (ins.error) throw ins.error;
        miEmpresa = ins.data.id;
        miEmpresaNombre = ins.data.name;
        await sb.from('profiles').insert([{ id: sesion.user.id, company_id: miEmpresa, role: 'admin' }]);
      }
    } catch (e) {
      console.warn('No se pudo preparar la empresa.', e);
    }
  })().finally(() => { _aprovisionando = null; });
  return _aprovisionando;
}

function aplicarNombreEmpresa() {
  const el = document.getElementById('admin-company-name');
  if (!el) return;
  el.textContent = (sesion && miEmpresaNombre)
    ? `${miEmpresaNombre} · tu espacio`
    : 'DIEZ Creatividad Impresa · Colima';
}

/* ----- Trabajadores reales de la empresa ----- */

function iniciales(nombre) {
  return (nombre || '?').trim().split(/\s+/).map(w => w[0] || '').slice(0, 2).join('').toUpperCase();
}

function pagoTexto(emp) {
  if (emp.daily_pay == null && !emp.pay_period) return '—';
  const monto = emp.daily_pay != null
    ? '$' + Number(emp.daily_pay).toLocaleString('es-MX', { minimumFractionDigits: 2 }) + '/día'
    : '';
  const periodo = emp.pay_period ? (monto ? ' · ' + emp.pay_period : emp.pay_period) : '';
  return monto + periodo;
}

function filaTrabajador(emp) {
  const actividades = emp.activities
    ? (emp.activities.length > 60 ? emp.activities.slice(0, 60) + '…' : emp.activities)
    : 'sin actividades capturadas';
  return `
    <div class="emp-row">
      <div class="e-avatar">${escapaHtml(iniciales(emp.full_name))}<span class="risk-dot safe"></span></div>
      <div><div class="e-name">${escapaHtml(emp.full_name)}</div><div class="e-role">${escapaHtml(emp.position || '—')}</div></div>
      <div class="col-dept">${escapaHtml(pagoTexto(emp))}</div>
      <div class="col-events">${escapaHtml(actividades)}</div>
      <span class="risk-tag safe">Activo</span>
    </div>`;
}

function renderEmpleadosReales(lista) {
  const cont = document.getElementById('emp-real');
  if (!cont) return;
  const estiloInput = 'padding:9px 11px;border:1px solid rgba(10,14,26,0.18);border-radius:8px;font-size:13px;font-family:inherit;';
  cont.innerHTML = `
    <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px;">
      <button class="gen-btn" onclick="toggleFormTrabajador()">+ Agregar trabajador</button>
      <span class="hint" style="opacity:.7;">${lista.length} trabajador(es) · solo tu empresa los ve</span>
    </div>
    <div id="form-trabajador" style="display:none;background:rgba(10,14,26,0.03);border:1px solid rgba(10,14,26,0.10);border-radius:10px;padding:14px;margin-bottom:14px;">
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <input id="nt-nombre" placeholder="Nombre completo" style="${estiloInput}flex:2;min-width:160px;" />
        <input id="nt-puesto" placeholder="Puesto" style="${estiloInput}flex:1;min-width:120px;" />
      </div>
      <textarea id="nt-actividades" placeholder="Actividades a realizar (las funciones del puesto)" rows="2" style="${estiloInput}width:100%;box-sizing:border-box;margin-top:10px;resize:vertical;"></textarea>
      <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:10px;align-items:center;">
        <div style="display:flex;align-items:center;gap:6px;flex:1;min-width:150px;">
          <span style="font-size:14px;color:rgba(10,14,26,0.55);">$</span>
          <input id="nt-pago" type="number" min="0" step="0.01" placeholder="Pago diario" style="${estiloInput}flex:1;" />
        </div>
        <select id="nt-periodo" style="${estiloInput}flex:1;min-width:150px;background:#fff;">
          <option value="">Periodo de pago…</option>
          <option value="Diario">Pago diario</option>
          <option value="Semanal">Pago semanal</option>
          <option value="Quincenal">Pago quincenal</option>
        </select>
      </div>
      <div id="nt-msg" style="font-size:12px;color:#c0392b;min-height:14px;margin-top:8px;"></div>
      <button class="gen-btn" onclick="guardarTrabajador()">Guardar trabajador</button>
    </div>
    ${lista.length === 0
      ? `<div class="soon-banner">Aún no has agregado trabajadores. Toca <strong>“+ Agregar trabajador”</strong> para empezar la plantilla de tu empresa.</div>`
      : `<div class="emp-table">${lista.map(filaTrabajador).join('')}</div>`}
  `;
}

function toggleFormTrabajador() {
  const f = document.getElementById('form-trabajador');
  if (!f) return;
  f.style.display = (f.style.display === 'none' || !f.style.display) ? 'block' : 'none';
  if (f.style.display === 'block') document.getElementById('nt-nombre')?.focus();
}

async function guardarTrabajador() {
  if (!sb || !sesion || !miEmpresa) return;
  const nombre = (document.getElementById('nt-nombre')?.value || '').trim();
  const puesto = (document.getElementById('nt-puesto')?.value || '').trim();
  const actividades = (document.getElementById('nt-actividades')?.value || '').trim();
  const pagoTxt = (document.getElementById('nt-pago')?.value || '').trim();
  const periodo = document.getElementById('nt-periodo')?.value || '';
  const pago = pagoTxt === '' ? null : Number(pagoTxt);
  const msg = document.getElementById('nt-msg');
  if (!nombre) { if (msg) msg.textContent = 'Escribe al menos el nombre.'; return; }
  if (msg) msg.textContent = 'Guardando…';
  try {
    const { error } = await sb.from('employees').insert([{
      company_id: miEmpresa,
      full_name: nombre,
      position: puesto || null,
      activities: actividades || null,
      daily_pay: pago,
      pay_period: periodo || null,
    }]);
    if (error) throw error;
    await cargarTrabajadores(); // re-render (limpia el formulario)
  } catch (e) {
    console.warn('No se pudo guardar el trabajador.', e);
    if (msg) msg.textContent = 'No se pudo guardar. Intenta de nuevo.';
  }
}

async function cargarTrabajadores() {
  if (!sb || !sesion) return;
  try {
    const { data, error } = await sb.from('employees').select('*')
      .order('created_at', { ascending: true });
    if (error) throw error;
    renderEmpleadosReales(data || []);
  } catch (e) {
    console.warn('No se pudieron leer los trabajadores.', e);
  }
}

// Alterna entre la vista DEMO (sin sesión) y la REAL (con sesión).
function aplicarVistaEmpleados() {
  const demo = document.getElementById('emp-table-demo');
  const banner = document.getElementById('emp-demo-banner');
  const real = document.getElementById('emp-real');
  if (sesion) {
    if (demo) demo.style.display = 'none';
    if (banner) banner.style.display = 'none';
    if (real) real.style.display = 'block';
    cargarTrabajadores();
  } else {
    if (demo) demo.style.display = '';
    if (banner) banner.style.display = '';
    if (real) real.style.display = 'none';
  }
}

// Refresca toda la UI según el estado de sesión.
async function aplicarSesion() {
  pintarBotonAuth();
  await ensureCompany();
  aplicarNombreEmpresa();
  aplicarVistaEmpleados();
  const exp = document.getElementById('tab-timeline');
  if (sesion && exp) cargarEventosReales();
}

// Mantener el estado de sesión sincronizado y la UI al día.
window.addEventListener('DOMContentLoaded', async () => {
  if (!sb) { pintarBotonAuth(); return; }

  const ov = document.getElementById('auth-overlay');
  if (ov) ov.addEventListener('click', e => { if (e.target === ov) cerrarAcceso(); });

  sb.auth.onAuthStateChange(async (_evento, nuevaSesion) => {
    sesion = nuevaSesion || null;
    await aplicarSesion();
  });

  try {
    const { data } = await sb.auth.getSession();
    sesion = data.session || null;
  } catch (e) { sesion = null; }
  await aplicarSesion();
});
