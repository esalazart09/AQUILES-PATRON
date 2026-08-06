/* ============================================================
   AQUILES Patrón — Calculadora de finiquito y liquidación
   Cálculos con FÓRMULAS de la Ley Federal del Trabajo (sin IA).
   Gratis, exacto e instantáneo.

   Depende de: sb, sesion, miEmpresa (backend.js).

   AVISO: herramienta de apoyo. Los montos deben ser revisados por el
   patrón / su abogado antes de pagar. Prescripción general: 1 año
   (Art. 516 LFT) — en general solo se reclama lo del último año.
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

function _fqEsc(s) {
  return (s == null ? '' : String(s)).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

/* ---------- Cálculo principal ---------- */
/*
  d = {
    ingreso, baja, motivo,
    salarioDiario, sdi, salarioMinimo, jornadaHoras,
    diasAguinaldoAnio,           // días de aguinaldo que da la empresa (mín 15)
    // Lo devengado / pendiente:
    diasSalarioPendiente,        // días trabajados no pagados
    aguinaldoAnteriorPendiente,  // true/false: no se pagó el aguinaldo del año pasado
    diasVacacionesPendientes,    // días de vacaciones no disfrutadas
    diasFestivosTrabajados,      // festivos/descanso trabajados no pagados
    horasExtraDobles,
    horasExtraTriples,
    otrasCantidades,             // monto libre (comisiones, bonos, etc.)
  }
*/
function calcularFiniquito(d) {
  const conceptos = [];
  const push = (nombre, formula, monto) => {
    if (!monto) return; // no listar conceptos en cero
    conceptos.push({ nombre, formula, monto: Math.round(monto * 100) / 100 });
  };

  const diasTrabajados = _fqDiasEntre(d.ingreso, d.baja);
  const anios = diasTrabajados / 365;
  const salDiario = Number(d.salarioDiario) || 0;
  const sdi = Number(d.sdi) || salDiario;
  const salMin = Number(d.salarioMinimo) || 0;
  const diasAguinaldo = Number(d.diasAguinaldoAnio) || 15;
  const jornada = Number(d.jornadaHoras) || 8;
  const salHora = jornada > 0 ? salDiario / jornada : 0;

  const inicioAnio = d.baja.slice(0, 4) + '-01-01';
  const diasEnAnioCurso = _fqDiasEntre(inicioAnio, d.baja);

  // ===== 1. SALARIOS Y PRESTACIONES DEVENGADAS (lo que se le debe) =====

  // Salarios devengados (días trabajados no pagados)
  const diasSalPend = Number(d.diasSalarioPendiente) || 0;
  push('Salarios devengados (días trabajados no pagados)',
    `${diasSalPend} días × ${_fqMoney(salDiario)}`,
    diasSalPend * salDiario);

  // Aguinaldo proporcional del año en curso
  const aguinaldoProp = (diasAguinaldo / 365) * diasEnAnioCurso * salDiario;
  push('Aguinaldo proporcional (año en curso)',
    `(${diasAguinaldo} ÷ 365) × ${diasEnAnioCurso} días × ${_fqMoney(salDiario)}`,
    aguinaldoProp);

  // Aguinaldo del año anterior, si no se pagó (completo)
  if (d.aguinaldoAnteriorPendiente) {
    push('Aguinaldo del año anterior (no pagado)',
      `${diasAguinaldo} días × ${_fqMoney(salDiario)}`,
      diasAguinaldo * salDiario);
  }

  // Vacaciones pendientes (no disfrutadas)
  const diasVacPend = Number(d.diasVacacionesPendientes) || 0;
  const vacaciones = diasVacPend * salDiario;
  push('Vacaciones pendientes',
    `${diasVacPend} días × ${_fqMoney(salDiario)}`,
    vacaciones);

  // Prima vacacional 25% sobre esas vacaciones
  push('Prima vacacional (25%)',
    `25% × ${_fqMoney(vacaciones)}`,
    vacaciones * 0.25);

  // Días festivos / descanso trabajados y no pagados (pago doble, Art. 75)
  const diasFest = Number(d.diasFestivosTrabajados) || 0;
  push('Días festivos / descanso trabajados (pago doble)',
    `${diasFest} días × ${_fqMoney(salDiario)} × 2`,
    diasFest * salDiario * 2);

  // Horas extra dobles (primeras 9 a la semana)
  const heDobles = Number(d.horasExtraDobles) || 0;
  push('Horas extra dobles',
    `${heDobles} h × ${_fqMoney(salHora)} × 2`,
    heDobles * salHora * 2);

  // Horas extra triples (excedentes)
  const heTriples = Number(d.horasExtraTriples) || 0;
  push('Horas extra triples',
    `${heTriples} h × ${_fqMoney(salHora)} × 3`,
    heTriples * salHora * 3);

  // Otras cantidades (comisiones, bonos, etc.)
  const otras = Number(d.otrasCantidades) || 0;
  push('Otras cantidades pendientes (comisiones, bonos…)',
    `monto capturado`,
    otras);

  // ===== 2. LIQUIDACIÓN (solo despido injustificado) =====
  const esDespidoInjustificado = d.motivo === 'despido_injustificado';
  if (esDespidoInjustificado) {
    push('Indemnización 3 meses (90 días × SDI)',
      `90 días × ${_fqMoney(sdi)}`,
      90 * sdi);
    push('20 días por año (× SDI)',
      `20 × ${anios.toFixed(2)} años × ${_fqMoney(sdi)}`,
      20 * anios * sdi);
  }

  // ===== 3. PRIMA DE ANTIGÜEDAD =====
  // 12 días/año, salario topado a 2× salario mínimo (Art. 162 LFT).
  const topeSalario = salMin > 0 ? Math.min(salDiario, 2 * salMin) : salDiario;
  const aplicaPrimaAntiguedad =
    esDespidoInjustificado ||
    d.motivo === 'despido_justificado' ||
    d.motivo === 'termino' ||
    (d.motivo === 'renuncia' && anios >= 15);
  if (aplicaPrimaAntiguedad) {
    push('Prima de antigüedad (12 días/año, tope 2× salario mín.)',
      `12 × ${anios.toFixed(2)} años × ${_fqMoney(topeSalario)}`,
      12 * anios * topeSalario);
  }

  const total = conceptos.reduce((s, c) => s + c.monto, 0);

  return {
    diasTrabajados,
    anios: Math.round(anios * 100) / 100,
    conceptos,
    total: Math.round(total * 100) / 100,
    esDespidoInjustificado,
  };
}

