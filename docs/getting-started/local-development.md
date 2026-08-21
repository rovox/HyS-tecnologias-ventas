# Desarrollo local

Este monorepo usa **pnpm exclusivamente**. npm y yarn están bloqueados vía `only-allow`.

## Requisitos

| Herramienta | Versión |
|-------------|---------|
| Node.js | ≥ 22 (ver `.nvmrc`) |
| pnpm | ≥ 11 (Corepack; repo pin `pnpm@11.21.0`) |

```bash
# Activar Corepack (una vez por máquina)
corepack enable
corepack prepare pnpm@11.21.0 --activate
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
| `pnpm dev:api` | NestJS sales API en `http://localhost:3001/api` (MySQL local, ver abajo) |
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

En el POC, `mock` usa `apps/web/src/mocks/store.js`. Para apuntar al Nest local:

```env
VITE_API_MODE=api
VITE_API_URL=http://localhost:3001/api
```

```bash
cp apps/api/.env.example apps/api/.env
docker compose -f apps/api/docker-compose.yml up -d
pnpm --filter api prisma:generate
pnpm --filter api prisma:deploy
pnpm --filter api prisma:seed   # solo local; nunca en Hostinger (reescribe passwordHash)
pnpm --filter api dev
```

Demo: `dennis.ventas@demo.hs.local` / `Demo1234!`. El frontend en Hostinger sigue en `mock` hasta que Actions compile con `VITE_API_MODE=api`.

## Estructura del monorepo

```
aca/
├── apps/
│   ├── web/           ← SPA React + Vite (activo)
│   ├── api/           ← NestJS sales (Prisma + MySQL local)
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
4. Para el sitio en Hostinger: `git push origin migration/frontend-poc` y esperar el commit de Actions `chore: refresh web dist` (ver [deployment/hostinger-frontend.md](../deployment/hostinger-frontend.md))

## Solución de problemas

| Problema | Acción |
|----------|--------|
| `Use "pnpm install" instead` | No uses npm/yarn; instala pnpm vía Corepack |
| Puerto 3000 ocupado | Cambia `--port` en `apps/web/package.json` o libera el puerto |
| Datos no persisten al recargar | Esperado en POC — el mock es por sesión en memoria |
| `esbuild EACCES` en Hostinger | No compilar en el host; Actions genera `dist/` |
