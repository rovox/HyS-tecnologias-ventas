# Desarrollo local

Este monorepo usa **pnpm exclusivamente**. npm y yarn están bloqueados vía `only-allow`.

## Requisitos

| Herramienta | Versión |
|-------------|---------|
| Node.js | ≥ 22 (ver `.nvmrc`) |
| pnpm | ≥ 9 (Corepack recomendado) |

```bash
# Activar Corepack (una vez por máquina)
corepack enable
corepack prepare pnpm@10.14.0 --activate
```

## Instalación

Desde la raíz del repositorio:

```bash
pnpm install
```

## Comandos principales

| Comando | Descripción |
|---------|-------------|
| `pnpm dev:web` | **Frontend solo** — Vite en `http://localhost:3000` (recomendado para el POC) |
| `pnpm build:web` | Build de producción → `apps/web/dist` |
| `pnpm start:web` | Preview del build (`vite preview`) |
| `pnpm lint` | ESLint del frontend |
| `pnpm verify:dist` | Verifica que `dist/index.html` exista (gate de deploy) |
| `pnpm dev` | Frontend + PocketBase legacy (no necesario para el POC) |

## Variables de entorno

Archivos en `apps/web/`:

| Archivo | Uso |
|---------|-----|
| `.env.development` | Local — `VITE_API_MODE=mock` |
| `.env.production` | Build de producción |
| `.env.example` | Plantilla |

```env
VITE_API_MODE=mock
VITE_API_URL=/api
```

En el POC, `mock` usa `apps/web/src/mocks/store.js`. No cambies a `api` hasta que exista NestJS.

## Estructura del monorepo

```
aca/
├── apps/
│   ├── web/           ← SPA React + Vite (activo)
│   ├── api/           ← placeholder NestJS (pendiente)
│   └── pocketbase/    ← legacy / referencia (no se usa en POC)
├── docs/              ← documentación canónica
├── DESIGN.md          ← tokens de diseño oficiales
├── pnpm-workspace.yaml
└── package.json
```

## Flujo típico de trabajo

1. `pnpm install`
2. `pnpm dev:web`
3. Login con una cuenta demo → [demo-accounts.md](./demo-accounts.md)
4. Tras cambios de UI para deploy: `pnpm build:web` y commitear `apps/web/dist/` (ver [deployment/hostinger-frontend.md](../deployment/hostinger-frontend.md))

## Solución de problemas

| Problema | Acción |
|----------|--------|
| `Use "pnpm install" instead` | No uses npm/yarn; instala pnpm vía Corepack |
| Puerto 3000 ocupado | Cambia `--port` en `apps/web/package.json` o libera el puerto |
| Datos no persisten al recargar | Esperado en POC — el mock es por sesión en memoria |
| `esbuild EACCES` en Hostinger | No compilar en el host; build local + `dist/` commiteado |
