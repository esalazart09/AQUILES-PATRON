/* ============================================================
   AQUILES Patrón — Calculadora de finiquito y liquidación
   Cálculos con FÓRMULAS de la Ley Federal del Trabajo (sin IA).
   Gratis, exacto e instantáneo.

   Depende de: sb, sesion, miEmpresa (backend.js).

   AVISO: es una herramienta de apoyo. Los montos deben ser revisados
   por el patrón / su abogado antes de pagar. La antigüedad, el SDI y el
   salario mínimo los confirma el usuario.
   ============================================================ */

/* ---------- Utilidades ---------- */

function _fqMoney(n) {
  if (n == null || isNaN(n)) return '$0.00';
  return '$' + Number(n).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function _fqDiasEntre(desde, hasta) {
  const a = new Date(desde + 'T00:00:00');
  const b = new Date(hasta + 'T00:00:00');
  if (isNaN(a) || isNaN(b)) return 0;
  return Math.max(0, Math.round((b - a) / 86400000));
}

function _fqAniosEntre(desde, hasta) {
  const dias = _fqDiasEntre(desde, hasta);
  return dias / 365;
}

// Días de vacaciones que CORRESPONDEN por año de antigüedad (reforma 2023).
// 1er año: 12; +2 cada año hasta el 5º (20); luego +2 cada 5 años.
function _fqDiasVacacionesPorAnio(aniosCompletos) {
  const a = Math.floor(aniosCompletos);
  if (a <= 0) return 12; // en el primer año se usa la tabla del 1er año proporcional
  if (a === 1) return 12;
  if (a === 2) return 14;
  if (a === 3) return 16;
  if (a === 4) return 18;
  if (a === 5) return 20;
  // 6-10: 22; 11-15: 24; 16-20: 26...
  return 20 + 2 * Math.floor((a - 1) / 5);
}

/* ---------- Cálculo principal ---------- */
/*
  datos = {
    ingreso: 'AAAA-MM-DD',
    baja: 'AAAA-MM-DD',
    salarioDiario: number,   // cuota diaria normal
    sdi: number,             // salario diario integrado
    salarioMinimo: number,   // salario mínimo diario vigente (para tope prima antigüedad)
    motivo: 'renuncia' | 'termino' | 'despido_injustificado' | 'despido_justificado',
    diasVacacionesPendientes: number,   // días de vac. no disfrutadas ya devengadas
    diasAguinaldoAnio: number,          // días de aguinaldo que da la empresa (mín 15)
  }
*/
function calcularFiniquito(d) {
  const conceptos = [];
  const push = (nombre, formula, monto) => conceptos.push({ nombre, formula, monto: Math.round(monto * 100) / 100 });

  const diasTrabajados = _fqDiasEntre(d.ingreso, d.baja);
  const anios = diasTrabajados / 365;
  const salDiario = Number(d.salarioDiario) || 0;
  const sdi = Number(d.sdi) || salDiario;
  const salMin = Number(d.salarioMinimo) || 0;
  const diasAguinaldo = Number(d.diasAguinaldoAnio) || 15;

  // --- Días del año en curso (para proporcionales) ---
  const inicioAnio = d.baja.slice(0, 4) + '-01-01';
  const diasEnAnioCurso = _fqDiasEntre(inicioAnio, d.baja); // días del 1-ene a la baja

  // ===== FINIQUITO (siempre se paga, sea cual sea el motivo) =====

  // 1) Aguinaldo proporcional: (diasAguinaldo / 365) * díasTrabajadosEnElAño * salarioDiario
  const aguinaldoProp = (diasAguinaldo / 365) * diasEnAnioCurso * salDiario;
  push('Aguinaldo proporcional',
    `(${diasAguinaldo} días ÷ 365) × ${diasEnAnioCurso} días del año × ${_fqMoney(salDiario)}`,
    aguinaldoProp);

  // 2) Vacaciones pendientes (días ya devengados no disfrutados) × salario diario
  const diasVacPend = Number(d.diasVacacionesPendientes) || 0;
  const vacaciones = diasVacPend * salDiario;
  push('Vacaciones pendientes',
    `${diasVacPend} días × ${_fqMoney(salDiario)}`,
    vacaciones);

  // 3) Prima vacacional 25% sobre esas vacaciones
  const primaVac = vacaciones * 0.25;
  push('Prima vacacional (25%)',
    `25% × ${_fqMoney(vacaciones)}`,
    primaVac);

  const subtotalFiniquito = aguinaldoProp + vacaciones + primaVac;

  // ===== LIQUIDACIÓN (solo si despido injustificado) =====
  let subtotalLiquidacion = 0;
  const esDespidoInjustificado = d.motivo === 'despido_injustificado';

  if (esDespidoInjustificado) {
    // 4) Indemnización constitucional: 90 días × SDI (Art. 48 LFT)
    const indemn90 = 90 * sdi;
    push('Indemnización 3 meses (90 días × SDI)',
      `90 días × ${_fqMoney(sdi)}`,
      indemn90);

    // 5) 20 días por año de servicio × SDI (Art. 50 LFT)
    const veinteDias = 20 * anios * sdi;
    push('20 días por año (× SDI)',
      `20 × ${anios.toFixed(2)} años × ${_fqMoney(sdi)}`,
      veinteDias);

    subtotalLiquidacion += indemn90 + veinteDias;
  }

  // ===== PRIMA DE ANTIGÜEDAD =====
  // 12 días por año, con salario TOPADO a 2× salario mínimo (Art. 162 LFT).
  // Se paga en: despido (justificado o no), renuncia con 15+ años, o término.
  const topeSalario = salMin > 0 ? Math.min(salDiario, 2 * salMin) : salDiario;
  let primaAntiguedad = 0;
  const aplicaPrimaAntiguedad =
    esDespidoInjustificado ||
    d.motivo === 'despido_justificado' ||
    d.motivo === 'termino' ||
    (d.motivo === 'renuncia' && anios >= 15);

  if (aplicaPrimaAntiguedad) {
    primaAntiguedad = 12 * anios * topeSalario;
    push('Prima de antigüedad (12 días/año, tope 2× salario mín.)',
      `12 × ${anios.toFixed(2)} años × ${_fqMoney(topeSalario)}`,
      primaAntiguedad);
    subtotalLiquidacion += primaAntiguedad;
  }

  const total = subtotalFiniquito + subtotalLiquidacion;

  return {
    diasTrabajados,
    anios: Math.round(anios * 100) / 100,
    conceptos,
    subtotalFiniquito: Math.round(subtotalFiniquito * 100) / 100,
    subtotalLiquidacion: Math.round(subtotalLiquidacion * 100) / 100,
    total: Math.round(total * 100) / 100,
    esDespidoInjustificado,
  };
}

/* ---------- UI: abrir la calculadora ---------- */

let _fqEmps = [];

async function abrirFiniquito() {
  if (!sb || !sesion || !miEmpresa) { alert('Inicia sesión para calcular finiquitos.'); return; }
  const ov = document.getElementById('finiquito-overlay');
  const card = document.getElementById('finiquito-card');
  if (!ov || !card) return;
  card.innerHTML = '<p style="font-size:12px;color:rgba(10,14,26,0.55);">Cargando…</p>';
  ov.style.display = 'flex';

  try {
    const r = await sb.from('employees').select('*').order('full_name', { ascending: true });
    if (r.error) throw r.error;
    _fqEmps = r.data || [];
  } catch (e) {
    card.innerHTML = `<p style="color:#c0392b;font-size:13px;">No se pudieron cargar los trabajadores: ${_fqEsc(e.message || '')}</p>
      <div style="margin-top:14px;"><button class="gen-btn" onclick="cerrarFiniquito()">Cerrar</button></div>`;
    return;
  }
  if (_fqEmps.length === 0) {
    card.innerHTML = `<h3 style="font-family:'Fraunces',serif;font-weight:500;font-size:20px;margin:0 0 8px;">Finiquito / Liquidación</h3>
      <p style="font-size:13px;color:rgba(10,14,26,0.6);">Primero agrega trabajadores para poder calcular su finiquito.</p>
      <div style="margin-top:14px;"><button class="gen-btn" onclick="cerrarFiniquito()">Cerrar</button></div>`;
    return;
  }
  renderFormFiniquito();
}

function _fqEsc(s) {
  return (s == null ? '' : String(s)).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function renderFormFiniquito() {
  const card = document.getElementById('finiquito-card');
  if (!card) return;
  const inp = 'width:100%;box-sizing:border-box;padding:9px 11px;border:1px solid rgba(10,14,26,0.18);border-radius:8px;font-size:13.5px;font-family:inherit;';
  const lbl = 'display:block;font-size:10.5px;letter-spacing:0.04em;text-transform:uppercase;color:rgba(10,14,26,0.55);margin:11px 0 4px;';
  const tit = 'font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:var(--accent-deep,#0a0e1a);font-weight:700;margin:16px 0 2px;';
  const ops = _fqEmps.map(e => `<option value="${e.id}">${_fqEsc(e.full_name)}${e.position ? ' · ' + _fqEsc(e.position) : ''}</option>`).join('');

  card.innerHTML = `
    <h3 style="font-family:'Fraunces',serif;font-weight:500;font-size:20px;margin:0 0 2px;">Finiquito / Liquidación</h3>
    <p style="font-size:12px;color:rgba(10,14,26,0.55);margin:0 0 4px;">Cálculo con fórmulas de la Ley Federal del Trabajo. Revisa los datos y el resultado antes de pagar.</p>

    <label style="${lbl}">Trabajador</label>
    <select id="fq-emp" style="${inp}background:#fff;" onchange="prellenarFiniquito()">${ops}</select>

    <div style="${tit}">Motivo de la baja</div>
    <select id="fq-motivo" style="${inp}background:#fff;" onchange="fqAvisoMotivo()">
      <option value="renuncia">Renuncia voluntaria</option>
      <option value="termino">Término de contrato / mutuo acuerdo</option>
      <option value="despido_injustificado">Despido injustificado (con liquidación)</option>
      <option value="despido_justificado">Despido justificado (con causa)</option>
    </select>
    <div id="fq-motivo-aviso" style="font-size:12px;color:var(--muted,#6f675a);margin-top:6px;"></div>

    <div style="${tit}">Fechas y salarios</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
      <div><label style="${lbl}">Fecha de ingreso</label><input id="fq-ingreso" type="date" style="${inp}" /></div>
      <div><label style="${lbl}">Fecha de baja</label><input id="fq-baja" type="date" style="${inp}" /></div>
      <div><label style="${lbl}">Salario diario ($)</label><input id="fq-saldiario" type="number" min="0" step="0.01" style="${inp}" /></div>
      <div><label style="${lbl}">SDI — salario diario integrado ($)</label><input id="fq-sdi" type="number" min="0" step="0.01" style="${inp}" placeholder="Si no lo tienes, usa el diario" /></div>
      <div><label style="${lbl}">Salario mínimo diario vigente ($)</label><input id="fq-salmin" type="number" min="0" step="0.01" style="${inp}" value="278.80" /></div>
      <div><label style="${lbl}">Días de aguinaldo (mín. 15)</label><input id="fq-aguinaldo" type="number" min="15" step="1" style="${inp}" value="15" /></div>
    </div>
    <label style="${lbl}">Días de vacaciones pendientes (no disfrutadas)</label>
    <input id="fq-vacpend" type="number" min="0" step="0.5" style="${inp}" value="0" />

    <div id="fq-msg" style="font-size:12px;min-height:14px;margin-top:10px;color:rgba(10,14,26,0.6);"></div>
    <div style="display:flex;gap:10px;margin-top:6px;">
      <button class="gen-btn" onclick="ejecutarFiniquito()">Calcular</button>
      <button class="gen-btn ghost" onclick="cerrarFiniquito()">Cerrar</button>
    </div>
    <div id="fq-resultado" style="margin-top:16px;"></div>
  `;
  prellenarFiniquito();
  fqAvisoMotivo();
}

function prellenarFiniquito() {
  const id = document.getElementById('fq-emp')?.value;
  const emp = _fqEmps.find(e => e.id === id);
  if (!emp) return;
  const set = (elId, val) => { const el = document.getElementById(elId); if (el && val != null) el.value = val; };
  if (emp.hire_date) set('fq-ingreso', emp.hire_date);
  if (emp.daily_pay != null) { set('fq-saldiario', emp.daily_pay); }
}

function fqAvisoMotivo() {
  const m = document.getElementById('fq-motivo')?.value;
  const el = document.getElementById('fq-motivo-aviso');
  if (!el) return;
  const avisos = {
    renuncia: 'Renuncia: se paga finiquito (proporcionales). La prima de antigüedad solo si tiene 15+ años.',
    termino: 'Término / mutuo acuerdo: finiquito proporcional + prima de antigüedad.',
    despido_injustificado: 'Despido injustificado: finiquito + LIQUIDACIÓN (90 días + 20 días/año) + prima de antigüedad.',
    despido_justificado: 'Despido justificado: finiquito proporcional + prima de antigüedad (sin indemnización de 90 días).',
  };
  el.textContent = avisos[m] || '';
}

function ejecutarFiniquito() {
  const val = id => document.getElementById(id)?.value;
  const num = id => { const v = val(id); return v === '' || v == null ? null : Number(v); };
  const msg = document.getElementById('fq-msg');
  const ingreso = val('fq-ingreso'), baja = val('fq-baja');
  if (!ingreso || !baja) { if (msg) { msg.textContent = 'Pon la fecha de ingreso y de baja.'; msg.style.color = '#c0392b'; } return; }
  if (baja < ingreso) { if (msg) { msg.textContent = 'La fecha de baja no puede ser anterior al ingreso.'; msg.style.color = '#c0392b'; } return; }
  const salDiario = num('fq-saldiario');
  if (!salDiario || salDiario <= 0) { if (msg) { msg.textContent = 'Pon el salario diario.'; msg.style.color = '#c0392b'; } return; }

  const datos = {
    ingreso, baja,
    salarioDiario: salDiario,
    sdi: num('fq-sdi') || salDiario,
    salarioMinimo: num('fq-salmin') || 0,
    motivo: val('fq-motivo'),
    diasVacacionesPendientes: num('fq-vacpend') || 0,
    diasAguinaldoAnio: num('fq-aguinaldo') || 15,
  };

  const r = calcularFiniquito(datos);
  if (msg) msg.textContent = '';
  renderResultadoFiniquito(datos, r);
}

function renderResultadoFiniquito(datos, r) {
  const cont = document.getElementById('fq-resultado');
  if (!cont) return;
  const filas = r.conceptos.map(c => `
    <tr>
      <td style="padding:7px 8px;border-bottom:1px solid rgba(10,14,26,0.08);">
        <div style="font-size:13px;font-weight:600;">${_fqEsc(c.nombre)}</div>
        <div style="font-size:11px;color:rgba(10,14,26,0.5);">${_fqEsc(c.formula)}</div>
      </td>
      <td style="padding:7px 8px;border-bottom:1px solid rgba(10,14,26,0.08);text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap;">${_fqMoney(c.monto)}</td>
    </tr>`).join('');

  cont.innerHTML = `
    <div style="background:rgba(10,14,26,0.03);border:1px solid rgba(10,14,26,0.1);border-radius:10px;padding:14px;">
      <div style="font-size:12px;color:rgba(10,14,26,0.6);margin-bottom:8px;">
        Antigüedad: <b>${r.anios} años</b> (${r.diasTrabajados} días) ·
        ${r.esDespidoInjustificado ? 'Incluye liquidación' : 'Finiquito'}
      </div>
      <table style="width:100%;border-collapse:collapse;">
        ${filas}
        <tr>
          <td style="padding:10px 8px;font-weight:700;font-size:14px;">TOTAL A PAGAR</td>
          <td style="padding:10px 8px;text-align:right;font-weight:700;font-size:17px;color:var(--accent-deep,#0a0e1a);font-variant-numeric:tabular-nums;">${_fqMoney(r.total)}</td>
        </tr>
      </table>
    </div>
    <p style="font-size:11px;color:rgba(10,14,26,0.5);margin:8px 0 0;">Cálculo de apoyo. Verifica los datos (SDI, antigüedad, vacaciones) con tu registro real y consulta a tu abogado antes de pagar. No incluye retenciones de ISR sobre indemnización.</p>
    <div style="display:flex;gap:10px;margin-top:12px;">
      <button class="gen-btn" onclick='guardarFiniquito()'>Guardar en el expediente</button>
      <button class="gen-btn ghost" onclick="imprimirFiniquito()">Imprimir / PDF</button>
    </div>
    <div id="fq-save-msg" style="font-size:12px;min-height:14px;margin-top:8px;"></div>
  `;
  // Guardar en memoria para poder persistir/imprimir.
  _fqUltimo = { datos, resultado: r, empId: document.getElementById('fq-emp')?.value };
}

let _fqUltimo = null;

async function guardarFiniquito() {
  if (!sb || !sesion || !miEmpresa || !_fqUltimo) return;
  const m = document.getElementById('fq-save-msg');
  if (m) { m.textContent = 'Guardando…'; m.style.color = 'rgba(10,14,26,0.6)'; }
  try {
    const { datos, resultado, empId } = _fqUltimo;
    const { error } = await sb.from('settlements').insert([{
      company_id: miEmpresa,
      employee_id: empId,
      tipo: resultado.esDespidoInjustificado ? 'liquidacion' : 'finiquito',
      motivo: datos.motivo,
      entrada: datos,
      desglose: resultado.conceptos,
      total: resultado.total,
    }]);
    if (error) throw error;
    if (m) { m.textContent = '✓ Guardado en el expediente del trabajador.'; m.style.color = '#1b8a5a'; }
  } catch (e) {
    console.warn('No se pudo guardar el finiquito.', e);
    if (m) { m.textContent = 'No se pudo guardar: ' + (e.message || ''); m.style.color = '#c0392b'; }
  }
}

function imprimirFiniquito() {
  if (!_fqUltimo) return;
  const { datos, resultado } = _fqUltimo;
  const emp = _fqEmps.find(e => e.id === _fqUltimo.empId) || {};
  const filas = resultado.conceptos.map(c =>
    `<tr><td>${_fqEsc(c.nombre)}<br><small style="color:#666">${_fqEsc(c.formula)}</small></td><td style="text-align:right">${_fqMoney(c.monto)}</td></tr>`).join('');
  const w = window.open('', '_blank');
  if (!w) { alert('Permite las ventanas emergentes para imprimir.'); return; }
  w.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>Finiquito — ${_fqEsc(emp.full_name || '')}</title>
    <style>body{font-family:Georgia,serif;max-width:640px;margin:24px auto;padding:0 16px;color:#111;}
    h1{font-size:18px;} table{width:100%;border-collapse:collapse;margin-top:12px;}
    td{padding:8px;border-bottom:1px solid #ddd;font-size:13px;} .tot td{font-weight:bold;font-size:16px;border-top:2px solid #111;}
    .barra{background:#0a0e1a;color:#fff;padding:8px;text-align:center;} .barra button{background:#c08a3e;color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;}
    @media print{.barra{display:none}}</style></head><body>
    <div class="barra">Documento generado por AQUILES Patrón <button onclick="window.print()">Imprimir / PDF</button></div>
    <h1>Cálculo de ${resultado.esDespidoInjustificado ? 'Liquidación' : 'Finiquito'}</h1>
    <p><b>Trabajador:</b> ${_fqEsc(emp.full_name || '')}<br>
    <b>Antigüedad:</b> ${resultado.anios} años (${resultado.diasTrabajados} días)<br>
    <b>Periodo:</b> ${_fqEsc(datos.ingreso)} a ${_fqEsc(datos.baja)}</p>
    <table>${filas}<tr class="tot"><td>TOTAL A PAGAR</td><td style="text-align:right">${_fqMoney(resultado.total)}</td></tr></table>
    <p style="font-size:11px;color:#666;margin-top:16px">Cálculo de apoyo con fórmulas de la Ley Federal del Trabajo. Verifique los datos y consulte a su abogado antes de pagar. No incluye retenciones de ISR.</p>
    </body></html>`);
  w.document.close();
}

function cerrarFiniquito() {
  const ov = document.getElementById('finiquito-overlay');
  if (ov) ov.style.display = 'none';
}

window.addEventListener('DOMContentLoaded', () => {
  const ov = document.getElementById('finiquito-overlay');
  if (ov) ov.addEventListener('click', e => { if (e.target === ov) cerrarFiniquito(); });
});
