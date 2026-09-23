# Cruce de datos entre módulos

Mapa de entidades, relaciones y puntos de integración. En el POC los datos viven en `apps/web/src/mocks/store.js`; en producción serán tablas MySQL vía Prisma.

---

## Diagrama de entidades

```
                    ┌─────────────┐
                    │   users     │
                    │ (roles)     │
                    └──────┬──────┘
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
  ┌─────────────┐   ┌─────────────┐   ┌─────────────┐
  │  clientes   │   │ salesperson │   │ sucursales  │
  │             │   │   _goals    │   │             │
  └──────┬──────┘   └─────────────┘   └──────┬──────┘
         │                                    │
         │         ┌──────────────────────────┘
         ▼         ▼
  ┌─────────────────────┐      ┌─────────────────────┐
  │ visitas_tecnicas    │      │    quotations       │
  │ (relevamiento/      │─────▶│  (commercial)       │
  │  asistencia)        │ req. │                     │
  └──────────┬──────────┘ cot. └──────────┬──────────┘
             │                             │ convertToSchedule
             │                             ▼
             │                  ┌─────────────────────┐
             └─────────────────▶│     schedules       │
                                │ (trabajos/cronograma)│
                                └──────────┬──────────┘
                                           │
              ┌────────────────────────────┼────────────────────────────┐
              ▼                            ▼                            ▼
   ┌──────────────────┐        ┌──────────────────┐        ┌──────────────────┐
   │ pedidos_internos │        │ schedule_payments│        │  costos_trabajo  │
   │ (cronograma_id)  │        │                  │        │                  │
   └──────────────────┘        └──────────────────┘        └──────────────────┘
              │                            │                            │
              └────────────────────────────┼────────────────────────────┘
                                           ▼
                                ┌─────────────────────┐
                                │ finanzas / reportes │
                                └─────────────────────┘
```

---

## Relaciones clave

| Desde | Campo | Hacia | Significado |
|-------|-------|-------|-------------|
| `quotations` | `cliente_id` | `clientes.id` | Cotización para cliente |
| `quotations` | `vendedor_id` | `users.id` | Responsable comercial |
| `quotations` | `schedule_id` | `schedules.id` | Trabajo generado al convertir |
| `schedules` | `cliente_id` | `clientes.id` | Trabajo en sitio del cliente |
| `schedules` | `vendedor_responsable_id` | `users.id` | Ventas que cerró/planificó |
| `schedules` | `tecnico_responsable_id` | `users.id` | Técnico asignado |
| `schedules` | `quotation_id` | `quotations.id` | Origen comercial |
| `schedules` | `tipo` | — | `seguridad` \| `proyectos` (calendar events) |
| `schedule_payments` | `scheduleId` | `schedules.id` | Adelanto / cobro / extra_asistencia |
| `schedule_payments` | `tipo` | — | `adelanto`\|`cobro` reduce saldo; `extra_asistencia` does **not** |
| `pedidos_internos` | `cronograma_id` | `schedules.id` | Materiales para un trabajo |
| `relevamientos` | `cotizacionId` | `quotations.id` | Visita ligada a cotización |
| `relevamientos` | `estado` / `prioridad` | — | Nest tokens; resolve requires photo |

---

## Flujos de cruce

### 1. Relevamiento → Cotización

1. Ventas crea visita en `/surveys` con `tipo_visita = Relevamiento`
2. Marca `requiere_cotizacion = true`
3. Al resolver, datos de necesidad alimentan nueva cotización en `/quotations`
4. **Trazabilidad:** idealmente `quotation.visita_id` (extensión futura)

### 2. Cotización → Cronograma

1. Cotización comercial pasa a `aceptada`
2. Acción `convertToSchedule` (`quotationsService`)
3. Crea `schedules` en estado `programado` con monto, cliente, vendedor
4. Cotización pasa a `convertida` con `schedule_id`

### 3. Cronograma → Pedido interno

1. Técnico abre detalle de trabajo
2. Crea pedido interno tipo "Para trabajo" vinculado a `cronograma_id`
3. Admin/ventas aprueba → preparación → entrega
4. Costo puede reflejarse en `costos_trabajo` / panel admin

### 4. Cronograma → Finanzas (ledger Nest)

1. `POST /api/schedules/:id/payments` with `tipo` `adelanto` \| `cobro` \| `extra_asistencia`
2. Nest recalculates `Schedule.adelanto` / `saldo` only from `adelanto`+`cobro`
3. `extra_asistencia` is stored and shown as “fuera de presupuesto”; it does not reduce installation saldo
4. Large `/finanzas` UI remains frozen; operational money for jobs uses this Nest ledger

### 5. Cliente → Historial unificado

En `/clientes/:id` se consolidan:

- Cotizaciones del cliente
- Trabajos / asistencias / relevamientos
- Timeline comercial

---

## Agregaciones del dashboard

| Widget | Colecciones consultadas | Cruce |
|--------|-------------------------|-------|
| Metas comerciales | `schedules`, `salesperson_goals` | Suma `monto` terminados vs meta |
| Ranking vendedores | `schedules`, `users`, `salesperson_goals` | Match por nombre/id vendedor |
| Cronograma semanal | `schedules` | Filtro por rango de fechas |
| Pedidos internos | `pedidos_internos`, `schedules`, `users` | Join por `cronograma_id` |
| Muro actividad | `actividad_interna`, `users` | Autor y rol |

---

## Servicios como contrato

Los servicios en `apps/web/src/services/` definen la API interna que NestJS debe implementar:

| Servicio | Entidades |
|----------|-----------|
| `authService` | users, tokens |
| `clientsService` | clientes |
| `quotationsService` | quotations, quotation_categories |
| `schedulesService` | schedules, payments, observations |
| `ordersService` | pedidos_internos |
| `financeService` | movimientos, cajas, gastos |
| `reportsService` | agregaciones cross-collection |

Ver [migration/frontend-backend-contract.md](../migration/frontend-backend-contract.md).

---

## Reglas de integridad (objetivo producción)

1. No eliminar cliente con trabajos activos
2. No convertir cotización sin estado `aceptada`
3. Pedido "Para trabajo" requiere `cronograma_id` válido
4. Transiciones de estado según [state-machines.md](./state-machines.md)
5. Pagos no pueden exceder `monto` del trabajo (validación futura)

---

## POC vs producción

| Aspecto | POC | Producción |
|---------|-----|------------|
| Persistencia | Memoria de sesión | MySQL |
| Joins | Filtros en JS | SQL / Prisma |
| Auditoría | Parcial | `historial_actividad` completo |
| Archivos | Mock | Storage S3/Hostinger |
