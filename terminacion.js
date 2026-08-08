/* ============================================================
   AQUILES Patrón — Documentos de terminación laboral
   Genera: Convenio de terminación por mutuo consentimiento,
   Renuncia voluntaria, y Aviso de rescisión. Autollenado con
   datos del trabajador y la empresa (machotes del usuario).

   Depende de: sb, sesion, miEmpresa (backend.js).
   ============================================================ */

function _tEsc(s) {
  return (s == null ? '' : String(s)).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}
// Hueco: dato si existe; si no, línea roja para llenar a mano.
function _tf(v, ancho) {
  const s = (v == null ? '' : String(v)).trim();
  return s ? _tEsc(s) : `<span style="color:#b04a4a;">${'_'.repeat(ancho || 14)}</span>`;
}
const _TMESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
function _tFechaLarga(iso) {
  if (!iso) return '';
  const d = new Date(iso + (iso.length <= 10 ? 'T00:00:00' : ''));
  if (isNaN(d)) return '';
  return `${d.getDate()} de ${_TMESES[d.getMonth()]} de ${d.getFullYear()}`;
}
function _tAntiguedad(ingreso, baja) {
  if (!ingreso || !baja) return '';
  const a = new Date(ingreso + 'T00:00:00'), b = new Date(baja + 'T00:00:00');
  if (isNaN(a) || isNaN(b) || b < a) return '';
  let anios = b.getFullYear() - a.getFullYear();
  let meses = b.getMonth() - a.getMonth();
  if (b.getDate() < a.getDate()) meses--;
  if (meses < 0) { anios--; meses += 12; }
  const pa = anios === 1 ? '1 año' : `${anios} años`;
  const pm = meses === 1 ? '1 mes' : `${meses} meses`;
  return `${pa} y ${pm}`;
}

/* ---------- Plantillas ---------- */

