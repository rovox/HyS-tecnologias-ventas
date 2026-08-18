# H&S Tecnologías — ERP Operativo

Monorepo del sistema de gestión para **H&S Tecnologías**: ventas, cronograma de instalaciones, relevamientos, cotizaciones, logística interna y finanzas.

**Milestone actual:** frontend POC con datos ficticios en memoria (sin PocketBase ni NestJS en runtime).

---

## Inicio rápido

Requisitos: **Node.js ≥ 22**, **pnpm ≥ 9** (este repo usa pnpm exclusivamente).

```bash
corepack enable
pnpm install
pnpm dev:web
```

Abrir [http://localhost:3000](http://localhost:3000) e iniciar sesión con `dennis.ventas@demo.hs.local` / `Demo1234!`.

| Comando | Descripción |
|---------|-------------|
| `pnpm dev:web` | Frontend Vite (recomendado) |
| `pnpm build:web` | Build → `apps/web/dist` |
| `pnpm start:web` | Preview del build |
| `pnpm lint` | ESLint |
| `pnpm dev` | Frontend + PocketBase legacy (no necesario para POC) |

Documentación completa: **[`docs/README.md`](./docs/README.md)**

---

## Estructura del repositorio

```
aca/
├── apps/
│   ├── web/              ← SPA React + Vite (activo)
│   ├── api/              ← NestJS placeholder (pendiente)
│   └── pocketbase/       ← Legacy / referencia auditada
├── docs/                 ← Documentación canónica modular
│   ├── getting-started/
│   ├── design/
│   ├── operations/
│   ├── architecture/
│   ├── migration/
│   └── deployment/
├── DESIGN.md             ← Tokens oficiales de diseño
├── pnpm-workspace.yaml
└── package.json
```

---

## Grupos operativos

| Grupo | Rol | Enfoque |
|-------|-----|---------|
| Ventas | VENTAS / ADMINISTRACIÓN | Clientes, relevamientos, cotizaciones, planificación de cronograma |
| Técnicos | SEGURIDAD ELECTRÓNICA | Ejecución en campo, visitas, pedidos de materiales |
| Finanzas | Contadora | Cobranzas, costos, reportes |
| Admin | ADMINISTRADOR | Visión global, configuración, auditoría |

Flujo comercial:

```
Relevamiento → Cotización → Cronograma → Ejecución técnica → Cobro
```

Manual de operaciones: [`docs/operations/README.md`](./docs/operations/README.md)

---

## Diseño

Sistema visual **sobrio y minimalista** para ERP data-dense. Fuente de verdad: [`DESIGN.md`](./DESIGN.md).

Manuales extendidos:

- [Manual de diseño (web + componentes)](./docs/design/design-system-manual.md)
- [Responsive web y mobile](./docs/design/responsive-web-mobile.md)

---

## Cuentas demo

Contraseña: **`Demo1234!`**

| Email | Rol |
|-------|-----|
| `julio.admin@demo.hs.local` | Administrador |
| `dennis.ventas@demo.hs.local` | Ventas |
| `elias.ops@demo.hs.local` | Técnico |
| `elena.conta@demo.hs.local` | Finanzas |

Lista completa: [`docs/getting-started/demo-accounts.md`](./docs/getting-started/demo-accounts.md)

---

## Arquitectura POC

```
React (pages/hooks)
      ↓
services/*          ← contrato futuro NestJS
      ↓
mocks/store.js      ← datos en memoria por sesión
```

Detalle: [`docs/architecture/frontend-poc.md`](./docs/architecture/frontend-poc.md)

Backend objetivo: NestJS + Prisma + MySQL — [`docs/migration/backend-status.md`](./docs/migration/backend-status.md)

---

## Deploy

Frontend estático en Hostinger con `dist/` pre-compilado. Guía: [`docs/deployment/hostinger-frontend.md`](./docs/deployment/hostinger-frontend.md)

```bash
pnpm build:web
# commitear apps/web/dist/ antes de push a rama de deploy
```

---

## Documentación por tema

| Tema | Enlace |
|------|--------|
| Instalación y pnpm | [docs/getting-started/local-development.md](./docs/getting-started/local-development.md) |
| Dashboards por rol | [docs/operations/dashboards-by-role.md](./docs/operations/dashboards-by-role.md) |
| Cruce de datos | [docs/operations/data-crossing.md](./docs/operations/data-crossing.md) |
| Flujo ventas / relevamientos | [docs/operations/flows/ventas.md](./docs/operations/flows/ventas.md) |
| Cronograma (quién planifica) | [docs/operations/flows/cronogramas-y-relevamientos.md](./docs/operations/flows/cronogramas-y-relevamientos.md) |
| Contrato API futuro | [docs/migration/frontend-backend-contract.md](./docs/migration/frontend-backend-contract.md) |

---

## Licencia y notas

- `apps/pocketbase/` se conserva como referencia del sistema auditado; el POC no lo ejecuta.
- npm/yarn están bloqueados — usar solo **pnpm**.
