---
name: H&S Tecnologías ERP
colors:
  # Marca y estructura
  primary: '#001838'            # navy: navegación, títulos, botón principal
  primary-container: '#002b5c'
  primary-fixed: '#d6e4ff'      # fondo de filas de grupo y etapas
  on-primary-fixed: '#00193d'
  brand-green: '#2e6b00'        # verde de marca (secondary): logotipo, acentos de marca
  brand-green-bright: '#77ff00' # solo botón "acción" y acentos puntuales
  background: '#fafbff'
  foreground: '#0c1d31'
  card: '#ffffff'
  muted: '#f1f5f9'
  muted-foreground: '#65758b'
  border: '#e1e7ef'
  row-stripe: '#f4f6fb'
  row-hover: '#e1eefe'
  # Paleta narrativa: solid / soft (fondo) / fg (texto) / border
  danger: '#ba1c1c'
  danger-soft: '#fee6e6'
  danger-fg: '#8e1515'
  danger-border: '#f6acac'
  warning: '#db7706'
  warning-soft: '#fff5d6'
  warning-fg: '#843b0b'
  warning-border: '#fbcb6a'
  success: '#157f3c'
  success-soft: '#dbfae6'
  success-fg: '#145c30'
  success-border: '#85e0a6'
  info: '#1555e0'
  info-soft: '#e1eefe'
  info-fg: '#1c3e9c'
  info-border: '#9ec6fa'
  progress: '#6b26d9'
  progress-soft: '#f5ebff'
  progress-fg: '#5222a0'
  progress-border: '#d2b4f9'
  neutral: '#566376'
  neutral-soft: '#e7ecf3'
  neutral-fg: '#344256'
  neutral-border: '#bfcad9'
typography:
  family: Inter
  page-title: { fontSize: 24px, fontWeight: '700', lineHeight: 32px }
  section-title: { fontSize: 16px, fontWeight: '600', lineHeight: 24px }
  body: { fontSize: 14px, fontWeight: '400', lineHeight: 20px }
  label: { fontSize: 12px, fontWeight: '600', lineHeight: 16px }
  table-header: { fontSize: 12px, fontWeight: '600', lineHeight: 16px, textTransform: uppercase, letterSpacing: 0.04em }
  number: { fontSize: 14px, fontWeight: '600', fontVariantNumeric: tabular-nums }
  kpi: { fontSize: 28px, fontWeight: '800', fontVariantNumeric: tabular-nums }
rounded:
  sm: 0.5rem
  md: 0.625rem
  lg: 0.75rem
spacing:
  container-max: 1440px
  gutter-mobile: 16px
  gutter-desktop: 32px
  scale: [4px, 8px, 12px, 16px, 24px, 40px]
  touch-target: 44px
---

# Sistema de diseño — ERP H&S Tecnologías

Este archivo es la **única fuente** de colores, tipografía y patrones de pantalla. El código los implementa en
`apps/web/src/index.css` (variables), `apps/web/tailwind.config.js` (clases), `apps/web/src/shared/lib/status.js`
(estados) y `apps/web/src/shared/views/*` (componentes). Si algo aquí y el código no coinciden, se corrige el código
o este archivo en el mismo commit.

## 1. Principios

1. **El color cuenta algo.** Un color nunca decora: dice si algo está bien, mal, esperando o en curso (§2).
2. **Lo importante se ve primero.** Saldos adeudados, vencidos, observados y faltantes llevan color y peso; lo demás
   es texto normal.
3. **Una acción, un clic.** Las acciones frecuentes son botones visibles en la fila o en la cabecera (§6.4); el menú
   ⋯ es solo para lo raro.
4. **Sin sorpresas.** Toda acción que borra, anula o mueve dinero dice qué registro toca y qué va a cambiar antes de
   confirmar (§6.6), y deja rastro en el historial.
5. **Datos reales, lenguaje del negocio.** Etiquetas "campo: valor"; nunca separadores "·" para unir datos
   distintos, ni códigos técnicos sin contexto.

## 2. Paleta narrativa

Seis tonos. Cada uno tiene cinco variables: `--<tono>` (sólido), `--<tono>-foreground` (texto sobre el sólido),
`--<tono>-soft` (fondo suave), `--<tono>-fg` (texto sobre el suave o sobre blanco), `--<tono>-border`. En Tailwind:
`bg-danger`, `bg-danger-soft`, `text-danger-fg`, `border-danger-border`…