function _plantillaConvenioMutuo(emp, co, x) {
  return `
  <h1>CONVENIO DE TERMINACIÓN DE LA RELACIÓN DE TRABAJO POR MUTUO CONSENTIMIENTO</h1>
  <p>En la Ciudad de ${_tf(x.lugar, 18)}, siendo las ${_tf(x.hora, 8)} del día ${_tf(_tFechaLarga(x.fecha_firma) || x.fecha_firma, 16)}, comparecen por una parte el(la) C. <b>${_tf(emp.full_name, 22)}</b>, quien se identifica con su credencial para votar con clave de elector número ${_tf(x.clave_elector, 18)}, expedida por el Instituto Nacional Electoral (INE), con domicilio en ${_tf(emp.address, 28)}, a quien en lo sucesivo se le denominará “EL TRABAJADOR”; y por la otra parte comparece el(la) C. <b>${_tf(co.legal_rep_name, 22)}</b>, en su carácter de ${_tf(co.legal_rep_role, 16)} de <b>${_tf(co.name, 24)}</b>, con domicilio en ${_tf(co.fiscal_address, 26)}, a quien en lo sucesivo se le denominará “EL PATRÓN”.</p>
  <p>Partes que, después de una serie de pláticas conciliatorias y actuando libres de toda coacción, violencia, amenaza, intimidación, dolo, error, mala fe o cualquier otro vicio del consentimiento, llegaron al presente CONVENIO, al tenor de las siguientes:</p>
  <h2>C L Á U S U L A S</h2>
  <p><b>PRIMERA. TERMINACIÓN DE LA RELACIÓN DE TRABAJO.</b> Ambas partes manifiestan su libre, expresa y recíproca voluntad de dar por terminada de común acuerdo, por MUTUO CONSENTIMIENTO, la relación individual de trabajo que las unía, con fundamento en el artículo 53, fracción I, de la Ley Federal del Trabajo, con efectos a partir del día ${_tf(_tFechaLarga(x.fecha_efectos) || x.fecha_efectos, 16)}, sin responsabilidad alguna para ninguna de las partes.</p>
  <p><b>SEGUNDA. DATOS DE LA RELACIÓN DE TRABAJO.</b> Las partes reconocen que EL TRABAJADOR ingresó a prestar sus servicios el día ${_tf(_tFechaLarga(emp.hire_date) || '', 14)}; se desempeñó en el puesto de ${_tf(emp.position, 14)}; desarrolló sus labores en el centro de trabajo ubicado en ${_tf(x.centro_trabajo || co.fiscal_address, 24)}; y generó una antigüedad de ${_tf(_tAntiguedad(emp.hire_date, x.fecha_efectos), 14)}. Ambas partes reconocen que los datos son correctos.</p>
  <p><b>TERCERA. INEXISTENCIA DE ADEUDOS.</b> EL TRABAJADOR manifiesta que EL PATRÓN le hizo entrega de su finiquito, calculado conforme a la totalidad de las prestaciones que legalmente le correspondían de acuerdo con su salario, su antigüedad y lo dispuesto por la Ley Federal del Trabajo, mismo que recibió a su entera y total satisfacción; y que en consecuencia EL PATRÓN NO LE ADEUDA CANTIDAD, PRESTACIÓN NI CONCEPTO ALGUNO derivado de la relación de trabajo ni de su terminación.</p>
  <p><b>CUARTA. CUMPLIMIENTO DE LA NORMATIVA LABORAL.</b> EL TRABAJADOR manifiesta que durante toda la relación de trabajo EL PATRÓN dio cabal cumplimiento a sus obligaciones legales; que le fueron respetados íntegramente sus derechos laborales y humanos; que jamás fue objeto de discriminación, violencia laboral, hostigamiento, acoso u hostigamiento sexual; y que EL PATRÓN le cubrió puntualmente todo lo que legalmente le correspondía.</p>
  <p><b>QUINTA. NO RESERVA DE ACCIONES.</b> EL TRABAJADOR declara que NO SE RESERVA ACCIÓN NI DERECHO ALGUNO que ejercitar en contra de EL PATRÓN, sus representantes, apoderados, socios, accionistas, administradores, directivos ni empleados, de carácter laboral, civil, penal, mercantil, administrativo, fiscal, de seguridad social o de cualquier otra naturaleza, ni presente ni futuro.</p>
  <p><b>SEXTA. DEVOLUCIÓN DE BIENES.</b> EL TRABAJADOR manifiesta que ${_tf(x.bienes || 'no conserva en su poder bien, valor, herramienta, documento ni información alguna propiedad de EL PATRÓN', 20)}.</p>
  <p style="margin-top:14px;">Leída que fue por ambas partes y enteradas de su contenido, alcance y consecuencias legales, la firman de conformidad en unión de dos testigos, en ${_tf(x.lugar, 16)}, a ${_tf(_tFechaLarga(x.fecha_firma) || x.fecha_firma, 14)}.</p>
  ${_firmas4('EL PATRÓN', co.legal_rep_name, 'EL TRABAJADOR', emp.full_name, x.testigo1, x.testigo2)}
  `;
}

