# hs-erp — ERP de H&S Tecnologías

Monorepo (`hs-erp`: `@hs-erp/api` + `@hs-erp/web`) del sistema de gestión para **H&S Tecnologías**: ventas, cronograma de instalaciones, relevamientos, cotizaciones, logística interna y finanzas.

**Estado:** MVP en la rama `mvp`, verificado en el stack local (Docker). Avance y decisiones: [`docs/STATUS.md`](./docs/STATUS.md).

---

## Inicio rápido

Requisitos: **Node.js ≥ 22**, **pnpm ≥ 11** (este repo usa pnpm exclusivamente).

```bash
corepack enable
corepack prepare pnpm@11.21.0 --activate
pnpm install
pnpm dev:web
```

Abrir [http://localhost:3000](http://localhost:3000) e iniciar sesión con un botón rápido (por ejemplo Dennis, `dennis@hscontrol.com`). Cuentas en [`config/users.json`](./config/users.json).

| Comando | Descripción |
|---------|-------------|
| `pnpm dev:web` | Frontend Vite (recomendado) |
| `pnpm build:web` | Build → `apps/web/dist` |
| `pnpm start:web` | Preview del build |
| `pnpm lint` | ESLint |
| `pnpm dev:api` | NestJS sales en `:3001` (MySQL local) |
| `pnpm dev` | API (`:3001`) + frontend (`:3000`) |

Documentación completa: **[`docs/README.md`](./docs/README.md)**

---

## Estructura del repositorio

```
aca/
├── apps/
│   ├── web/              ← SPA React + Vite (activo)
│   ├── api/              ← NestJS sales (Prisma + MySQL)
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
| Ventas | VENTAS / ADMINISTRACIÓN | Clientes, relevamientos, cotizaciones, planificación de cronograma, registro de cobros/egresos (pendientes de validación) |
| Técnicos | SEGURIDAD ELECTRÓNICA | Ejecución en campo, visitas, pedidos de materiales |
| Admin | ADMINISTRADOR | Visión global, configuración, auditoría, validación de egresos/ingresos y reportes de finanzas |

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

Una sola lista de usuarios para local, tests y producción: [`config/users.json`](./config/users.json) (mismos correos que producción). En local la contraseña es la de `config/users.passwords.local.json` (fuera de git) o, si no está, el nombre de pila en minúsculas (ej. `julio`).

Lista completa: [`docs/getting-started/demo-accounts.md`](./docs/getting-started/demo-accounts.md)

---

## Arquitectura

```
apps/web  React (pages → features/hooks → services)   →  HTTP + SSE realtime
apps/api  NestJS (controllers → services → domain/)    →  Prisma → MySQL 8
```

Reglas: [`docs/rules/architecture.md`](./docs/rules/architecture.md). Negocio y vocabulario: [`docs/domain/business-design.md`](./docs/domain/business-design.md).

---

## Deploy

Hostinger Cloud Startup: two Node sites (API and SPA) from the `migration/backend-api` branch, built by GitHub Actions from `release`; the database is created from one SQL file. Guide: [`docs/deployment/hostinger.md`](./docs/deployment/hostinger.md).

```bash
git checkout release && git merge --ff-only mvp && git push origin release
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

- npm/yarn están bloqueados — usar solo **pnpm**.