| Tono | Significa | Ejemplos |
|---|---|---|
| **danger** (rojo) | Error, alerta que hay que mencionar, algo que falta o se debe | Saldo adeudado, observado, rechazado, vencido hace días, stock bajo, sin técnico, margen negativo, trabajo cancelado |
| **warning** (ámbar) | Espera a alguien; hay que actuar pronto | Por validar, solicitado, pendiente, por vencer (≤ 3 días), reembolso pendiente, dinero por rendir |
| **success** (verde) | Confirmado, validado, terminado, cobrado | Validado, en caja, aprobada, terminado, entregado, garantía vigente, ingreso (+) |
| **info** (azul) | Programado, enviado, informativo | Programado, enviada, planificado, filtros activos |
| **progress** (violeta) | Alguien lo está trabajando | En proceso, en ejecución, en preparación, servicio en curso, agrupación activa |
| **neutral** (gris) | Borrador, anulado, archivado: ya no cuenta | Borrador, anulado (tachado), archivado, cerrado |

Reglas:
- Badge de estado = fondo `soft` + texto `fg` + borde `border` + **icono** (nunca solo color: también lo leen
  daltónicos y la impresión en blanco y negro).
- Montos: ingreso `text-success-fg` con "+", egreso y saldo adeudado `text-danger-fg` con "−", cero en
  `text-muted-foreground`.
- Una tarjeta de calendario se pinta entera con el tono de su estado (fondo `soft`, borde izquierdo `solid`). La
  división (Cómputo, Seguridad, Cableado) es una etiqueta de texto con icono, **sin color propio**, para no competir
  con el estado.
- Los tonos se usan solo con su significado. El navy (`primary`) es estructura (menú, títulos, botón principal); el
  verde de marca (`secondary`) es identidad, no "éxito".
- Contraste comprobado (WCAG AA): `fg` sobre `soft` ≥ 7:1; blanco sobre el sólido ≥ 5:1 salvo `warning`, que usa
  texto oscuro (`--warning-foreground`). Una pareja nueva se mide antes de usarla.
- No hay modo oscuro.

## 3. Estados (registro único)

Todos los estados viven en `apps/web/src/shared/lib/status.js` (`STATUS[entidad][estado] = { label, tone, icon,
strike }`) y se dibujan con `<StatusBadge entity state />`. Las etiquetas del historial, los filtros y la barra de
estado (`<StatusBar entity>`, que pinta la etapa actual con su tono) salen del mismo registro. Un estado desconocido
se muestra tal cual en gris: nunca se oculta.

| Entidad | Estados → tono |
|---|---|
| quotation | borrador neutral · enviada info · aprobada success · rechazada danger · vencida warning · eliminada neutral tachada |
| project | planificado info · en ejecución progress · entregado success · cerrado neutral · anulado neutral tachado |
| job | programado info · en proceso progress · terminado success · cancelado danger tachado |
| movement | por validar warning · validado success · observado danger · anulado neutral tachado |
| order | solicitado warning · aprobado info · en preparación / listo progress · entregado success · rechazado danger · cancelado neutral |
| visit | pendiente warning · programado info · en camino / en atención progress · resuelto success · cancelado neutral |
| lead | nueva warning · contactada info · cliente success · descartada neutral |
| product | activo success · archivado neutral |

Para algo que no es un estado ("Sin técnico", "Stock bajo", "Archivado") se usa `<ToneTag tone icon>`.

## 4. Tipografía

- **Inter** en toda la app (cargada en `index.css`). Cuerpo 14 px.
- Título de página 24 px / 700; título de sección 16 px / 600; etiqueta 12 px / 600.
- Encabezado de tabla 12 px, mayúsculas, 600, `text-muted-foreground`.
- Números y montos: `tabular-nums`, 600, alineados a la derecha. KPI del dashboard 28 px / 800.
- Etiqueta vs. valor: la etiqueta en `text-muted-foreground` 12 px, el valor en 14 px `text-foreground`.

## 5. Superficies y espacio

- Fondo de la app `background`; tarjetas y tablas en blanco (`card`) con borde `border` de 1 px; sombras solo en
  elementos flotantes (menús, diálogos, popovers).
- Escala de espacio 4 · 8 · 12 · 16 · 24 · 40 px. Margen lateral 16 px en teléfono, 32 px en escritorio; contenido
  hasta 1440 px.
- Radio (`--radius` = 12 px): 10 px badges, chips, botones e inputs (`rounded-md`); 12 px tarjetas y diálogos (`rounded-lg`).
- Objetivos táctiles ≥ 44 px (`min-h-11`) en teléfono. Sin desplazamiento horizontal de la página a 360 px.

## 6. Componentes

### 6.1 Tablas (`ListView`)
- **Filas alternadas** (`bg-row-stripe` en las pares) y hover `bg-row-hover` cuando la fila abre algo.
- **Columna `#`** a la izquierda con el número de fila, como Excel; con agrupación, la numeración sigue dentro de
  cada grupo.
- Fila de grupo en `primary-fixed` con su conteo; subtotal y total al pie en `muted`, en negrita.
- Una fila puede llevar un borde izquierdo de tono (`tone(row)`) para señalar vencidos u observados.
- En teléfono, tarjetas (`renderCard`) con los mismos colores.

