/* ============================================================
   AQUILES Patrón — Motor de contratos (Etapa 2)
   Toma un trabajador real + datos de la empresa + campos del
   contrato, y genera el documento LLENO listo para imprimir o
   guardar como PDF. Basado en el machote de contrato indeterminado.

   Depende de: sb, sesion, miEmpresa (definidos en backend.js).
   ============================================================ */

/* ---------- Utilidades ---------- */

function _esc(s) {
  return (s == null ? '' : String(s)).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}

// Rellena un hueco: si hay dato, lo pone; si no, deja una línea para llenar a mano.
function _f(valor, anchoRelleno) {
  const v = (valor == null ? '' : String(valor)).trim();
  if (v) return _esc(v);
  return '<span style="color:#b04a4a;">' + '_'.repeat(anchoRelleno || 12) + '</span>';
}

const _MESES = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];

function _fechaLarga(iso) {
  if (!iso) return '';
  const d = new Date(iso + (iso.length <= 10 ? 'T00:00:00' : ''));
  if (isNaN(d)) return '';
  return `${d.getDate()} de ${_MESES[d.getMonth()]} de ${d.getFullYear()}`;
}

function _edad(iso) {
  if (!iso) return '';
  const d = new Date(iso + (iso.length <= 10 ? 'T00:00:00' : ''));
  if (isNaN(d)) return '';
  const hoy = new Date();
  let e = hoy.getFullYear() - d.getFullYear();
  const m = hoy.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && hoy.getDate() < d.getDate())) e--;
  return e > 0 && e < 120 ? String(e) : '';
}

/* ---------- Número de pesos a letras ---------- */
function _numeroALetras(num) {
  if (num == null || isNaN(num)) return '';
  const n = Math.floor(Math.abs(num));
  const centavos = Math.round((Math.abs(num) - n) * 100);
  const UNI = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez',
    'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte',
    'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve'];
  const DEC = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
  const CEN = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

  function seccion(x) {
    let out = '';
    if (x === 0) return '';
    if (x === 100) return 'cien';
    const c = Math.floor(x / 100); const r = x % 100;
    if (c) out += CEN[c] + (r ? ' ' : '');
    if (r <= 29) out += UNI[r];
    else {
      const d = Math.floor(r / 10); const u = r % 10;
      out += DEC[d] + (u ? ' y ' + UNI[u] : '');
    }
    return out.trim();
  }

  let palabras = '';
  if (n === 0) palabras = 'cero';
  else {
    const millones = Math.floor(n / 1000000);
    const miles = Math.floor((n % 1000000) / 1000);
    const resto = n % 1000;
    if (millones) palabras += (millones === 1 ? 'un millón' : seccion(millones) + ' millones') + ' ';
    if (miles) palabras += (miles === 1 ? 'mil' : seccion(miles) + ' mil') + ' ';
    if (resto) palabras += seccion(resto);
    palabras = palabras.trim();
  }
  palabras = palabras.charAt(0).toUpperCase() + palabras.slice(1);
  return `${palabras} pesos ${centavos.toString().padStart(2, '0')}/100 M.N.`;
}

/* ---------- Plantilla: contrato indeterminado ---------- */