function _plantillaRenuncia(emp, co, x) {
  return `
  <p style="text-align:right;">${_tf(x.lugar, 16)}, a ${_tf(_tFechaLarga(x.fecha_firma) || x.fecha_firma, 14)}.</p>
  <p><b>C. ${_tf(co.legal_rep_name, 20)}</b><br>${_tf(co.name, 24)}<br>P R E S E N T E:</p>
  <p style="text-align:center;"><b>ASUNTO: RENUNCIA VOLUNTARIA A LA RELACIÓN DE TRABAJO.</b></p>
  <p>El (la) suscrito(a) C. <b>${_tf(emp.full_name, 22)}</b>, por mi propio derecho, con domicilio en ${_tf(emp.address, 26)}, y quien me identifico con mi credencial para votar con clave de elector número ${_tf(x.clave_elector, 18)}, expedida por el Instituto Nacional Electoral (INE), por medio del presente escrito manifiesto lo siguiente:</p>
  <p><b>PRIMERO.</b> Que por este conducto presento mi RENUNCIA VOLUNTARIA E IRREVOCABLE al puesto de ${_tf(emp.position, 14)} que venía desempeñando, y en consecuencia doy por terminada la relación individual de trabajo que me unía con ${_tf(co.name, 20)}, con efectos a partir del día ${_tf(_tFechaLarga(x.fecha_efectos) || x.fecha_efectos, 14)}, sin responsabilidad alguna para la parte patronal.</p>
  <p><b>SEGUNDO.</b> Que ingresé a prestar mis servicios el día ${_tf(_tFechaLarga(emp.hire_date) || '', 14)}, desarrollando mis labores en el centro de trabajo ubicado en ${_tf(x.centro_trabajo || co.fiscal_address, 22)}, generando una antigüedad de ${_tf(_tAntiguedad(emp.hire_date, x.fecha_efectos), 12)}, datos que reconozco como correctos.</p>
  <p><b>TERCERO.</b> Que la presente renuncia obedece exclusivamente a mi libre, espontánea y personal voluntad, por motivos estrictamente personales, sin que haya mediado coacción, violencia, amenaza, intimidación, engaño, dolo, error, mala fe ni presión de ninguna especie; lo anterior en pleno ejercicio de la libertad de trabajo del artículo 5o. constitucional y en concordancia con el artículo 32 de la Ley Federal del Trabajo.</p>
  <p><b>CUARTO.</b> Que la parte patronal me hizo entrega de mi finiquito, calculado conforme a la totalidad de las prestaciones que legalmente me correspondían, mismo que recibí a mi entera y total satisfacción; y que en consecuencia LA PARTE PATRONAL NO ME ADEUDA CANTIDAD, PRESTACIÓN NI CONCEPTO ALGUNO derivado de la relación de trabajo ni de su terminación.</p>
  <p><b>QUINTO.</b> Que durante toda la relación de trabajo la parte patronal dio cabal cumplimiento a sus obligaciones legales; que me fueron respetados íntegramente mis derechos laborales y humanos; que jamás fui objeto de discriminación, violencia laboral, hostigamiento, acoso u hostigamiento sexual; y que me cubrió puntualmente todo lo que legalmente me correspondía.</p>
  <p><b>SEXTO.</b> Que en virtud de lo anterior, NO ME RESERVO ACCIÓN NI DERECHO ALGUNO que ejercitar en contra de la parte patronal, sus representantes, apoderados, socios, accionistas, administradores, directivos ni empleados, de cualquier naturaleza, ni presente ni futuro.</p>
  <p style="margin-top:12px;">Manifiesto que el presente escrito fue leído por el suscrito, que estoy plenamente enterado(a) de su contenido, alcance y consecuencias legales, y que lo firmo de entera conformidad en unión de dos testigos.</p>
  <p style="text-align:center;margin-top:10px;">A T E N T A M E N T E</p>
  ${_firma1(emp.full_name, 'El (la) trabajador(a), por su propio derecho')}
  <p style="text-align:center;">T E S T I G O S</p>
  ${_firmas2(x.testigo1, x.testigo2)}
  <p style="margin-top:16px;text-align:center;">A C U S E   D E   R E C I B O</p>
  ${_firma1(co.legal_rep_name, 'Parte patronal (Enterado y Recibido)')}
  <p>Fecha de recepción: ${_tf(_tFechaLarga(x.fecha_firma) || x.fecha_firma, 14)}</p>
  `;
}

