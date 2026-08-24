# AQUILES Patrón — Contexto completo del proyecto (traspaso)

> **Para quién es este documento:** para cualquier asistente (Claude en
> PowerShell, otra sesión, Obsidian, o una persona nueva) que vaya a
> continuar este proyecto. Aquí está TODO el contexto que no vive en el
> código: qué es la app, qué está construido, qué falta, las decisiones
> tomadas y por qué, los pasos pendientes del usuario, y los próximos pasos.
> Última actualización: 2026-08-24.

---

## 0. Cómo continuar (léeme primero)

- **Fuente de verdad del código:** el repo `esalazart09/AQUILES-PATRON`
  (rama principal `main`). La app se despliega sola en Netlify a
  **https://aquilespatron.netlify.app/**
- **Rama de trabajo usada por el asistente:** `claude/upbeat-albattani-2C6CT`
  (se sincroniza con `main` tras cada merge).
- **Flujo de trabajo:** cambios → commit → push → PR → merge a `main` →
  Netlify redepliega. Cada archivo `.js` lleva un `?v=N` en `index.html`
  como "rompe-caché"; **súbelo cada vez que edites ese archivo**, o los
  usuarios (sobre todo en tablet) verán una versión vieja.
- **El usuario (Emiliano) no es técnico.** Explícale en lenguaje simple,
  guíalo paso a paso, y sé honesto sobre lo que se puede y no se puede.
  Correo del usuario: esalazarv2001@gmail.com.
- **No hay conector de Obsidian en estas sesiones.** El asistente no puede
  leer ni escribir en el vault de Obsidian del usuario directamente. Este
  archivo (`CONTEXTO-DEL-PROYECTO.md`, en el repo) es la fuente de verdad
  del contexto; si el usuario quiere una copia en Obsidian, la pega él
  mismo a mano.

---

## 1. Qué es AQUILES Patrón

App web **multi-empresa (SaaS)** para que los patrones (empleadores en
México) **blinden legalmente** su relación laboral. Una herramienta de
"AQUILES Blindaje Corporativo & Laboral". Funciones:

1. **Cuentas/acceso** — registro e inicio de sesión (correo + contraseña)
   desde la propia app (Supabase Auth).
2. **Multi-empresa aislado** — cada empresa tiene su espacio en blanco;
   **ninguna ve datos de otra** (Row Level Security de Postgres).
3. **Registro de eventos laborales (supervisor)** — capturar faltas,
   retardos, daños en <60 seg, con evidencia, firma o negativa con testigos,
   geolocalización y **hash SHA-256 real** (sello inmutable).
4. **Panel del administrador** — vista general con **métricas reales**
   (empleados, eventos del mes, documentos, checadas de hoy), semáforo de
   riesgo, cronología real de eventos por expediente.
5. **Trabajadores (expediente real)** — alta con puesto, actividades, pago
   diario y frecuencia de pago (texto libre: diaria/semanal/catorcenal/
   quincenal/mensual/a convenio); datos legales (CURP, RFC, NSS, domicilio,
   nacimiento, nacionalidad, estado civil, fecha de ingreso); y documentos
   escaneados (INE, CURP, NSS…) en almacén privado aislado por empresa.
6. **Datos de la empresa (patrón)** — razón social, RFC, domicilio fiscal,
   registro patronal IMSS, representante legal, datos de escrituras.
7. **Motor de contratos** — genera el contrato individual por tiempo
   indeterminado autollenado (imprimir / guardar PDF).
8. **Documentos de terminación laboral** — convenio de terminación por
   mutuo consentimiento, renuncia voluntaria, y aviso de rescisión,
   autollenados con datos del trabajador y la empresa.
9. **Calculadora de finiquito y liquidación** — con FÓRMULAS de la LFT (sin
   IA): salarios devengados, aguinaldo (proporcional y del año anterior si
   se debe), vacaciones + prima vacacional, días festivos trabajados, horas
   extra dobles/triples, otras cantidades, indemnización 90 días + 20
   días/año (si despido injustificado), prima de antigüedad (topada a 2x
   salario mínimo). Salario mínimo 2026 actualizado (General $315.04,
   Frontera Norte $440.87). Guarda el cálculo y el documento en el expediente.