function _plantillaIndeterminado(emp, co, x) {
  const salarioLetra = emp.daily_pay != null ? ` (${_numeroALetras(emp.daily_pay)})` : '';
  const edad = _edad(emp.birth_date);
  return `
  <h1>CONTRATO INDIVIDUAL DE TRABAJO POR TIEMPO INDETERMINADO</h1>

  <p>Que celebran, por una parte, la sociedad mercantil denominada <b>${_f(co.name, 30)}</b>, representada en este acto por el/la C. <b>${_f(co.legal_rep_name, 24)}</b>, a quien en lo sucesivo se le identificará como “EL PATRÓN”, y por la otra parte, el/la C. <b>${_f(emp.full_name, 24)}</b>, a quien en lo sucesivo se le denominará como “EL TRABAJADOR”; y cuando se haga referencia a ambos se les denominará “LAS PARTES”, sujetándose ambas a las siguientes declaraciones y cláusulas:</p>

  <h2>D E C L A R A C I O N E S</h2>

  <p><b>I. DECLARA “EL TRABAJADOR”:</b></p>
  <p>1. Que su nombre es ${_f(emp.full_name, 20)}, que es de nacionalidad ${_f(emp.nationality, 12)}, que cuenta con ${_f(edad, 4)} años de edad, que su estado civil es ${_f(emp.civil_status, 12)}, que su CURP es ${_f(emp.curp, 18)}, que su clave de RFC es ${_f(emp.rfc, 13)}, que su Número de Seguridad Social es ${_f(emp.nss, 11)} y que señala como domicilio para todos los efectos legales el ubicado en ${_f(emp.address, 30)}.</p>
  <p>2. Que tiene la capacidad necesaria para desempeñar el trabajo materia de la contratación.</p>
  <p>3. Que asimismo expresa su conformidad en prestar sus servicios conforme a las condiciones fijadas por “EL PATRÓN” y bajo la subordinación de este.</p>

  <p><b>II. DECLARA “EL PATRÓN”:</b></p>
  <p>1. Que es una sociedad legalmente constituida de conformidad con las leyes del país, según consta en la escritura pública no. ${_f(co.const_escritura, 8)}, de fecha ${_f(co.const_fecha, 12)}, otorgada ante la fe del LIC. ${_f(co.const_notario, 18)}, notario público no. ${_f(co.const_notaria, 5)}, de la ciudad de ${_f(co.const_ciudad, 14)}, la cual se encuentra debidamente inscrita en el Registro Público de la Propiedad y del Comercio bajo el folio mercantil no. ${_f(co.const_folio, 10)}.</p>
  <p>2. Que en este acto comparece legalmente representada por el/la C. ${_f(co.legal_rep_name, 20)}, en su carácter de ${_f(co.legal_rep_role, 16)}, personalidad que acredita mediante la escritura pública no. ${_f(co.rep_escritura, 8)}, de fecha ${_f(co.rep_fecha, 12)}, otorgada ante la fe del LIC. ${_f(co.rep_notario, 18)}, notario público no. ${_f(co.rep_notaria, 5)}, de la ciudad de ${_f(co.rep_ciudad, 14)}, manifestando que dichas facultades no le han sido revocadas, modificadas ni limitadas en forma alguna.</p>
  <p>3. Que su representada tiene su domicilio fiscal en el ubicado en ${_f(co.fiscal_address, 30)}, que se encuentra inscrita en el RFC con clave ${_f(co.rfc, 12)} y registrada ante el IMSS bajo el registro patronal no. ${_f(co.imss_registro, 12)}.</p>
  <p>4. Que asimismo manifiesta que su representada requiere de una persona que preste sus servicios de manera subordinada y en calidad de trabajador, quien deberá contar con la capacitación suficiente para desempeñar el trabajo objeto de la contratación, por tiempo indeterminado.</p>

  <h2>C L Á U S U L A S</h2>

  <p><b>PRIMERA.</b> La relación laboral que mediante este instrumento se formaliza tendrá una duración por tiempo INDETERMINADO, pudiendo concluir por cualquiera de los supuestos contemplados en el artículo 53 de la Ley Federal del Trabajo, así como rescindirse al actualizarse alguna de las hipótesis previstas en el artículo 47 del mismo ordenamiento legal.</p>

  <p><b>SEGUNDA.</b> "EL TRABAJADOR" queda obligado a desempeñar de manera personal sus servicios, sujeto a la dirección y dependencia de "EL PATRÓN" y de quienes lo representen, declarando bajo protesta de decir verdad que reúne la aptitud requerida para cumplir el trabajo encomendado, el cual corresponderá al puesto de ${_f(emp.position, 18)}, consistente fundamentalmente en las siguientes funciones: ${_f(emp.activities, 40)}, entre otras. Las partes entienden que la enunciación de actividades es meramente ejemplificativa y no restrictiva, por lo que "EL TRABAJADOR" deberá ejecutar cualquier otra tarea vinculada con su área, siempre y cuando le sea conservado su salario. Por su parte, "EL PATRÓN" conserva plena facultad para reubicar a "EL TRABAJADOR", trasladándolo de un puesto a otro o de un sitio a otro dentro de la empresa, de sus establecimientos o de los de sus clientes, cuando ello resulte necesario, debiendo en todo caso respetar su salario base. "EL TRABAJADOR" prestará sus servicios en ${_f(x.lugar_trabajo, 24)} y/o en cualquier otra sucursal o domicilio que "EL PATRÓN" le indique en razón de la naturaleza del trabajo.</p>

  <p><b>TERCERA.</b> Las partes convienen en que "EL PATRÓN" tiene por reconocida a favor de "EL TRABAJADOR" una antigüedad que se computará desde el día ${_f(_fechaLarga(emp.hire_date), 18)}, aceptándose dicha fecha como la única válida para todos los efectos legales a que haya lugar.</p>

  <p><b>CUARTA.</b> Como retribución por los servicios prestados, "EL PATRÓN" pagará a "EL TRABAJADOR" un salario ${_f(emp.pay_period, 10)} equivalente a la cantidad diaria de $${_f(emp.daily_pay != null ? Number(emp.daily_pay).toLocaleString('es-MX', { minimumFractionDigits: 2 }) : '', 8)}${salarioLetra}. Ambas partes acuerdan que dicha remuneración se cubrirá mediante depósito en la cuenta de nómina de "EL TRABAJADOR", o bien en efectivo o por medio de cheque, según su preferencia. De la cantidad señalada, "EL PATRÓN" practicará y enterará, por cuenta de "EL TRABAJADOR", las retenciones que las disposiciones legales imponen, particularmente las relativas al Impuesto Sobre la Renta, al Seguro Social, al Infonavit y a las demás cargas que la ley establezca. Las partes admiten que el comprobante de la transferencia bancaria surtirá por sí solo los efectos jurídicos propios de un recibo de nómina timbrado.</p>

  <p><b>QUINTA.</b> La jornada de “EL TRABAJADOR” será de 48 horas semanales durante el año 2026, la cual se reducirá de manera gradual conforme al calendario previsto en los artículos transitorios del Decreto de reforma a la Ley Federal del Trabajo en materia de reducción de la jornada laboral (46 horas desde el 1 de enero de 2027, 44 desde 2028, 42 desde 2029 y 40 desde 2030). La distribución de dicha jornada quedará fijada en el siguiente horario: ${_f(x.horario, 24)}; dentro del cual “EL TRABAJADOR” dispondrá de 30 minutos para la toma de alimentos. “EL TRABAJADOR” no se encuentra autorizado para laborar tiempo extraordinario, días de descanso ni días festivos, salvo orden expresa y por escrito de “EL PATRÓN”.</p>

  <p><b>SEXTA.</b> “EL TRABAJADOR” gozará de un día de descanso semanal, designándose inicialmente el día ${_f(x.dia_descanso, 10)}, con goce de sueldo, en términos del artículo 72 de la Ley Federal del Trabajo. Tendrá como días de descanso obligatorio los enumerados en el artículo 74 de la misma Ley.</p>

  <p><b>SÉPTIMA.</b> "EL TRABAJADOR" disfrutará del período vacacional que le corresponda según su antigüedad, en términos del artículo 76 de la Ley Federal del Trabajo, así como de la prima vacacional del 25% conforme al artículo 80.</p>

  <p><b>OCTAVA.</b> "EL TRABAJADOR" será acreedor a un aguinaldo anual de 15 días de salario, o la proporción que corresponda, pagadero a más tardar el 20 de diciembre, conforme al artículo 87 de la Ley Federal del Trabajo.</p>

  <p><b>NOVENA.</b> "EL TRABAJADOR" estará obligado a dejar constancia de su hora de ingreso y de salida a través del reloj checador electrónico y/o mediante su firma en la lista de asistencia; el incumplimiento se reputará como falta injustificada para todos los efectos legales.</p>

  <p><b>DÉCIMA.</b> Si "EL TRABAJADOR" llegare con retraso, corresponderá a "EL PATRÓN" decidir si lo admite o no al desempeño de sus labores; de aceptarlo, sólo estará obligado a retribuir el tiempo efectivamente trabajado.</p>

  <p><b>DÉCIMA PRIMERA.</b> "EL TRABAJADOR" se compromete a acatar el Reglamento Interior de Trabajo y las demás normas aplicables a la relación laboral.</p>

  <p><b>DÉCIMA SEGUNDA.</b> "EL PATRÓN" brindará capacitación y adiestramiento conforme a la ley, y "EL TRABAJADOR" se obliga a acudir a los cursos y sustentar las evaluaciones correspondientes.</p>

  <p><b>DÉCIMA TERCERA.</b> "EL TRABAJADOR" asume el deber de mantenerse en estado de salud idóneo, realizarse los exámenes médicos que su condición o "EL PATRÓN" requieran, y notificar cualquier circunstancia que comprometa su seguridad o la de terceros.</p>

  <p><b>DÉCIMA CUARTA.</b> "EL TRABAJADOR" se obliga a guardar la más estricta CONFIDENCIALIDAD respecto de toda información de la que tenga conocimiento durante y después de la relación laboral, incluyendo secretos industriales, información financiera, bases de datos, datos personales de terceros (conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares), credenciales y asuntos jurídicos de "EL PATRÓN". Su incumplimiento constituirá causa de rescisión sin responsabilidad para "EL PATRÓN", en términos del artículo 47 de la Ley Federal del Trabajo.</p>

  <p><b>DÉCIMA QUINTA.</b> "EL TRABAJADOR" conviene en destinar sus servicios de forma exclusiva a "EL PATRÓN".</p>

  <p><b>DÉCIMA SEXTA.</b> Los útiles, herramientas, equipo y bienes que "EL PATRÓN" entregue a "EL TRABAJADOR" son propiedad exclusiva del primero; "EL TRABAJADOR" se obliga a conservarlos y devolverlos. Cualquier obra, invención o desarrollo que genere con motivo de sus funciones será titularidad de "EL PATRÓN".</p>

  <p><b>DÉCIMA SÉPTIMA.</b> Cuando "EL PATRÓN" destine algún vehículo de la empresa a "EL TRABAJADOR", este lo utilizará exclusivamente para la actividad laboral encomendada, prohibiéndose su uso personal.</p>

  <p><b>DÉCIMA OCTAVA.</b> "EL TRABAJADOR" quedará dado de alta y asegurado ante el Instituto Mexicano del Seguro Social conforme a la Ley de la materia.</p>

  <p><b>DÉCIMA NOVENA.</b> "EL TRABAJADOR" se obliga a informar por escrito todo cambio de domicilio; de no hacerlo, "EL PATRÓN" quedará eximido de responsabilidad conforme al último párrafo del artículo 47 de la Ley Federal del Trabajo.</p>

  <p><b>VIGÉSIMA.</b> Con fundamento en el artículo 25, fracción X, de la Ley Federal del Trabajo, “EL TRABAJADOR” designa como beneficiario(s) para el pago de salarios y prestaciones devengadas y no cobradas a su muerte, a: ${_f(x.beneficiarios, 30)}.</p>

  <p><b>VIGÉSIMA PRIMERA.</b> Para la interpretación y cumplimiento del presente contrato, ambas partes se someten a la jurisdicción de los tribunales laborales competentes de ${_f(co.jurisdiction || x.lugar_firma, 18)}, declinando cualquier otro fuero.</p>

  <p style="margin-top:16px;"><b>Aviso de privacidad.</b> “EL TRABAJADOR” reconoce que “EL PATRÓN” recaba y tratará sus datos personales (nombre, domicilio, CURP, RFC, NSS, datos de contacto, de beneficiarios y sensibles de salud) con la finalidad de cumplir las obligaciones laborales, de seguridad social y fiscales, conforme a la Ley Federal de Protección de Datos Personales en Posesión de los Particulares y el Aviso de Privacidad que declara conocer y aceptar, otorgando su consentimiento expreso para el tratamiento de datos sensibles en términos del artículo 9 de dicha Ley.</p>

  <p style="margin-top:18px;">LEÍDO Y RATIFICADO el presente Contrato y enteradas las partes de su alcance, obligaciones y consecuencias, lo suscriben por duplicado en ${_f(x.lugar_firma, 18)}, a ${_f(_fechaLarga(x.fecha_firma) || x.fecha_firma, 16)}.</p>

  <div class="firmas">
    <div class="firma"><div class="linea"></div>“EL PATRÓN”<br>${_f(co.legal_rep_name, 20)}<br><span class="chico">${_esc(co.name || '')}</span></div>
    <div class="firma"><div class="linea"></div>“EL TRABAJADOR”<br>${_f(emp.full_name, 20)}</div>
  </div>
  <div class="firmas">
    <div class="firma"><div class="linea"></div>“TESTIGO”<br>${_f(x.testigo1, 18)}</div>
    <div class="firma"><div class="linea"></div>“TESTIGO”<br>${_f(x.testigo2, 18)}</div>
  </div>
  `;
}