function _plantillaAvisoRescision(emp, co, x) {
  return `
  <p><b>C. ${_tf(emp.full_name, 22)}</b><br>PUESTO: ${_tf(emp.position, 16)}<br>P R E S E N T E:</p>
  <p style="text-align:center;"><b>ASUNTO: AVISO DE RESCISIÓN DE LA RELACIÓN DE TRABAJO.</b></p>
  <p>Por medio de la presente, en mi carácter de representante legal de la fuente de trabajo, le comunico que con fecha ${_tf(_tFechaLarga(x.fecha_efectos) || x.fecha_efectos, 14)}, se da por RESCINDIDO su Contrato Individual de Trabajo y la relación laboral que lo unía con esta empresa, sin responsabilidad para el patrón.</p>
  <p>Esta decisión se fundamenta en que usted ha incurrido en las causales de rescisión previstas en el artículo 47 de la Ley Federal del Trabajo, específicamente en las siguientes fracciones:</p>
  <p style="white-space:pre-line;padding-left:12px;">${_tf(x.fracciones, 24)}</p>
  <p>La causa de esta rescisión se deriva de los hechos asentados en el Acta Administrativa de fecha ${_tf(_tFechaLarga(x.fecha_acta) || x.fecha_acta, 12)}, en la cual se hace constar que el pasado ${_tf(_tFechaLarga(x.fecha_hechos) || x.fecha_hechos, 12)}, usted:</p>
  <p style="padding-left:12px;">${_tf(x.hechos, 40)}</p>
  <p>Dichas conductas constituyen una falta de ${_tf(x.tipo_falta, 20)} que su puesto exige, quebrantando irremediablemente la confianza y el orden operativo de la empresa.</p>
  <p>Se procede a la entrega personal de este aviso en cumplimiento a lo dispuesto por la parte final del artículo 47 de la Ley Federal del Trabajo.</p>
  <p style="margin-top:10px;">${_tf(x.lugar, 16)}, a ${_tf(_tFechaLarga(x.fecha_firma) || x.fecha_firma, 14)}.</p>
  ${_firma1(co.legal_rep_name, 'REPRESENTANTE PATRONAL · Firma de la fuente de trabajo')}
  ${_firma1(emp.full_name, 'Trabajador (Enterado y Recibido)')}
  <p style="text-align:center;">TESTIGOS</p>
  ${_firmas2(x.testigo1, x.testigo2)}
  `;
}

/* ---------- Bloques de firma ---------- */
function _firma1(nombre, rol) {
  return `<div style="margin:34px 0 6px;text-align:center;">
    <div style="border-top:1px solid #111;width:280px;margin:36px auto 6px;"></div>
    ${_tf(nombre, 20)}<br><span style="font-size:11px;color:#444;">${_tEsc(rol)}</span></div>`;
}
function _firmas2(t1, t2) {
  return `<div style="display:flex;gap:30px;justify-content:space-around;margin:30px 0 6px;text-align:center;font-size:12px;">
    <div style="flex:1;"><div style="border-top:1px solid #111;margin:34px 10px 6px;"></div>${_tf(t1, 16)}<br><span style="font-size:11px;color:#444;">Testigo de asistencia</span></div>
    <div style="flex:1;"><div style="border-top:1px solid #111;margin:34px 10px 6px;"></div>${_tf(t2, 16)}<br><span style="font-size:11px;color:#444;">Testigo de asistencia</span></div>
  </div>`;
}
function _firmas4(rolA, nomA, rolB, nomB, t1, t2) {
  return `<div style="display:flex;gap:30px;justify-content:space-around;margin:34px 0 6px;text-align:center;font-size:12px;">
    <div style="flex:1;"><div style="border-top:1px solid #111;margin:34px 10px 6px;"></div>${_tf(nomA, 18)}<br><b>${_tEsc(rolA)}</b></div>
    <div style="flex:1;"><div style="border-top:1px solid #111;margin:34px 10px 6px;"></div>${_tf(nomB, 18)}<br><b>${_tEsc(rolB)}</b></div>
  </div>
  <p style="text-align:center;">T E S T I G O S</p>
  ${_firmas2(t1, t2)}`;
}