10. **Checador electrónico real** — con sesión, muestra trabajadores reales,
    marca Entrada/Salida, captura geolocalización real (GPS del navegador) y
    guarda en la nube.
11. **Firma electrónica de documentos** — genera un link (tipo GestApp), el
    trabajador lo abre, dibuja su firma con el dedo, se guarda evidencia
    (correo, nombre, fecha/hora, IP, dispositivo, hash del documento).
    **Firma SIMPLE con valor probatorio — NO es constancia NOM-151.**
12. **Lectura de documentos con IA** — sube foto de INE/CURP/comprobante y
    Claude (Haiku) extrae los datos para llenar la ficha. Requiere que el
    usuario configure su propia API key de Anthropic (pendiente, ver §5).

**Principio rector:** "En derecho laboral, la percepción no basta: lo que no
se acredita, no existe."

---

## 2. Arquitectura y stack

| Pieza | Herramienta | Notas |
|---|---|---|
| Frontend | HTML/CSS/JS puro (sin framework) | `index.html` (~1 archivo grande) + módulos JS cargados por `<script>` |
| Base de datos | **Supabase** (PostgreSQL) | Multi-tenant con RLS |
| Auth | **Supabase Auth** | Correo + contraseña; "Confirm email" DESACTIVADO |
| Archivos | **Supabase Storage** | Bucket privado `documentos`, URLs firmadas |
| Hash | **Web Crypto API** (navegador) | SHA-256 real, gratis |
| IA (lectura docs) | **Anthropic Claude** vía **Netlify Function** | Modelo por defecto: Haiku (barato) |
| Firma electrónica | **Netlify Function** (`firma.js`) | Usa la llave de SERVICIO de Supabase, solo en servidor |
| Publicación | **Netlify** | Deploy automático desde `main`; también corre las Functions |
| Código | **GitHub** | `esalazart09/AQUILES-PATRON` |

**Credenciales públicas de Supabase (seguras, van en el código):**
- URL: `https://hecvpmibfqarilgegobx.supabase.co`
- Publishable key: `sb_publishable_q2GLL3-3TyhuhZsobP4BmQ_TbtzztrF`
- Están en `backend.js`. La `service_role` y la contraseña de la BD son
  SECRETAS y nunca deben aparecer en el código ni en el chat — solo como
  variable de entorno en Netlify.

**Archivos clave del repo:**
- `index.html` — toda la UI (demo + app real). Modales de login, expediente,
  datos de empresa, generar contrato, finiquito, terminación, y link de
  firma viven aquí.
- `backend.js` (`?v=14`) — conexión a Supabase, auth, multi-tenant,
  trabajadores, documentos, lectura IA, `guardarDocGenerado()` (helper
  compartido para guardar documentos generados con hash), `cargarMetricas()`.
- `contratos.js` (`?v=2`) — motor de contrato indeterminado (autollenado +
  guardar en expediente + enviar a firmar).
- `terminacion.js` (`?v=1`) — convenio mutuo, renuncia, aviso de rescisión
  (autollenado + guardar en expediente + enviar a firmar).
- `finiquito.js` (`?v=3`) — calculadora de finiquito/liquidación (fórmulas
  LFT + guarda en `settlements` y como documento en el expediente).
- `checador.js` (`?v=1`) — checador real con geolocalización.
- `firma-cliente.js` (`?v=1`) — crea la solicitud de firma (hash + token) y
  muestra el link para copiar / WhatsApp.
- `netlify/functions/leer-documento.js` — lee documentos con IA (Claude Haiku).
- `netlify/functions/firma.js` — sirve la página pública de firma (por
  token) y guarda la firma + evidencia. Usa `SUPABASE_SERVICE_ROLE_KEY`.
- `package.json` — deps: `@anthropic-ai/sdk`, `@supabase/supabase-js`.
- `db/01..10_*.sql` — todos los scripts SQL, en orden. **El usuario los
  corre a mano en el SQL Editor de Supabase.** Deben ejecutarse en orden.
- `ETAPA-2-PLAN.md` — el plan original de la Etapa 2.
- `README.md` — incluye tabla de variables de entorno de Netlify y el aviso
  legal sobre NOM-151.

---

## 3. Modelo de datos (tablas en Supabase)