/* ---------- Documento imprimible ---------- */

function _abrirContratoImprimible(htmlContrato, titulo) {
  const w = window.open('', '_blank');
  if (!w) { alert('Permite las ventanas emergentes para ver el contrato.'); return; }
  w.document.write(`<!DOCTYPE html><html lang="es"><head><meta charset="utf-8">
  <title>${_esc(titulo)}</title>
  <style>
    @page { size: Letter; margin: 2.2cm 2cm; }
    body { font-family: 'Times New Roman', Georgia, serif; font-size: 11.5pt; line-height: 1.5; color: #111; max-width: 720px; margin: 24px auto; padding: 0 16px; text-align: justify; }
    h1 { font-size: 14pt; text-align: center; margin: 0 0 18px; }
    h2 { font-size: 12pt; text-align: center; letter-spacing: 2px; margin: 22px 0 10px; }
    p { margin: 0 0 10px; }
    .firmas { display: flex; gap: 40px; justify-content: space-around; margin: 40px 0 10px; text-align: center; font-size: 11pt; }
    .firma { flex: 1; }
    .linea { border-top: 1px solid #111; margin: 40px 12px 6px; }
    .chico { font-size: 9.5pt; color: #444; }
    .barra { position: fixed; top: 0; left: 0; right: 0; background: #0a0e1a; color: #fff; padding: 10px; text-align: center; font-family: system-ui, sans-serif; font-size: 13px; }
    .barra button { background: #c08a3e; color: #fff; border: none; padding: 8px 18px; border-radius: 6px; font-size: 13px; cursor: pointer; margin-left: 8px; }
    @media print { .barra { display: none; } body { margin: 0; } }
  </style></head><body>
  <div class="barra">Contrato generado por AQUILES Patrón — revisa los campos en <span style="color:#e6a">rojo</span> antes de imprimir
    <button onclick="window.print()">🖨️ Imprimir / Guardar PDF</button>
  </div>
  <div style="height:44px;"></div>
  ${htmlContrato}
  </body></html>`);
  w.document.close();
}

