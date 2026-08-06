# AQUILES Patrón — Contexto completo del proyecto (traspaso)

> **Para quién es este documento:** para cualquier asistente (Claude en
> PowerShell, otra sesión, o una persona nueva) que vaya a continuar este
> proyecto. Aquí está TODO el contexto que no vive en el código: qué es la
> app, qué está construido, qué falta, las decisiones tomadas y por qué, los
> pasos pendientes del usuario, y los próximos pasos. Última actualización:
> 2026-08-06.

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
  El correo del usuario: esalazarv2001@gmail.com.

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
4. **Panel del administrador** — vista general, semáforo de riesgo,
   cronología real de eventos por expediente.
5. **Trabajadores (expediente real)** — alta con puesto, actividades, pago
   diario y frecuencia de pago; datos legales (CURP, RFC, NSS, domicilio,
   nacimiento, nacionalidad, estado civil, fecha de ingreso); y documentos
   escaneados (INE, CURP, NSS…) en almacén privado aislado por empresa.
6. **Datos de la empresa (patrón)** — razón social, RFC, domicilio fiscal,
   registro patronal IMSS, representante legal, datos de escrituras.
7. **Motor de contratos** — genera el contrato individual por tiempo
   indeterminado autollenado (imprimir / guardar PDF).
8. **Lectura de documentos con IA** — sube foto de INE/CURP/comprobante y
   Claude extrae los datos para llenar la ficha.

**Principio rector:** "En derecho laboral, la percepción no basta: lo que no
se acredita, no existe."

---

## 2. Arquitectura y stack

| Pieza | Herramienta | Notas |
|---|---|---|
| Frontend | HTML/CSS/JS puro (sin framework) | `index.html` (~1 archivo grande) + `backend.js` + `contratos.js`, cargados por CDN |
| Base de datos | **Supabase** (PostgreSQL) | Multi-tenant con RLS |
| Auth | **Supabase Auth** | Correo + contraseña; "Confirm email" DESACTIVADO |
| Archivos | **Supabase Storage** | Bucket privado `documentos`, URLs firmadas |
| Hash | **Web Crypto API** (navegador) | SHA-256 real, gratis |
| IA (lectura docs) | **Anthropic Claude** vía **Netlify Function** | Modelo por defecto: Haiku |
| Publicación | **Netlify** | Deploy automático desde `main` |
| Código | **GitHub** | `esalazart09/AQUILES-PATRON` |

**Credenciales públicas de Supabase (seguras, van en el código):**
- URL: `https://hecvpmibfqarilgegobx.supabase.co`
- Publishable key: `sb_publishable_q2GLL3-3TyhuhZsobP4BmQ_TbtzztrF`
- Están en `backend.js`. La `service_role` y la contraseña de la BD son
  SECRETAS y nunca deben aparecer en el código ni en el chat.

**Archivos clave del repo:**
- `index.html` — toda la UI (demo + app real). Modales de login, expediente,
  datos de empresa y generar contrato viven aquí.
- `backend.js` — conexión a Supabase, auth, multi-tenant, trabajadores,
  documentos, lectura IA. (Cache-buster actual: `?v=13`.)
- `contratos.js` — motor de contratos (plantilla + autollenado). (`?v=2`.)
- `netlify/functions/leer-documento.js` — función de servidor que llama a Claude.
- `package.json` — dependencia `@anthropic-ai/sdk`.
- `db/01..06_*.sql` — todos los scripts SQL, en orden. **El usuario los corre
  a mano en el SQL Editor de Supabase.** Deben ejecutarse en orden.
- `ETAPA-2-PLAN.md` — el plan original de la Etapa 2.

---

## 3. Modelo de datos (tablas en Supabase)

- **companies** — cada empresa cliente. Campos: name, owner_id, rfc,
  fiscal_address, imss_registro, legal_rep_name, legal_rep_role,
  jurisdiction, y datos de escrituras (const_* y rep_*).
- **profiles** — un perfil por usuario (id = auth.users.id), liga a company_id + role.
- **employees** — trabajadores. Campos: full_name, position, activities,
  daily_pay, pay_period, curp, rfc, nss, address, birth_date, nationality,
  civil_status, hire_date, company_id.
- **events** — eventos/faltas. worker_name, fault_type, legal_basis, evidence,
  signature_status, geolocation, hash, company_id, employee_id.
- **documents** — metadatos de archivos subidos. company_id, employee_id,
  doc_type, file_path, file_name.
- **Storage bucket `documentos`** — archivos reales, ruta `company_id/employee_id/archivo`.

**Aislamiento:** función `auth_company_id()` (SECURITY DEFINER) + políticas
RLS que filtran por `company_id = auth_company_id()`. Un usuario solo ve lo suyo.

**Aprovisionamiento:** al iniciar sesión por primera vez, `ensureCompany()`
en backend.js crea la empresa en blanco + el perfil (idempotente y
auto-reparable: si algo quedó a medias, se arregla en el siguiente login).

---

## 4. Estado actual — QUÉ FUNCIONA (verificado)

- ✅ Registro + login desde la app.
- ✅ Multi-empresa aislado, cada empresa en blanco.
- ✅ Alta y expediente de trabajadores (datos + documentos).
- ✅ Eventos con hash SHA-256 real, guardados y visibles en el panel.
- ✅ Datos de la empresa.
- ✅ Motor de contratos (indeterminado) autollenado, con salario en letras,
  edad y antigüedad calculadas; lo que falta sale marcado en rojo.