- **companies** — cada empresa cliente. Campos: name, owner_id, rfc,
  fiscal_address, imss_registro, legal_rep_name, legal_rep_role,
  jurisdiction, y datos de escrituras (const_* y rep_*).
- **profiles** — un perfil por usuario (id = auth.users.id), liga a
  company_id + role.
- **employees** — trabajadores. Campos: full_name, position, activities,
  daily_pay, pay_period, curp, rfc, nss, address, birth_date, nationality,
  civil_status, hire_date, company_id.
- **events** — eventos/faltas. worker_name, fault_type, legal_basis,
  evidence, signature_status, geolocation, hash, company_id, employee_id.
- **documents** — metadatos de archivos. company_id, employee_id, doc_type,
  file_path, file_name, **kind** ('subido'|'generado'|'firmado'), **hash**.
- **Storage bucket `documentos`** — archivos reales (subidos Y generados),
  ruta `company_id/employee_id/archivo`.
- **settlements** — cálculos de finiquito/liquidación. company_id,
  employee_id, tipo, motivo, entrada (jsonb), desglose (jsonb), total.
- **checadas** — entradas/salidas del checador. company_id, employee_id,
  tipo, marcada_at, lat, lng, precision_m, estado.
- **signatures** — solicitudes de firma electrónica. company_id,
  employee_id, token, doc_tipo, doc_titulo, doc_html, doc_hash,
  firmante_email/nombre, firma_img, estado, firmado_at, firmante_ip,
  firmante_ua.

**Aislamiento:** función `auth_company_id()` (SECURITY DEFINER) + políticas
RLS que filtran por `company_id = auth_company_id()`. Un usuario solo ve lo
suyo. La tabla `signatures` es especial: el flujo público por token (sin
sesión) lo maneja la Netlify Function con la llave de servicio, no RLS de
usuario anónimo.

**Aprovisionamiento:** al iniciar sesión por primera vez, `ensureCompany()`
en backend.js crea la empresa en blanco + el perfil (idempotente y
auto-reparable: si algo quedó a medias, se arregla en el siguiente login;
también busca una empresa propia previa por `owner_id` antes de crear una
nueva, para no duplicar).

---

## 4. Estado actual — QUÉ FUNCIONA (verificado / probado en código)

- ✅ Registro + login desde la app.
- ✅ Multi-empresa aislado, cada empresa en blanco.
- ✅ Alta y expediente de trabajadores (datos + documentos subidos).
- ✅ Eventos con hash SHA-256 real, guardados y visibles en el panel.
- ✅ Datos de la empresa.
- ✅ Motor de contratos (indeterminado) autollenado, con salario en letras,
  edad y antigüedad calculadas; lo que falta sale marcado en rojo.
- ✅ Documentos de terminación (convenio mutuo, renuncia, aviso de
  rescisión) autollenados.
- ✅ Calculadora de finiquito/liquidación completa (todos los conceptos de
  la LFT que aplican), con salario mínimo 2026 actualizado.
- ✅ Checador real con geolocalización.
- ✅ Firma electrónica (link + dibujar firma + evidencia).
- ✅ Documentos generados (contrato/terminación/finiquito) se guardan en el
  expediente con hash, junto a los subidos.
- ✅ Métricas reales del panel (empleados, eventos del mes, documentos,
  checadas de hoy).
- ✅ Botón "Leer datos con IA" en el expediente (código listo, falta activar
  la API key — ver §5).
- ✅ Caché controlado (todos los `.js` con `?v=N` + headers `must-revalidate`
  en `netlify.toml`).

---

## 5. PENDIENTES DEL USUARIO (acciones fuera del código)

1. **Correr el SQL nuevo** en el SQL Editor de Supabase, en orden (los
   anteriores 01-07 ya están corridos, confirmado por el usuario):
   - `db/08_checador.sql`
   - `db/09_firmas.sql`
   - `db/10_docs_generados.sql`
2. **Activar la lectura con IA (2 pasos, aún NO hecho):**
   - Crear API key en **console.anthropic.com** (con saldo; ~$5 USD basta
     para ~1,500 lecturas con Haiku).
   - En Netlify → Site configuration → Environment variables → agregar
     `ANTHROPIC_API_KEY` = la llave `sk-ant-...` → redeploy.
   - Hasta que haga esto, el botón "Leer datos con IA" dará error.