/* ---------- Flujo: elegir trabajador y generar ---------- */

let _empsContrato = []; // cache de trabajadores para el pre-llenado

async function abrirGenerarContrato() {
  if (!sb || !sesion || !miEmpresa) { alert('Inicia sesión para generar contratos.'); return; }
  const ov = document.getElementById('contrato-overlay');
  const card = document.getElementById('contrato-card');
  if (!ov || !card) return;
  card.innerHTML = '<p style="font-size:12px;color:rgba(10,14,26,0.55);">Cargando…</p>';
  ov.style.display = 'flex';

  let emps = [];
  try {
    const r = await sb.from('employees').select('*').order('full_name', { ascending: true });
    if (r.error) throw r.error;
    emps = r.data || [];
    _empsContrato = emps; // guardar para pre-llenado al cambiar de trabajador
  } catch (e) {
    card.innerHTML = `<p style="color:#c0392b;font-size:13px;">No se pudieron cargar los trabajadores: ${_esc(e.message || '')}</p>
      <div style="margin-top:14px;"><button class="gen-btn" onclick="cerrarGenerarContrato()">Cerrar</button></div>`;
    return;
  }
  if (emps.length === 0) {
    card.innerHTML = `<h3 style="font-family:'Fraunces',serif;font-weight:500;font-size:20px;margin:0 0 8px;">Generar contrato</h3>
      <p style="font-size:13px;color:rgba(10,14,26,0.6);">Primero agrega trabajadores en el panel para poder generarles un contrato.</p>
      <div style="margin-top:14px;"><button class="gen-btn" onclick="cerrarGenerarContrato()">Cerrar</button></div>`;
    return;
  }

  const inp = 'width:100%;box-sizing:border-box;padding:9px 11px;border:1px solid rgba(10,14,26,0.18);border-radius:8px;font-size:13.5px;font-family:inherit;';
  const lbl = 'display:block;font-size:10.5px;letter-spacing:0.04em;text-transform:uppercase;color:rgba(10,14,26,0.55);margin:11px 0 4px;';
  const opciones = emps.map(e => `<option value="${e.id}">${_esc(e.full_name)}${e.position ? ' · ' + _esc(e.position) : ''}</option>`).join('');

  card.innerHTML = `
    <h3 style="font-family:'Fraunces',serif;font-weight:500;font-size:20px;margin:0 0 2px;">Generar contrato</h3>
    <p style="font-size:12px;color:rgba(10,14,26,0.55);margin:0 0 6px;">Contrato individual de trabajo por tiempo indeterminado.</p>

    <label style="${lbl}">Trabajador</label>
    <select id="ct-emp" style="${inp}background:#fff;" onchange="prellenarDesdeTrabajador()">${opciones}</select>

    <div style="font-size:11px;letter-spacing:0.06em;text-transform:uppercase;color:var(--accent-deep,#0a0e1a);font-weight:700;margin:16px 0 2px;">Datos de este contrato</div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
      <div><label style="${lbl}">Antigüedad — fecha de ingreso</label><input id="ct-ingreso" type="date" style="${inp}" /></div>
      <div><label style="${lbl}">Frecuencia de pago</label><input id="ct-periodo" style="${inp}" placeholder="(diaria, semanal, catorcenal, quincenal, mensual, a convenio)" /></div>
    </div>
    <label style="${lbl}">Lugar de trabajo</label>
    <input id="ct-lugar" style="${inp}" placeholder="Domicilio o sucursal donde laborará" />
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;">
      <div><label style="${lbl}">Horario</label><input id="ct-horario" style="${inp}" placeholder="Ej. 9:00 a 18:00" /></div>
      <div><label style="${lbl}">Día de descanso</label><input id="ct-descanso" style="${inp}" placeholder="Ej. Domingo" /></div>
      <div><label style="${lbl}">Lugar de firma</label><input id="ct-lugarfirma" style="${inp}" placeholder="Ciudad, Estado" /></div>
      <div><label style="${lbl}">Fecha de firma</label><input id="ct-fechafirma" type="date" style="${inp}" /></div>
      <div><label style="${lbl}">Testigo 1</label><input id="ct-t1" style="${inp}" /></div>
      <div><label style="${lbl}">Testigo 2</label><input id="ct-t2" style="${inp}" /></div>
    </div>
    <label style="${lbl}">Beneficiario(s) (opcional)</label>
    <input id="ct-benef" style="${inp}" placeholder="Nombre, parentesco y porcentaje" />

    <div id="ct-msg" style="font-size:12px;min-height:14px;margin-top:10px;color:rgba(10,14,26,0.6);"></div>
    <div style="display:flex;gap:10px;margin-top:6px;">
      <button class="gen-btn" onclick="generarContratoDoc()">Generar contrato</button>
      <button class="gen-btn ghost" onclick="cerrarGenerarContrato()">Cerrar</button>
    </div>
    <p style="font-size:11px;color:rgba(10,14,26,0.5);margin-top:10px;">Se abrirá el contrato lleno en una pestaña nueva, listo para imprimir o guardar como PDF. Los datos que falten aparecerán marcados en rojo para completarlos a mano.</p>
  `;

  prellenarDesdeTrabajador(); // pre-llenar con el primer trabajador de la lista
}