- ✅ Botón "Leer datos con IA" en el expediente (código listo).
- ✅ Caché controlado (index.html, backend.js, contratos.js).

---

## 5. PENDIENTES DEL USUARIO (acciones fuera del código)

1. **Correr `db/06_datos_empresa.sql`** en el SQL Editor de Supabase — HECHO
   (confirmó "Success. No rows returned"). Los 01..05 también ya corridos.
2. **Activar la lectura con IA (2 pasos):**
   - Crear API key en **console.anthropic.com** (con saldo; ~$5 USD basta).
   - En Netlify → Site configuration → Environment variables → agregar
     `ANTHROPIC_API_KEY` = la llave `sk-ant-...` → redeploy.
   - Hasta que haga esto, el botón "Leer datos con IA" dará error.
3. **Supabase Free se pausa** tras ~7 días sin uso (plan gratis). Se
   despierta con "Resume project". A futuro: Supabase Pro (~$25/mes) no se pausa.
4. **Borrar ramas ajenas en GitHub** (el asistente NO puede borrar ramas en
   este entorno): en la web de GitHub → Branches → bote de basura. Eran de
   otros proyectos (Hotel Costeño, Defensa Bélgica, Cuestionario GODOGG,
   Infografías notario). `main` está limpio.

---

## 6. Decisiones tomadas (y por qué)

- **Camino incremental** conservando la demo: la demo de ventas se explora
  SIN sesión; guardar datos reales REQUIERE sesión. La misma URL sirve para
  vender y para operar.
- **Login por email** (no WhatsApp): WhatsApp OTP requiere proveedor de paga
  y verificación de negocio → Etapa 3.
- **Claude Haiku** para leer documentos (barato, ~$0.003/doc); configurable a
  Sonnet vía `ANTHROPIC_MODEL` si un documento es difícil.
- **Finiquito/liquidación con FÓRMULAS, no IA:** los cálculos legales
  (aguinaldo, vacaciones, prima vacacional, prima de antigüedad, 90 días, 20
  días/año) se programan en código → gratis, exactos, instantáneos. La IA solo
  redactaría el escrito. Nunca usar IA para la aritmética.

---

## 7. Costos de operación (resumen)

- **Hoy (construyendo):** $0–5 USD/mes (planes gratis + dominio ~$1.25).
- **En producción:** $26–45/mes (Supabase Pro $25 + dominio + IA por uso).
- **Escalado a 4,000 empleados (10 clientes de 400):** $60–110/mes recurrente
  + ~$120 único de IA por leer 40,000 documentos (0.003 c/u).
- **Costo por empleado/mes:** ~$0.02 USD. Se paga por infraestructura, no por
  empleado → margen enorme.
- Vigilar: almacenamiento (100 GB incluidos en Pro; 40k docs ≈ 80 GB),
  ancho de banda, y poner límite de gasto en Anthropic.

---

## 8. PRÓXIMOS PASOS (lo que sigue por construir)

En orden sugerido:

1. **Calculadora de finiquito y liquidación (SIN IA).** Que la app haga
   preguntas (fecha de ingreso, fecha de baja, salario diario, si fue
   despido justificado o no, vacaciones pendientes…) y calcule con fórmulas
   de la LFT: finiquito (aguinaldo proporcional, vacaciones proporcionales +
   prima vacacional 25%, días trabajados) y, si aplica liquidación (despido
   injustificado): 3 meses (90 días), 20 días por año, prima de antigüedad
   (12 días/año topada a 2× salario mínimo), parte proporcional. Guardar el
   resultado en el expediente del trabajador. **Alto valor, costo $0.**
2. **Actas administrativas / avisos de rescisión mejorados con IA.** El
   patrón escribe un borrador y la IA lo convierte en un acta formal con
   "tiempo, modo y lugar" ultra específico (Haiku). Guardar en el expediente.
3. **Guardar el contrato generado** en la BD (tabla `contracts` + hash),
   no solo imprimirlo.
4. **Más tipos de contrato** (determinado, prueba, por obra, temporada):
   el usuario tiene los machotes; se agregan al motor como el indeterminado.
5. **Métricas reales** en el panel (contar trabajadores/eventos reales de la
   empresa, hoy muestran cifras de la demo con sesión).
6. **Checador electrónico** real (entrada/salida con foto y geolocalización).
7. **Exportación forense** (expediente consolidado en PDF con hashes).

**Etapa 3 (más adelante):** login por WhatsApp, firma con validez NOM-151
(requiere PSC autorizado), validación facial real, respaldos automáticos
propios del usuario, migración a servidor propio si se desea (todo el stack
es portable: Postgres + archivos estándar).

---

## 9. Machote de contrato indeterminado

El usuario subió su machote real de **contrato individual por tiempo
indeterminado** (declaraciones + 21 cláusulas + confidencialidad +
beneficiarios + aviso de privacidad). Ya está convertido en plantilla dentro
de `contratos.js` (`_plantillaIndeterminado`). Tiene más machotes por
compartir (determinado, prueba, por obra) para sumar al motor.