### 6.2 Panel de control (`ControlPanel`)
- Breadcrumb, acción principal, buscador, filtros, agrupación, vistas y exportar CSV.
- **Buscador**: `type="search"`, botón × visible para borrar todo y `Esc` borra.
- Chip de filtro activo en tono info; chip de agrupación en tono progress; ambos con × para quitarlos.
- Contadores en los filtros que importan ("Archivados (3)", "Sin técnico (2)") con el tono de su significado.

### 6.3 Combobox con búsqueda (`SearchSelect`)
- Toda lista que pueda pasar de ~8 opciones (clientes, productos, proyectos, trabajos, usuarios, técnicos) se elige
  escribiendo: Popover + búsqueda (cmdk), resultado resaltado, "Sin resultados", opción para limpiar.
- Las listas cortas y fijas (sucursal, caja, método de pago, prioridad) siguen como `<select>`.

### 6.4 Acciones rápidas (`RowQuickActions`)
- Botones de icono con tooltip en la propia fila: ✓ (success), ✗ (danger), ✎ editar, ⋯ más.
- Después de cada acción, el aviso ofrece el siguiente paso: "Ver proyecto", "Registrar otro", "Deshacer" cuando
  existe.

### 6.5 Botones
- Principal: navy (`bg-primary`), uno por vista.
- Confirmar / guardar en un diálogo: principal. Acción positiva destacada ("Validar", "Registrar cobro"): `success`.
- Destructiva (anular, eliminar, rechazar): `danger`, siempre con confirmación.
- Secundaria: borde `border`, fondo blanco. Siempre con texto; solo icono en las acciones rápidas de fila (con
  tooltip y `aria-label`).

### 6.6 Confirmaciones con detalle (`useConfirm`)
- Título con la acción y el registro ("¿Anular el cobro de Bs 500 de PRY-0004?").
- Lista "campo: valor" del registro afectado (`details`) y el **efecto** (`effect`): "La Caja Central baja de
  Bs 5.200 a Bs 4.700", "El proyecto vuelve a deber Bs 500".
- Motivo obligatorio cuando la acción lo exige (anular, observar, rechazar, cancelar, ajustar).

### 6.7 Formularios
- Cada campo con etiqueta visible arriba; nunca un placeholder como única etiqueta.
- Un dato que no se puede cambiar se muestra como texto ("Producto: Cámara IP 4 MP"), no como input deshabilitado.
- Ubicación (`LocationField`): dirección + link opcional (Google Maps, Waze o cualquier URL) que se abre con
  "Abrir ubicación".
- Errores en `text-danger-fg` debajo del campo; el botón de guardar dice qué falta.

### 6.8 Archivos (`FilePreview`)
- Imágenes: se guardan en WebP; miniaturas en galería; al abrir, vista grande con "Descargar (JPG)".
- PDF: se ven dentro de la app (visor del navegador en un diálogo) con "Abrir en pestaña" y "Descargar".

### 6.9 Historial (`Chatter`)
- Cada registro muestra debajo quién hizo qué y cuándo, con "campo: antes → después" y el motivo de las acciones
  que lo piden. Se actualiza en vivo.

## 7. Patrones de vista

| Vista | Estructura |
|---|---|
| **Lista** | `ControlPanel` + `ListView`/`KanbanView`; totales al pie; filtros y búsqueda en la URL |
| **Ficha** | `FormView`: acciones + `StatusBar` arriba, botones inteligentes (enlaces con número), campos "etiqueta: valor", pestañas, `Chatter` |
| **Bandeja** | lista de lo que espera una acción, con ✓/✗ en la fila y contador en la pestaña |
| **Calendario** | tarjetas pintadas por estado, leyenda de estados, panel lateral con todas las acciones |
| **Dashboard** | acciones rápidas → "requiere atención" (contadores danger/warning) → indicadores → actividad; cada tarjeta abre la lista que suma su cifra |

## 8. Tiempo real

Toda vista que muestra datos se actualiza sola cuando otro usuario cambia algo (`RealtimeProvider`). No hay botón
"recargar" ni datos viejos después de una acción: si una vista no se actualiza en vivo, es un error.

## 9. Checklist de una pantalla

- [ ] Estados con `StatusBadge`; colores solo de §2; 0 clases de paleta cruda (`bg-blue-600`) y 0 hex.
- [ ] Tabla con filas alternadas y numeradas, montos con signo y color, totales.
- [ ] Buscador con botón ×; combobox con búsqueda en listas largas.
- [ ] Acciones frecuentes visibles; confirmaciones con detalle y efecto.
- [ ] Etiquetas "campo: valor"; sin "·" uniendo datos; sin inputs deshabilitados como texto.
- [ ] Teléfono a 360 px sin scroll horizontal; objetivos ≥ 44 px.
- [ ] Se actualiza en vivo desde otra sesión.

Guía de adaptación a teléfono: [`docs/design/responsive-web-mobile.md`](docs/design/responsive-web-mobile.md).