// Pre-llena antigüedad y frecuencia de pago con los datos del trabajador elegido.
function prellenarDesdeTrabajador() {
  const id = document.getElementById('ct-emp')?.value;
  const emp = (_empsContrato || []).find(e => e.id === id);
  if (!emp) return;
  const ingreso = document.getElementById('ct-ingreso');
  const periodo = document.getElementById('ct-periodo');
  if (ingreso && emp.hire_date) ingreso.value = emp.hire_date;
  if (periodo && emp.pay_period) periodo.value = emp.pay_period;
}

function cerrarGenerarContrato() {
  const ov = document.getElementById('contrato-overlay');
  if (ov) ov.style.display = 'none';
}

async function generarContratoDoc() {
  if (!sb || !sesion || !miEmpresa) return;
  const msg = document.getElementById('ct-msg');
  const empId = document.getElementById('ct-emp')?.value;
  if (!empId) { if (msg) { msg.textContent = 'Elige un trabajador.'; msg.style.color = '#c0392b'; } return; }
  if (msg) { msg.textContent = 'Generando…'; msg.style.color = 'rgba(10,14,26,0.6)'; }

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

  // La antigüedad y la frecuencia de pago se toman del formulario (editables
  // aquí), no solo de la ficha, para que este contrato quede como se firma.
  const ingreso = val('ct-ingreso');
  const periodo = val('ct-periodo');
  if (ingreso) emp.hire_date = ingreso;
  if (periodo) emp.pay_period = periodo;

  const x = {
    lugar_trabajo: val('ct-lugar'),
    horario: val('ct-horario'),
    dia_descanso: val('ct-descanso'),
    lugar_firma: val('ct-lugarfirma'),
    fecha_firma: val('ct-fechafirma'),
    testigo1: val('ct-t1'),
    testigo2: val('ct-t2'),
    beneficiarios: val('ct-benef'),
  };

  const html = _plantillaIndeterminado(emp, co, x);
  _abrirContratoImprimible(html, `Contrato — ${emp.full_name}`);
  if (msg) { msg.textContent = '✓ Contrato generado en una pestaña nueva.'; msg.style.color = '#1b8a5a'; }
}

// Cerrar al tocar fuera
window.addEventListener('DOMContentLoaded', () => {
  const ov = document.getElementById('contrato-overlay');
  if (ov) ov.addEventListener('click', e => { if (e.target === ov) cerrarGenerarContrato(); });
});
