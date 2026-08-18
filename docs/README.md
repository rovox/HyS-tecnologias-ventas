# Documentación — H&S Tecnologías ERP

Índice modular del repositorio. Cada carpeta cubre un dominio distinto para que producto, diseño y desarrollo puedan consultar solo lo que necesitan.

## Mapa de lectura

| Si necesitas… | Empieza aquí |
|---------------|--------------|
| Instalar y correr el frontend localmente | [getting-started/local-development.md](./getting-started/local-development.md) |
| Cuentas demo y roles | [getting-started/demo-accounts.md](./getting-started/demo-accounts.md) |
| Manual de diseño (web + mobile) | [design/design-system-manual.md](./design/design-system-manual.md) |
| Reglas operativas por sección | [operations/README.md](./operations/README.md) |
| Dashboards según rol | [operations/dashboards-by-role.md](./operations/dashboards-by-role.md) |
| Cruce de datos entre módulos | [operations/data-crossing.md](./operations/data-crossing.md) |
| Arquitectura del POC frontend | [architecture/frontend-poc.md](./architecture/frontend-poc.md) |
| Contrato futuro con NestJS | [migration/frontend-backend-contract.md](./migration/frontend-backend-contract.md) |
| Plan API cotizaciones y ventas | [migration/api-quotations-sales.md](./migration/api-quotations-sales.md) |
| Modelo MySQL (microservicios) | [migration/microservice-model.md](./migration/microservice-model.md) |
| Estado del backend | [migration/backend-status.md](./migration/backend-status.md) |
| Deploy en Hostinger | [deployment/hostinger-frontend.md](./deployment/hostinger-frontend.md) |

## Estructura

```
docs/
├── README.md                 ← este índice
├── getting-started/          ← instalación, pnpm, cuentas demo
├── design/                   ← sistema de diseño (fuente: DESIGN.md)
├── operations/               ← flujos, reglas, dashboards por rol
│   └── flows/                ← un documento por área operativa
├── architecture/             ← arquitectura técnica del POC
├── migration/                ← contrato API y estado del backend
└── deployment/               ← Hostinger y CD
```

## Fuente de verdad de diseño

Los tokens de color, tipografía y espaciado oficiales están en [`DESIGN.md`](../DESIGN.md) (raíz del repo). El manual en [`design/`](./design/) lo expande con reglas de implementación web/mobile y patrones de componentes.

## Milestone actual

**Frontend POC** — UI completa con datos ficticios en memoria. No requiere PocketBase ni NestJS en runtime. Ver [architecture/frontend-poc.md](./architecture/frontend-poc.md).

## Documentación legacy en código

Existen notas históricas bajo `apps/web/src/*.md` (auditorías, checklists). La documentación canónica vive en `docs/`; los archivos en `src/` se mantienen como referencia de auditoría hasta consolidarse.
