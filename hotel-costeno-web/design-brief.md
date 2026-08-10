# Design Brief — Hotel Costeño de Colima Website

## Objetivo
Crear una presencia web de alto impacto para el Hotel Costeño de Colima que proyecte imagen de hotel premium, confianza y profesionalismo. El sitio NO es para reservaciones en línea, sino para **presencia de marca y captación de contactos por WhatsApp/teléfono**.

---

## Identidad de Marca

**Nombre completo:** Hotel Costeño de Colima  
**Logotipo:** Montañas con volcán activo (humo/fuego dorado) + tipografía script "Hotel Costeño de Colima"  
**Personalidad:** Elegante · Cálido · Natural · Mexicano · Acogedor · Confiable  
**Tono:** Sofisticado pero cercano, como un hotel boutique de 4 estrellas en una ciudad colonial mexicana.

### Paleta de Colores
| Token        | Color     | Uso                          |
|-------------|-----------|------------------------------|
| `--brown`   | `#5C3D1E` | Color principal logo         |
| `--brown-dark` | `#3E2A12` | Navbar, footer, oscuro       |
| `--green`   | `#3D6B35` | Acento secundario, naturaleza|
| `--gold`    | `#C9962E` | Acentos premium, CTAs        |
| `--gold-light` | `#E4B84A` | Hover, detalles dorados    |
| `--cream`   | `#F8F4E8` | Fondos sección clara         |
| `--white`   | `#FFFFFF` | Fondos limpios               |

### Tipografías
- **Playfair Display** (Google Fonts) — Headings, precios, elementos serif de lujo
- **Lato** (Google Fonts) — Body text, UI, descriptores
- **Cormorant Garamond** (Google Fonts) — Subtítulos hero, cursiva elegante

---

## Estructura del Sitio (Single Page)

### 1. Navbar Fija
- Logo SVG del hotel (montañas + texto)
- Links: Nosotros · Habitaciones · Alberca · Restaurante · Eventos · Contacto
- CTA primario dorado "Contacto"
- Efecto glassmorphism marrón oscuro al hacer scroll
- Hamburger menu responsive

### 2. Hero (100vh)
- Imagen de fondo: alberca tropical con palmeras y edificio blanco
- Overlay: gradiente oscuro marrón-verde
- Tagline: etiqueta "Colima, México"
- H1: "Hotel / *Costeño*" (énfasis en cursiva dorada)
- Subtítulo cursiva: "Descanso hecho a la medida"
- CTAs: "Reservar ahora (WhatsApp)" + "Ver habitaciones"
- Flecha de scroll animada

### 3. Stats Bar (fondo marrón oscuro)
- 7+ Tipos de habitación
- 2 Albercas  
- 1 Restaurante
- ∞ Momentos especiales

### 4. Nosotros (fondo crema)
- Grid 2 columnas: imágenes (main + secondary superpuestas) + texto
- Texto descriptivo del hotel
- Features en grid: WiFi, A/C, estacionamiento, restaurante, alberca, salas de juntas

### 5. Habitaciones (fondo blanco)
- Grid 3 columnas de tarjetas
- 6 tipos de habitación con precios desde
- Badges "Remodelada" en dorado
- Nota: precios a consultar para tarifas actualizadas

**Tipos y precios:**
| Habitación | Precio/noche |
|-----------|-------------|
| 3 Camas Matrimoniales Remodelada | $850 |
| 2 Camas Matrimoniales Remodelada | $850 |
| 2 Camas Matrimoniales | $770 |
| 1 Cama Matrimonial | $700 |
| 2 Camas Individuales Remodeladas | $700 |
| 2 Camas Individuales | $650 |
| 5 Camas Individuales | $770 |

> Nota: precios desactualizados, se muestran como referencia.

### 6. Alberca & Membresías (fondo oscuro con imagen)
- Grid 3 columnas de planes
- Plan semanal destacado (featured)
- Membresías:
  - Por Día: $70.00 (2 hrs/día) — Alberca + regaderas + estacionamiento
  - Por Semana: $400.00 (2 hrs/día) — mismos beneficios
  - Por Mes: $1,500.00 (2 hrs/día) — mismos beneficios
- Contacto para información: 312 113 4148

### 7. Restaurante (fondo crema)
- Layout 2 columnas: izq=info+menú tabs / der=fotos
- Info: Horario 08:00–16:00, Tel: 312-310-0660, IVA incluido
- Menú en tabs: Desayunos / Antojitos / Corral & Mar / Bebidas
- Fotos del restaurante y platillos

**Menú completo incluido** (ver `index.html` para el listado completo de precios)

### 8. Galería Strip
- Grid asimétrico: 1 imagen grande + 6 pequeñas en 2 filas
- Hover zoom effect

### 9. Eventos & Reuniones (fondo blanco)
- Grid 2 columnas: fotos izq / texto der
- Espacios: Sala de Juntas, Auditorio, Jardín
- Feature cards con iconos
- CTA "Cotizar evento"

### 10. Contacto (fondo marrón oscuro)
- Grid 2 columnas: info + mapa
- Reservaciones:
  - WhatsApp: 312 113 4148
  - Teléfono: 312 690 0991
  - Email: hotelcostenoreservaciones@hotmail.com
  - Facebook: Hotel Costeño de Colima
  - Instagram: @hotelcostenodecolima
- Restaurante: 312-310-0660 | 08:00–16:00
- Dirección: Blvd. Carlos de la Madrid Béjar #1001, Col. El Tecolote, Colima, Col. C.P. 28090
- Mapa embebido o enlace a Google Maps

### 11. Footer
- Logo reducido + links de navegación
- Copyright
- RTN: 206010238902R.E.T.02007COLRB · 03.2026

### 12. WhatsApp Float Button
- Botón circular verde fijo (bottom-right)
- Animación pulse
- Enlace: wa.me/523121134148

---

## Funcionalidades JS
1. Scroll reveal (IntersectionObserver) — elementos aparecen al hacer scroll
2. Navbar con efecto glassmorphism al scroll
3. Mobile menu hamburger
4. Tab switcher para el menú del restaurante
5. Animación bounce en flecha hero

---

## Assets a Reemplazar
Las imágenes actuales son placeholders de Unsplash. Reemplazar con:
- Fotos reales de la alberca del hotel (páginas 1, 3, 4, 5 del PDF)
- Foto interior del restaurante (página 6)
- Foto sala de juntas (páginas 7, 8)
- Foto de taza de café con logo (página 9)
- Foto de habitación (página 10)
- Logo oficial del hotel (páginas 7, 10, 11, 12 del PDF)

---

## SEO & Meta
- Título: "Hotel Costeño de Colima — Descanso hecho a la medida"
- Descripción: "Hotel Costeño de Colima. Amplia alberca, restaurante, salas de juntas, aire acondicionado y estacionamiento cubierto en el corazón de Colima."
- Idioma: Español (México)

---

## Instrucciones para Claude Design
1. Toma este archivo `index.html` como base funcional completa
2. Mantén la paleta de colores y tipografías definidas
3. Los datos de contacto, precios y menú son REALES — no modificar
4. Prioriza la versión móvil (60%+ del tráfico esperado)
5. El botón flotante de WhatsApp es elemento crítico — siempre visible
6. La sección de restaurante con tabs debe funcionar sin dependencias externas
7. Añadir meta OG tags para sharing en redes sociales
8. Optimizar imágenes para web (WebP preferido)