/* ---------- UI: abrir la calculadora ---------- */

let _fqEmps = [];
let _fqUltimo = null;

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

function renderFormFiniquito() {
  const card = document.getElementById('finiquito-card');
  if (!card) return;
  const inp = 'width:100%;box-sizing:border-box;padding:9px 11px;border:1px solid rgba(10,14,26,0.18);border-radius:8px;font-size:13.5px;font-family:inherit;';
  const lbl = 'display:block;font-size:12px;font-weight:600;color:var(--ink,#14192a);margin:12px 0 2px;';
  const help = 'display:block;font-size:11px;color:rgba(10,14,26,0.5);margin:0 0 5px;';
  const tit = 'font-family:Fraunces,serif;font-size:15px;font-weight:600;color:var(--accent-deep,#0a0e1a);margin:20px 0 2px;padding-top:14px;border-top:1px solid rgba(10,14,26,0.1);';
  const ops = _fqEmps.map(e => `<option value="${e.id}">${_fqEsc(e.full_name)}${e.position ? ' · ' + _fqEsc(e.position) : ''}</option>`).join('');

  // Campo numérico con pregunta + ayuda
  const campo = (id, pregunta, ayuda, valor, extra) =>
    `<label style="${lbl}">${pregunta}</label><span style="${help}">${ayuda}</span>
     <input id="${id}" type="number" min="0" step="${extra || '1'}" style="${inp}" value="${valor != null ? valor : ''}" placeholder="0" />`;

  card.innerHTML = `
    <h3 style="font-family:'Fraunces',serif;font-weight:500;font-size:20px;margin:0 0 2px;">Finiquito / Liquidación</h3>
    <p style="font-size:12.5px;color:rgba(10,14,26,0.6);margin:0 0 6px;line-height:1.5;">Te voy a hacer unas preguntas sencillas. <b>Deja en cero (0) lo que no aplique.</b> Al final te muestro el desglose completo.</p>

    <label style="${lbl}">¿A qué trabajador?</label>
    <select id="fq-emp" style="${inp}background:#fff;" onchange="prellenarFiniquito()">${ops}</select>

    <label style="${lbl}">¿Por qué termina la relación?</label>
    <select id="fq-motivo" style="${inp}background:#fff;" onchange="fqAvisoMotivo()">
      <option value="renuncia">El trabajador renunció</option>
      <option value="termino">Terminó el contrato / acuerdo mutuo</option>
      <option value="despido_injustificado">Lo despedí sin causa (con liquidación)</option>
      <option value="despido_justificado">Lo despedí con causa justificada</option>
    </select>
    <div id="fq-motivo-aviso" style="font-size:12px;color:#7a6f5c;margin-top:6px;background:rgba(200,138,62,.08);padding:8px 10px;border-radius:8px;"></div>

    <div style="${tit}">Fechas y sueldo</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
      <div><label style="${lbl}">Fecha de ingreso</label>${''}<input id="fq-ingreso" type="date" style="${inp}" /></div>
      <div><label style="${lbl}">Último día de trabajo</label><input id="fq-baja" type="date" style="${inp}" /></div>
    </div>
    <label style="${lbl}">Salario diario ($)</label>
    <span style="${help}">Lo que gana al día (sueldo mensual ÷ 30, o el que tengas registrado).</span>
    <input id="fq-saldiario" type="number" min="0" step="0.01" style="${inp}" />
    <label style="${lbl}">SDI — Salario Diario Integrado ($)</label>
    <span style="${help}">El que tienes registrado ante el IMSS (es un poco más alto). Si no lo tienes a la mano, deja el mismo salario diario.</span>
    <input id="fq-sdi" type="number" min="0" step="0.01" style="${inp}" />

    <div style="${tit}">¿Qué se le quedó debiendo?</div>
    ${campo('fq-salpend', 'Días de sueldo ya trabajados que NO le has pagado', 'Ej. trabajó la última semana y aún no cobra: pon esos días.', 0)}
    <label style="${lbl}">¿Le pagaste el aguinaldo del año pasado?</label>
    <span style="${help}">Si NO se lo pagaste, se le debe completo.</span>
    <select id="fq-aguiant" style="${inp}background:#fff;">
      <option value="no">Sí se lo pagué</option>
      <option value="si">No se lo pagué — se le debe</option>
    </select>
    ${campo('fq-vacpend', 'Días de vacaciones que no ha disfrutado', 'Días de vacaciones a los que tiene derecho y no ha tomado. (Por lo general solo se reclama el último año.)', 0)}
    ${campo('fq-festivos', 'Días festivos o de descanso que trabajó y no le pagaste', 'Se pagan al doble. Pon cuántos días.', 0)}
    ${campo('fq-hextra2', 'Horas extra que le debes (dobles)', 'Las primeras 9 horas extra por semana se pagan al doble.', 0)}
    ${campo('fq-hextra3', 'Horas extra que le debes (triples)', 'Las que pasan de 9 por semana se pagan al triple. Si no aplica, deja 0.', 0)}
    ${campo('fq-otras', 'Otras cantidades pendientes ($)', 'Comisiones, bonos, o cualquier otro pago que le debas. Pon el monto en pesos.', 0, '0.01')}

    <div style="${tit}">Datos para el cálculo legal</div>
    ${campo('fq-aguinaldo', 'Días de aguinaldo que da tu empresa', 'La ley marca mínimo 15. Si das más, ponlo.', 15)}
    ${campo('fq-jornada', 'Horas de la jornada diaria', 'Normalmente 8. Se usa para calcular las horas extra.', 8)}
    <label style="${lbl}">Salario mínimo diario vigente ($)</label>
    <span style="${help}">Se usa para topar la prima de antigüedad. 2026: $278.80 (o $419.88 en la frontera norte).</span>
    <input id="fq-salmin" type="number" min="0" step="0.01" style="${inp}" value="278.80" />

    <div id="fq-msg" style="font-size:12px;min-height:14px;margin-top:12px;color:rgba(10,14,26,0.6);"></div>
    <div style="display:flex;gap:10px;margin-top:4px;">
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
  const set = (elId, val) => { const el = document.getElementById(elId); if (el && val != null && el.value === '') el.value = val; };
  if (emp.hire_date) { const el = document.getElementById('fq-ingreso'); if (el) el.value = emp.hire_date; }
  if (emp.daily_pay != null) { const el = document.getElementById('fq-saldiario'); if (el) el.value = emp.daily_pay; }
}

function fqAvisoMotivo() {
  const m = document.getElementById('fq-motivo')?.value;
  const el = document.getElementById('fq-motivo-aviso');
  if (!el) return;
  const avisos = {
    renuncia: 'Renuncia: se paga lo devengado (sueldos, aguinaldo y vacaciones pendientes). La prima de antigüedad solo si tiene 15 años o más.',
    termino: 'Término / acuerdo mutuo: lo devengado + prima de antigüedad.',
    despido_injustificado: 'Despido sin causa: lo devengado + LIQUIDACIÓN (3 meses + 20 días por año) + prima de antigüedad.',
    despido_justificado: 'Despido con causa: lo devengado + prima de antigüedad (sin los 3 meses de indemnización).',
  };
  el.textContent = avisos[m] || '';
}

function ejecutarFiniquito() {
  const val = id => document.getElementById(id)?.value;
  const num = id => { const v = val(id); return v === '' || v == null ? 0 : Number(v); };
  const msg = document.getElementById('fq-msg');
  const ingreso = val('fq-ingreso'), baja = val('fq-baja');
  if (!ingreso || !baja) { if (msg) { msg.textContent = 'Pon la fecha de ingreso y el último día de trabajo.'; msg.style.color = '#c0392b'; } return; }
  if (baja < ingreso) { if (msg) { msg.textContent = 'El último día no puede ser antes del ingreso.'; msg.style.color = '#c0392b'; } return; }
  const salDiario = num('fq-saldiario');
  if (!salDiario || salDiario <= 0) { if (msg) { msg.textContent = 'Pon el salario diario.'; msg.style.color = '#c0392b'; } return; }

  const datos = {
    ingreso, baja,
    motivo: val('fq-motivo'),
    salarioDiario: salDiario,
    sdi: num('fq-sdi') || salDiario,
    salarioMinimo: num('fq-salmin'),
    jornadaHoras: num('fq-jornada') || 8,
    diasAguinaldoAnio: num('fq-aguinaldo') || 15,
    diasSalarioPendiente: num('fq-salpend'),
    aguinaldoAnteriorPendiente: val('fq-aguiant') === 'si',
    diasVacacionesPendientes: num('fq-vacpend'),
    diasFestivosTrabajados: num('fq-festivos'),
    horasExtraDobles: num('fq-hextra2'),
    horasExtraTriples: num('fq-hextra3'),
    otrasCantidades: num('fq-otras'),
  };

  const r = calcularFiniquito(datos);
  if (msg) msg.textContent = '';
  renderResultadoFiniquito(datos, r);
  // desplazar al resultado
  document.getElementById('fq-resultado')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function renderResultadoFiniquito(datos, r) {
  const cont = document.getElementById('fq-resultado');
  if (!cont) return;
  const filas = r.conceptos.map(c => `
    <tr>
      <td style="padding:8px 8px;border-bottom:1px solid rgba(10,14,26,0.08);">
        <div style="font-size:13px;font-weight:600;">${_fqEsc(c.nombre)}</div>
        <div style="font-size:11px;color:rgba(10,14,26,0.5);">${_fqEsc(c.formula)}</div>
      </td>
      <td style="padding:8px 8px;border-bottom:1px solid rgba(10,14,26,0.08);text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap;">${_fqMoney(c.monto)}</td>
    </tr>`).join('');

  cont.innerHTML = `
    <div style="background:rgba(10,14,26,0.03);border:1px solid rgba(10,14,26,0.1);border-radius:10px;padding:14px;">
      <div style="font-size:12px;color:rgba(10,14,26,0.6);margin-bottom:8px;">
        Antigüedad: <b>${r.anios} años</b> (${r.diasTrabajados} días) ·
        ${r.esDespidoInjustificado ? 'Incluye liquidación' : 'Finiquito'}
      </div>
      <table style="width:100%;border-collapse:collapse;">
        ${filas || '<tr><td style="padding:8px;font-size:13px;color:#999;">No hay conceptos con monto. Revisa los datos.</td></tr>'}
        <tr>
          <td style="padding:10px 8px;font-weight:700;font-size:14px;">TOTAL A PAGAR</td>
          <td style="padding:10px 8px;text-align:right;font-weight:700;font-size:18px;color:var(--accent-deep,#0a0e1a);font-variant-numeric:tabular-nums;">${_fqMoney(r.total)}</td>
        </tr>
      </table>
    </div>
    <p style="font-size:11px;color:rgba(10,14,26,0.5);margin:8px 0 0;line-height:1.5;">Cálculo de apoyo con fórmulas de la Ley Federal del Trabajo. Verifica los datos y consulta a tu abogado antes de pagar. Recuerda la prescripción de 1 año (Art. 516). No incluye retenciones de ISR.</p>
    <div style="display:flex;gap:10px;margin-top:12px;">
      <button class="gen-btn" onclick='guardarFiniquito()'>Guardar en el expediente</button>
      <button class="gen-btn ghost" onclick="imprimirFiniquito()">Imprimir / PDF</button>
    </div>
    <div id="fq-save-msg" style="font-size:12px;min-height:14px;margin-top:8px;"></div>
  `;
  _fqUltimo = { datos, resultado: r, empId: document.getElementById('fq-emp')?.value };
}

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
    <p style="font-size:11px;color:#666;margin-top:16px">Cálculo de apoyo con fórmulas de la Ley Federal del Trabajo. Verifique los datos y consulte a su abogado antes de pagar. Prescripción de 1 año (Art. 516 LFT). No incluye retenciones de ISR.</p>
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