3. **Activar la firma electrónica (2 pasos, aún NO hecho):**
   - En Netlify → Environment variables → agregar
     `SUPABASE_SERVICE_ROLE_KEY` (Supabase → Project Settings → API →
     "service_role" — SECRETA) y `SUPABASE_URL`.
   - Sin esto, la función `firma.js` no puede servir/guardar firmas.
4. **Supabase Free se pausa** tras ~7 días sin uso (plan gratis). Se
   despierta con "Resume project" en el dashboard. A futuro: Supabase Pro
   (~$25/mes) no se pausa.
5. **Borrar ramas ajenas en GitHub** (el asistente NO puede borrar ramas en
   este entorno — ya explicado y aceptado por el usuario): en la web de
   GitHub → Branches → bote de basura. Eran de otros proyectos (Hotel
   Costeño, Defensa Bélgica, Cuestionario GODOGG, Infografías notario).
   `main` está limpio de esto.

---

## 6. Decisiones tomadas (y por qué)

- **Camino incremental** conservando la demo: la demo de ventas se explora
  SIN sesión; guardar datos reales REQUIERE sesión. La misma URL sirve para
  vender y para operar.
- **Login por email** (no WhatsApp): WhatsApp OTP requiere proveedor de paga
  y verificación de negocio → Etapa 3.
- **Claude Haiku** para leer documentos (barato, ~$0.003/doc); configurable
  a Sonnet vía `ANTHROPIC_MODEL` si un documento es difícil.
- **Finiquito/liquidación con FÓRMULAS, no IA:** los cálculos legales
  (aguinaldo, vacaciones, prima vacacional, prima de antigüedad, 90 días, 20
  días/año) se programan en código → gratis, exactos, instantáneos. La IA
  solo redactaría el escrito. Nunca usar IA para la aritmética.
- **Salario mínimo 2026 actualizado por investigación web** (CONASAMI/DOF,
  vigente desde 1-ene-2026): General $315.04/día, Zona Libre de la Frontera
  Norte $440.87/día. Selector de zona en la calculadora.
- **Firma electrónica simple, NO NOM-151 propia.** Investigado a fondo:
  tener NOM-151 propia requiere ser PSC (Prestador de Servicios de
  Certificación) acreditado ante la Secretaría de Economía — solo pueden
  serlo notarios, corredores públicos, o personas morales con acreditación
  formal (proceso largo, costoso, cientos de miles de pesos). **No es
  viable para AQUILES.** Se construyó una firma electrónica SIMPLE (link +
  dibujar firma + evidencia: correo, fecha, IP, dispositivo, hash) que SÍ
  tiene valor probatorio pero NO equivale a NOM-151. Para NOM-151 real, la
  vía correcta es contratar a un PSC ya acreditado (queda como opción
  premium de Etapa 3). **Nunca vender la firma actual como "NOM-151".**
- **Texto en negro forzado en los modales** (finiquito, empresa, contrato,
  expediente, acceso): hubo un bug de texto blanco ilegible en modo oscuro;
  se corrigió forzando fondo claro (#fdfbf6) y color oscuro (#14192a) sin
  depender de variables de tema.

---

## 7. Costos de operación (resumen — ver también el Artifact de costos
   publicado en una sesión anterior, si se necesita el desglose completo)

- **Hoy (construyendo):** $0–5 USD/mes (planes gratis + dominio ~$1.25).
- **En producción:** $26–45/mes (Supabase Pro $25 + dominio + IA por uso).
- **Escalado a 4,000 empleados (10 clientes de 400):** $60–110/mes recurrente
  + ~$120 único de IA por leer 40,000 documentos (Haiku, $0.003 c/u).
- **Costo por empleado/mes:** ~$0.02 USD. Se paga por infraestructura, no
  por empleado → margen enorme.
- Vigilar: almacenamiento (100 GB incluidos en Pro; 40k docs ≈ 80 GB),
  ancho de banda, y poner límite de gasto en el panel de Anthropic.

---

## 8. PRÓXIMOS PASOS (lo que sigue por construir)