/* ---------- Documento imprimible ---------- */
function _abrirDocTerminacion(html, titulo) {
  const w = window.open('', '_blank');
  if (!w) { alert('Permite las ventanas emergentes para ver el documento.'); return; }
  w.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"><title>${_tEsc(titulo)}</title>
  <style>@page{size:Letter;margin:2.2cm 2cm;}
  body{font-family:'Times New Roman',Georgia,serif;font-size:11.5pt;line-height:1.55;color:#111;max-width:720px;margin:24px auto;padding:0 16px;text-align:justify;}
  h1{font-size:14pt;text-align:center;margin:0 0 16px;} h2{font-size:12pt;text-align:center;letter-spacing:2px;margin:20px 0 10px;}
  p{margin:0 0 9px;}
  .barra{position:fixed;top:0;left:0;right:0;background:#0a0e1a;color:#fff;padding:10px;text-align:center;font-family:system-ui,sans-serif;font-size:13px;}
  .barra button{background:#c08a3e;color:#fff;border:none;padding:8px 18px;border-radius:6px;font-size:13px;cursor:pointer;margin-left:8px;}
  @media print{.barra{display:none;}body{margin:0;}}</style></head><body>
  <div class="barra">Documento generado por AQUILES Patrón — revisa lo marcado en <span style="color:#e6a">rojo</span> antes de imprimir
  <button onclick="window.print()">🖨️ Imprimir / Guardar PDF</button></div>
  <div style="height:44px;"></div>${html}</body></html>`);
  w.document.close();
}

/* ---------- UI ---------- */

let _tEmps = [];

async function abrirTerminacion() {
  if (!sb || !sesion || !miEmpresa) { alert('Inicia sesión para generar documentos.'); return; }
  const ov = document.getElementById('terminacion-overlay');
  const card = document.getElementById('terminacion-card');
  if (!ov || !card) return;
  card.innerHTML = '<p style="font-size:12px;color:#555;">Cargando…</p>';
  ov.style.display = 'flex';
  try {
    const r = await sb.from('employees').select('*').order('full_name', { ascending: true });
    if (r.error) throw r.error;
    _tEmps = r.data || [];
  } catch (e) {
    card.innerHTML = `<p style="color:#c0392b;font-size:13px;">No se pudieron cargar los trabajadores: ${_tEsc(e.message || '')}</p>
      <div style="margin-top:14px;"><button class="gen-btn" onclick="cerrarTerminacion()">Cerrar</button></div>`;
    return;
  }
  if (_tEmps.length === 0) {
    card.innerHTML = `<h3 style="font-family:Fraunces,serif;font-size:20px;margin:0 0 8px;">Documento de terminación</h3>
      <p style="font-size:13px;color:#555;">Primero agrega trabajadores.</p>
      <div style="margin-top:14px;"><button class="gen-btn" onclick="cerrarTerminacion()">Cerrar</button></div>`;
    return;
  }
  renderFormTerminacion();
}

function renderFormTerminacion() {
  const card = document.getElementById('terminacion-card');
  if (!card) return;
  const inp = 'width:100%;box-sizing:border-box;padding:9px 11px;border:1px solid rgba(10,14,26,0.18);border-radius:8px;font-size:13.5px;font-family:inherit;color:#14192a;background:#fff;';
  const lbl = 'display:block;font-size:12px;font-weight:600;color:#14192a;margin:12px 0 4px;';
  const ops = _tEmps.map(e => `<option value="${e.id}">${_tEsc(e.full_name)}${e.position ? ' · ' + _tEsc(e.position) : ''}</option>`).join('');

  card.innerHTML = `
    <h3 style="font-family:Fraunces,serif;font-size:20px;margin:0 0 2px;color:#14192a;">Documento de terminación</h3>
    <p style="font-size:12.5px;color:#555;margin:0 0 6px;">Genera el documento que corresponde al cierre de la relación laboral. Lo que falte saldrá marcado en rojo.</p>

    <label style="${lbl}">¿Qué documento necesitas?</label>
    <select id="t-tipo" style="${inp}" onchange="renderCamposTerminacion()">
      <option value="convenio">Convenio de terminación por mutuo consentimiento</option>
      <option value="renuncia">Renuncia voluntaria</option>
      <option value="rescision">Aviso de rescisión (despido con causa)</option>
    </select>

    <label style="${lbl}">Trabajador</label>
    <select id="t-emp" style="${inp}">${ops}</select>

    <div id="t-campos"></div>

    <div id="t-msg" style="font-size:12px;min-height:14px;margin-top:10px;color:#555;"></div>
    <div style="display:flex;gap:10px;margin-top:6px;">
      <button class="gen-btn" onclick="generarTerminacion()">Generar documento</button>
      <button class="gen-btn ghost" onclick="cerrarTerminacion()">Cerrar</button>
    </div>
  `;
  renderCamposTerminacion();
}

function renderCamposTerminacion() {
  const cont = document.getElementById('t-campos');
  const tipo = document.getElementById('t-tipo')?.value;
  if (!cont) return;
  const inp = 'width:100%;box-sizing:border-box;padding:9px 11px;border:1px solid rgba(10,14,26,0.18);border-radius:8px;font-size:13.5px;font-family:inherit;color:#14192a;background:#fff;';
  const lbl = 'display:block;font-size:12px;font-weight:600;color:#14192a;margin:12px 0 4px;';
  const help = 'display:block;font-size:11px;color:#6a6255;margin:0 0 5px;';
  const f = (id, label, ayuda, type) => `<label style="${lbl}">${label}</label>${ayuda ? `<span style="${help}">${ayuda}</span>` : ''}<input id="${id}" ${type ? `type="${type}"` : ''} style="${inp}" />`;
  const area = (id, label, ayuda) => `<label style="${lbl}">${label}</label>${ayuda ? `<span style="${help}">${ayuda}</span>` : ''}<textarea id="${id}" rows="3" style="${inp}resize:vertical;"></textarea>`;

  const comunes = `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
      <div>${f('t-lugar', 'Lugar de firma', 'Ciudad, Estado')}</div>
      <div>${f('t-fechafirma', 'Fecha de firma', '', 'date')}</div>
      <div>${f('t-fechaefectos', 'Fecha en que surte efectos', 'Último día laborado', 'date')}</div>
      <div>${f('t-t1', 'Testigo 1', '')}</div>
      <div>${f('t-t2', 'Testigo 2', '')}</div>
    </div>`;

  if (tipo === 'convenio') {
    cont.innerHTML = comunes + `
      ${f('t-hora', 'Hora de firma', 'Ej. 12:00 horas')}
      ${f('t-clave', 'Clave de elector del trabajador (INE)', 'Los 18 caracteres de su credencial')}
      ${f('t-centro', 'Centro de trabajo', 'Dónde laboraba (si es distinto al domicilio de la empresa)')}
      ${area('t-bienes', 'Bienes que devuelve (si aplica)', 'Déjalo vacío si no conserva nada de la empresa.')}`;
  } else if (tipo === 'renuncia') {
    cont.innerHTML = comunes + `
      ${f('t-clave', 'Clave de elector del trabajador (INE)', 'Los 18 caracteres de su credencial')}
      ${f('t-centro', 'Centro de trabajo', 'Dónde laboraba (si es distinto al domicilio de la empresa)')}`;
  } else { // rescision
    cont.innerHTML = comunes + `
      ${area('t-fracciones', 'Fracciones del Art. 47 LFT que se invocan', 'Ej. "Fracción II: faltas de probidad u honradez..." (escribe cada fracción con lo que dice la ley)')}
      ${f('t-fechaacta', 'Fecha del Acta Administrativa', '', 'date')}
      ${f('t-fechahechos', 'Fecha de los hechos', '', 'date')}
      ${area('t-hechos', 'Narración de los hechos (tiempo, modo y lugar)', 'Qué, cómo, quién, cuándo, dónde y por qué. Sé muy específico.')}
      ${f('t-tipofalta', 'Tipo de falta', 'Ej. falta de probidad y honradez, desobediencia, etc.')}`;
  }
}

function cerrarTerminacion() {
  const ov = document.getElementById('terminacion-overlay');
  if (ov) ov.style.display = 'none';
}

async function generarTerminacion() {
  if (!sb || !sesion || !miEmpresa) return;
  const msg = document.getElementById('t-msg');
  const tipo = document.getElementById('t-tipo')?.value;
  const empId = document.getElementById('t-emp')?.value;
  if (!empId) { if (msg) { msg.textContent = 'Elige un trabajador.'; msg.style.color = '#c0392b'; } return; }
  if (msg) { msg.textContent = 'Generando…'; msg.style.color = '#555'; }

  let emp = null, co = null;
  try {
    const re = await sb.from('employees').select('*').eq('id', empId).maybeSingle();
    if (re.error) throw re.error;
    emp = re.data;
    const rc = await sb.from('companies').select('*').eq('id', miEmpresa).maybeSingle();
    if (rc.error) throw rc.error;
    co = rc.data || {};
  } catch (e) {
    if (msg) { msg.textContent = 'No se pudieron leer los datos: ' + (e.message || ''); msg.style.color = '#c0392b'; }
    return;
  }
  if (!emp) { if (msg) { msg.textContent = 'Trabajador no encontrado.'; msg.style.color = '#c0392b'; } return; }

  const val = id => (document.getElementById(id)?.value || '').trim();
  const x = {
    lugar: val('t-lugar'), fecha_firma: val('t-fechafirma'), fecha_efectos: val('t-fechaefectos'),
    testigo1: val('t-t1'), testigo2: val('t-t2'),
    hora: val('t-hora'), clave_elector: val('t-clave'), centro_trabajo: val('t-centro'),
    bienes: val('t-bienes'),
    fracciones: val('t-fracciones'), fecha_acta: val('t-fechaacta'), fecha_hechos: val('t-fechahechos'),
    hechos: val('t-hechos'), tipo_falta: val('t-tipofalta'),
  };

  let html, titulo;
  if (tipo === 'convenio') { html = _plantillaConvenioMutuo(emp, co, x); titulo = `Convenio de terminación — ${emp.full_name}`; }
  else if (tipo === 'renuncia') { html = _plantillaRenuncia(emp, co, x); titulo = `Renuncia — ${emp.full_name}`; }
  else { html = _plantillaAvisoRescision(emp, co, x); titulo = `Aviso de rescisión — ${emp.full_name}`; }

  _abrirDocTerminacion(html, titulo);
  _ultTerminacion = { empId, docTipo: tipo, titulo, html };
  if (msg) {
    // La renuncia la firma el trabajador; el convenio también. El aviso de
    // rescisión normalmente lo firma el patrón, pero se ofrece igual.
    msg.innerHTML = '✓ Documento generado en una pestaña nueva. ' +
      '<div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">' +
      '<button class="gen-btn" onclick="guardarTerminacionExpediente()">💾 Guardar en expediente</button>' +
      '<button class="gen-btn" onclick="enviarTerminacionAFirmar()">✍️ Enviar a firmar</button></div>';
    msg.style.color = '#1b8a5a';
  }
}

async function guardarTerminacionExpediente() {
  if (!_ultTerminacion) return;
  const msg = document.getElementById('t-msg');
  try {
    if (msg) { msg.textContent = 'Guardando en el expediente…'; msg.style.color = 'rgba(10,14,26,0.6)'; }
    const docType = _ultTerminacion.docTipo === 'convenio' ? 'Convenio de terminación'
      : _ultTerminacion.docTipo === 'renuncia' ? 'Renuncia' : 'Aviso de rescisión';
    await guardarDocGenerado({
      empId: _ultTerminacion.empId, docType,
      titulo: _ultTerminacion.titulo, html: _ultTerminacion.html, kind: 'generado',
    });
    if (msg) { msg.textContent = '✓ Documento guardado en el expediente del trabajador.'; msg.style.color = '#1b8a5a'; }
  } catch (e) {
    if (msg) { msg.textContent = 'No se pudo guardar: ' + (e.message || ''); msg.style.color = '#c0392b'; }
  }
}

let _ultTerminacion = null;
async function enviarTerminacionAFirmar() {
  if (!_ultTerminacion) return;
  const msg = document.getElementById('t-msg');
  try {
    if (msg) { msg.textContent = 'Creando link de firma…'; msg.style.color = 'rgba(10,14,26,0.6)'; }
    const { url } = await crearSolicitudFirma({
      empId: _ultTerminacion.empId, docTipo: _ultTerminacion.docTipo,
      docTitulo: _ultTerminacion.titulo, docHtml: _ultTerminacion.html,
    });
    cerrarTerminacion();
    mostrarLinkFirma(url, _ultTerminacion.titulo);
  } catch (e) {
    if (msg) { msg.textContent = 'No se pudo crear el link: ' + (e.message || ''); msg.style.color = '#c0392b'; }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  const ov = document.getElementById('terminacion-overlay');
  if (ov) ov.addEventListener('click', e => { if (e.target === ov) cerrarTerminacion(); });
});
