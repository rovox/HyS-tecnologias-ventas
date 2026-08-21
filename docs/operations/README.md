# Operaciones — índice

Reglas de negocio, flujos operativos y cruce de datos entre módulos del ERP H&S Tecnologías.

## Documentos transversales

| Documento | Descripción |
|-----------|-------------|
| [operational-groups.md](./operational-groups.md) | Grupos (ventas, técnicos, finanzas, admin) y permisos |
| [dashboards-by-role.md](./dashboards-by-role.md) | Qué debe ver cada rol en su panel principal |
| [data-crossing.md](./data-crossing.md) | Cómo se relacionan clientes, cotizaciones, cronograma, finanzas |
| [state-machines.md](./state-machines.md) | Máquinas de estado canónicas |

## Flujos por sección

| Área | Documento | Responsable principal |
|------|-----------|----------------------|
| Ventas | [flows/ventas.md](./flows/ventas.md) | VENTAS / ADMINISTRACIÓN |
| Técnicos | [flows/tecnicos.md](./flows/tecnicos.md) | SEGURIDAD ELECTRÓNICA |
| Finanzas | [flows/finanzas.md](./flows/finanzas.md) | Contadora |
| Administrador | [flows/administrador.md](./flows/administrador.md) | ADMINISTRADOR |
| Clientes y cotizaciones | [flows/clientes-y-cotizaciones.md](./flows/clientes-y-cotizaciones.md) | Ventas |
| Cronograma y relevamientos | [flows/cronogramas-y-relevamientos.md](./flows/cronogramas-y-relevamientos.md) | Ventas (planifica) / Técnicos (ejecutan) |
| Pedidos internos | [flows/pedidos-internos.md](./flows/pedidos-internos.md) | Técnicos solicitan / Admin aprueba |
| Marketing | [flows/marketing.md](./flows/marketing.md) | Ventas + Admin |

## Flujo comercial de punta a punta

```
Prospecto / Cliente
    ↓
Relevamiento (visita presencial)     ← Ventas registra necesidad
    ↓
Cotización comercial                 ← Ventas elabora y envía
    ↓ (aceptada)
Conversión a Trabajo / Cronograma    ← Ventas o Admin programan
    ↓
Pedidos internos (materiales)        ← Técnico solicita
    ↓
Ejecución + evidencia                ← Técnico en campo
    ↓
Cobros / Finanzas                    ← Finanzas registra
    ↓
Reportes y dashboard                 ← Todos según rol
```

## Implementación en código

| Concepto | Ubicación |
|----------|-----------|
| Validación de estados | `apps/web/src/hooks/StateFlowValidator.js` |
| Servicios de dominio | `apps/web/src/services/*` |
| Datos mock POC | `apps/web/src/mocks/*` |
| Rutas y roles | `apps/web/src/App.jsx`, `Sidebar.jsx` |
| Dashboard KPIs | `apps/web/src/pages/DashboardPage.jsx` |

## Convenciones

- **Cronograma (planificado):** lo crean y mueven **vendedores** y cargos **administrativos**
- **Ejecución en campo:** responsabilidad de **técnicos** (estados, fotos, observaciones)
- **Relevamiento:** visita presencial del vendedor al cliente; puede derivar en cotización
- **Conversión:** cotización aceptada → trabajo en cronograma (`convertToSchedule`)
