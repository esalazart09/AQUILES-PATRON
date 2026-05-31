# AQUILES Patrón — Plan de la Etapa 2 (Backend real)

> Documento vivo. Aquí queda por escrito CÓMO vamos a convertir la demo en un
> producto real que guarda datos. Pensado para leerse desde el celular o la
> tablet. Si algo cambia, se actualiza este archivo.

---

## 0. Principio rector (lo que vende el producto)

El valor de AQUILES Patrón es **"todo en uno"**: expediente, actas
administrativas, checador electrónico, contratos automáticos y exportación
forense, **todo funcionando junto** para eficientar los procesos del patrón.

Por eso la Etapa 2 **no termina hasta que los 6 flujos guardan datos reales**.
Un producto que solo hace una cosa no es vendible.

**Incremental = el orden en que construimos, NO el alcance final.**
Hacemos un flujo completo de punta a punta primero, solo para probar que la
plataforma sirve; luego repetimos ese patrón ya probado en los demás, más
rápido y con menos riesgo.

---

## 1. La arquitectura elegida (Camino A — incremental)

| Pieza | Herramienta | Por qué |
|---|---|---|
| Lo que se ve (frontend) | La demo actual (HTML/CSS/JS) + librería de Supabase por CDN | Reusa todo lo hecho, sin "compilación", baja curva |
| Base de datos | **Supabase** (PostgreSQL) | Todo-en-uno, gratis para arrancar |
| Cuentas / login | **Supabase Auth** | Incluido |
| Archivos (fotos, PDFs) | **Supabase Storage** | Incluido |
| Hash SHA-256 real | **Web Crypto API** del navegador | Gratis, sin servidor |
| PDF real | Por definir (jsPDF en navegador o función de servidor) | Se decide en su fase |
| Publicación | **Netlify** (ya conectado, deploy automático) | Ya funciona |

**Costo:** arranca en **$0**. Cuando crezca, ~**$25 USD/mes** (Supabase Pro).
Dentro de tu presupuesto.

---

## 2. Modelo de datos (las "tablas" donde se guarda todo)

Cada empresa cliente es un espacio aislado (multi-tenant) — una empresa NUNCA
ve datos de otra. Esto se logra con "Row Level Security" de Supabase.

- **companies** — cada empresa cliente (ej. DIEZ Creatividad Impresa).
- **profiles** — usuarios del sistema, con rol (supervisor / administrador),
  ligados a su empresa.
- **employees** — los trabajadores de cada empresa.
- **events** — eventos/faltas laborales (el flujo del supervisor). Incluye
  tipo, artículo LFT, evidencia, firma/negativa, **hash real** y sello de tiempo.
- **actas** — actas administrativas, con manifestación del trabajador, firmas
  y testigos.
- **contracts** — contratos generados (tipo, trabajador, cláusulas).
- **checadas** — registros de entrada/salida (checador).
- **documents** — archivos subidos (INE, CURP, NSS, fotos, audios), guardados
  en Storage.

---

## 3. Orden de construcción (todas las fases se completan)

- **Fase 0 — Cimientos.** Crear cuenta y proyecto en Supabase, conectar la app.
  *(Tú creas la cuenta, yo conecto el código y armo las tablas.)*
- **Fase 1 — Rebanada de prueba.** Login real + el flujo "registro de evento"
  guardando de verdad, con hash real, visible en el panel del admin.
  *Esto prueba que toda la plataforma funciona de punta a punta.*
- **Fase 2 — Empleados y expediente** real (alta de trabajadores, expediente
  con datos reales).
- **Fase 3 — Checador** real (entrada/salida con foto y geolocalización reales).
- **Fase 4 — Contratos automáticos** (motor de plantillas con tus machotes y
  autollenado real). *Necesito tus machotes y consejos contextuales.*
- **Fase 5 — Actas administrativas** reales (con firmas guardadas).
- **Fase 6 — Hash real en todo + exportación PDF real** con plantilla legal.
- **Fase 7 — Pulido multi-tenant** y preparación para los primeros clientes.

Al terminar la Fase 6, el producto ya es **"todo en uno" y vendible**.

---

## 4. Qué necesito de ti (Emiliano)

1. **Crear la cuenta de Supabase** (te guío paso a paso; son tus credenciales).
2. **Tus machotes (plantillas) de contratos** — para la Fase 4.
3. **Los consejos contextuales** de cada tipo de contrato — para la Fase 4.
4. **Decisiones de criterio legal** cuando surjan (no las invento por ti).

---

## 5. Lo que NO prometemos todavía (honestidad)

- **Login por WhatsApp:** requiere un proveedor de paga (Twilio o WhatsApp
  Cloud API) y verificación de negocio, que tarda. **Arrancamos con login por
  email** (gratis e inmediato) y WhatsApp queda para más adelante (Etapa 3).
- **Firma con validez legal plena (NOM-151):** necesita un Prestador de
  Servicios de Certificación autorizado (servicio externo de paga). Va en la
  Etapa 3. Hasta entonces, el flujo de firma sigue siendo visual.
- **Validación facial real:** Etapa 3.

---

*Plan acordado al inicio de la Etapa 2. La demo sigue viva en
https://aquilespatron.netlify.app/*
