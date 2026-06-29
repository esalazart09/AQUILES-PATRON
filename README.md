# AQUILES Patrón

Aplicación web (instalable como PWA) que **captura, fecha, sella y blinda cada
evento laboral relevante en el momento que ocurre**, para construir evidencia con
valor probatorio en juicios laborales en México.

> Una herramienta de **AQUILES Blindaje Corporativo & Laboral**.

## ¿Qué resuelve?

En México, la carga de la prueba en juicios laborales recae en el patrón
(Art. 784 LFT). Las empresas pierden juicios que deberían ganar porque nunca
documentaron en tiempo real las faltas, retardos o incumplimientos. AQUILES
Patrón permite a un supervisor registrar un evento laboral en menos de 60
segundos desde su celular, dejándolo fechado y sellado.

Además, la reforma a la LFT (DOF, 1 de mayo de 2026) obliga, a partir del
1 de enero de 2027, a llevar **registro electrónico de jornada**
(Art. 132 fr. XXXIV LFT).

## Estado actual — Etapa 1 (demo)

- **Un solo archivo:** `index.html` — HTML + CSS + JavaScript puro, sin
  dependencias ni paso de compilación (solo carga Google Fonts por CDN).
- **Demo navegable** de extremo a extremo de los 6 flujos del producto.
- **PWA instalable** en Android e iPhone.
- **En línea:** https://aquilespatron.netlify.app/

> ⚠️ La demo **simula** el sellado criptográfico, la firma electrónica, el
> timestamp NOM-151 y la carga de documentos. Esa funcionalidad real llega en
> la Etapa 2 (backend). Los avisos de "demo" en la interfaz deben conservarse
> hasta que la función real exista.

## Cómo verla en local

No requiere instalación. Abre `index.html` en cualquier navegador, o sírvelo:

```bash
python3 -m http.server 8000
# luego abre http://localhost:8000
```

## Despliegue

Sitio estático en **Netlify** con publicación automática desde GitHub.
La configuración vive en `netlify.toml` (sin build command, publica la raíz).

---

## Sistema de captación de clientes (despacho)

Además del producto, este repo contiene el sistema de marketing y ventas
para conseguir clientes de **AQUILES Blindaje Corporativo & Laboral** en
Colima. Documentos (leer en este orden):

1. **`ESTRATEGIA-MARKETING.md`** — diagnóstico, cliente ideal, embudo,
   rutina diaria, alianzas y plan de 90 días.
2. **`PLAYBOOK-CAPTACION.md`** — el *cómo* exacto: construir y calificar la
   lista, escribir el primer contacto, secuencia de seguimiento y
   contenido de autoridad (destilado de recursos B2B reales).
3. **`PROSPECTOS-COLIMA-LOTE1.md`** y **`PROSPECTOS-COLIMA-LOTE2.md`** —
   20 empresas reales de Colima con teléfono verificado, giro y vía al
   decisor (industria, agroindustria del limón, hotelería, aduanal).
4. **`TRACKER-PROSPECTOS.csv`** — los 20 prospectos listos para importar a
   Google Sheets y dar seguimiento.
5. **`ESTRATEGIA-CIERRE.md`** — cómo cerrarlos, con metodologías probadas
   (SPIN Selling, Challenger Sale, Sandler).
6. **`GUION-DIAGNOSTICO-1PAGINA.md`** — guion imprimible para la reunión de
   diagnóstico con las preguntas listas.