Ya completados de la lista anterior: calculadora de finiquito ✅, checador
real ✅, firma electrónica ✅, documentos en expediente ✅, métricas reales ✅.

Pendientes, en orden sugerido:

1. **Actas administrativas mejoradas con IA.** El patrón escribe un
   borrador y la IA (Haiku) lo convierte en un acta formal con "tiempo,
   modo y lugar" ultra específico — se conecta directo con el aviso de
   rescisión ya construido (que pide narrar los hechos). **Requiere que el
   usuario active la API key de Anthropic (§5, punto 2).**
2. **Envío de correo automático** para la firma electrónica (hoy se manda
   el link por WhatsApp o copiar/pegar manualmente). Requeriría un
   servicio tipo Resend (tiene capa gratis) con su propia API key.
3. **Más tipos de contrato** (determinado, prueba, por obra, temporada,
   capacitación inicial): el usuario dijo que "los contratos ya están
   completos" — verificar con él si tiene más machotes de contrato de
   contratación pendientes de convertir, o si ya se cubrió con el
   indeterminado + los 3 de terminación.
4. **Validación facial / foto en el checador** — Etapa 3.
5. **NOM-151 real vía PSC contratado** — Etapa 3, cuando haya clientes que
   lo exijan y se pueda absorber el costo por documento.
6. **Exportación forense consolidada** (expediente completo en PDF con
   todos los hashes verificables, para presentar en juicio) — no
   construido aún; hoy cada documento se ve/descarga por separado.

**Etapa 3 (más adelante, sin urgencia):** login por WhatsApp, firma con
validez NOM-151 (vía PSC autorizado), validación facial real, respaldos
automáticos propios del usuario, migración a servidor propio si se desea
(todo el stack es portable: Postgres + archivos estándar).

---

## 9. Machotes de contrato / documentos ya recibidos y convertidos

El usuario compartió (vía archivos .docx subidos al chat) y ya están
convertidos en plantillas dentro del código:

1. **Contrato Individual de Trabajo por Tiempo INDETERMINADO** →
   `contratos.js` (`_plantillaIndeterminado`). 21 cláusulas + declaraciones
   + confidencialidad + beneficiarios + aviso de privacidad.
2. **Convenio de Terminación de la Relación de Trabajo por Mutuo
   Consentimiento** → `terminacion.js` (`_plantillaConvenioMutuo`).
3. **Renuncia Voluntaria** → `terminacion.js` (`_plantillaRenuncia`), con
   acuse de recibo patronal.
4. **Aviso de Rescisión** → `terminacion.js` (`_plantillaAvisoRescision`),
   con campos para fracciones del Art. 47 LFT, hechos en tiempo/modo/lugar,
   fecha del acta administrativa y tipo de falta.

El usuario mencionó que "los contratos ya están completos" — confirmar si
esto significa que no hay más machotes de contratación pendientes de
convertir (solo se procesaron el indeterminado + los 3 de terminación).

---

## 10. Notas operativas para el asistente que continúe

- Cada vez que se edita un `.js`, subir su `?v=N` en `index.html` — si no,
  el navegador (sobre todo en tablet) sirve una versión vieja en caché.
- Siempre correr `node --check archivo.js` antes de hacer commit.
- Flujo git: commit en la rama de trabajo → push → PR a `main` → merge →
  `git fetch origin main && git reset --hard origin/main` → push
  force-with-lease de vuelta a la rama de trabajo, para mantenerla
  sincronizada.
- El asistente NO puede borrar ramas de GitHub desde este entorno (git
  push --delete y la API REST fallan por restricciones del proxy/token).
  Si hace falta borrar una rama, pedirle al usuario que lo haga desde la
  web de GitHub.
- Sé siempre honesto sobre lo que se puede y no se puede hacer (ej.: no
  hay conexión a Obsidian, no se puede correr SQL directamente en la BD del
  usuario, no se puede tomar control remoto de su dispositivo). El usuario
  valora mucho la transparencia sobre las limitaciones técnicas y legales
  (como el tema de NOM-151).
- El usuario pidió una auditoría de su propio código en una sesión anterior
  y se corrigió un bug real (aprovisionamiento de empresa duplicado) — el
  patrón de auto-auditar antes de construir sobre código previo es
  bienvenido si algo se ve sospechoso.
