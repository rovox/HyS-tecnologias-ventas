# Publicar en Hostinger (Cloud Startup)

Guía única de despliegue. Plan **Cloud Startup**, no VPS: Hostinger no compila ni da una terminal con permisos de ejecución para compilar; solo instala dependencias y arranca Node. Por eso GitHub compila y Hostinger publica lo ya compilado.

## Cómo encaja

```text
mvp ──(merge)──▶ release ──(GitHub Actions: fusiona y compila)──▶ migration/backend-api ──(Hostinger: instala y arranca)──▶ sitios
```

| Pieza | Qué es | Dónde |
|---|---|---|
| `release` | lo que se publica: se actualiza fusionando `mvp` | GitHub |
| `migration/backend-api` | la rama que Hostinger publica (por ahora, decisión 2026-10-26): `release` + lo compilado (`apps/api/dist`, `apps/web/dist`, un `pnpm-lock.yaml` por app) en un solo commit por versión. La escribe solo el workflow [`release.yml`](../../.github/workflows/release.yml); nunca se sube nada a mano a esta rama | GitHub |
| API | sitio Node `lime-chamois-337700.hostingersite.com` (NestJS) | Hostinger |
| Web | sitio Node `white-goat-213580.hostingersite.com` (sirve el SPA con `serve-dist.mjs`) | Hostinger |
| Base de datos | MySQL del plan (hoy `u656468476_hys_sales`, usuario `u656468476_hys_api`; puede ser una nueva). Solo la API la usa, por `localhost`, vía `DATABASE_URL` | Hostinger |

Por qué Hostinger no compila: `vite build` lanza un binario nativo (`esbuild`) que el disco de compilación de Hostinger no deja ejecutar (`EACCES`). La API sí podría compilarse allí (`nest build` es TypeScript puro, se probó aislada), pero se compila en GitHub igual que la web para que ambas sigan el mismo camino ya probado.

## 1. Configuración de los sitios en hPanel (una sola vez)

hPanel → Sitios web → (sitio) → **Despliegues / Configuración de Git**. En los dos sitios el repositorio es el mismo (`HyS-tecnologias-ventas`) y la rama sigue siendo **`migration/backend-api`** (no se cambia).

| Campo | API (lime-chamois) | Web (white-goat) |
|---|---|---|
| Rama | `migration/backend-api` | `migration/backend-api` |
| Framework | Other | Other (**no** Vite: forzaría `vite build`) |
| Node.js | 22 | 22 |
| Directorio raíz | `apps/api` | `apps/web` |
| Gestor de paquetes | pnpm (lo detecta por `pnpm-lock.yaml`) | pnpm |
| Comando de build | **vacío** | **vacío** |
| Directorio de salida | vacío | `dist` |
| Archivo de entrada | `dist/main.js` | `serve-dist.mjs` |

### Variables de entorno de la API (hPanel → sitio API → Variables de entorno), en MAYÚSCULAS

| Variable | Valor |
|---|---|
| `DATABASE_URL` | `mysql://u656468476_hys_api:<CONTRASEÑA>@localhost:3306/u656468476_hys_sales` (contraseña sin `$ @ # /`, o codificada: `$` → `%24`) |
| `JWT_SECRET` | `openssl rand -hex 32` (obligatoria; la API no arranca sin ella) |
| `CORS_ORIGIN` | `https://white-goat-213580.hostingersite.com` — con dominio propio, separados por coma: `https://white-goat-213580.hostingersite.com,https://erp.tudominio.com` |
| `UPLOAD_DIR` | `/home/u656468476/hys-uploads/quotations` (fuera del repositorio: cada despliegue reemplaza la carpeta del sitio). Las fotos de visitas van en su subcarpeta `relevamientos/` |
| `WEB_LEADS_KEY` | `openssl rand -hex 32`; el mismo valor en WordPress (`HS_ERP_LEADS_KEY`) para el formulario web |
| `DIGICORP_AUTO_SYNC` | `1` para que la Tienda Digicorp se actualice sola cada mes (DIGI-01). Sin ella, solo con "Actualizar ahora" (Gerencia). La primera carga tarda unos 3 minutos (≈50 páginas, una cada 3 s); si Digicorp bloquea, se detiene y lo muestra en la pestaña |

`PORT` lo pone Hostinger. Después de cambiar variables: **Reiniciar** el sitio (Guardar no basta).

La web no lleva variables en hPanel: la URL de la API se compila desde [`apps/web/.env.production`](../../apps/web/.env.production) (`VITE_API_URL=https://lime-chamois-337700.hostingersite.com/api`). Si la API cambia de dominio, se edita ese archivo y se publica de nuevo.

### Dominio propio (opcional)

hPanel → sitio → Dominios → conectar el dominio (por ejemplo `erp.hstecnologias.com` a la web y `api.hstecnologias.com` a la API). Luego: agregar el dominio de la web a `CORS_ORIGIN`, poner el de la API en `apps/web/.env.production` y publicar.

## 2. Base de datos: un solo archivo SQL

El esquema completo, los catálogos fijos (sucursales, las 3 divisiones, cajas) y el historial de migraciones están en **un archivo**, generado desde las migraciones:

```bash
# 1. Contraseñas reales de los usuarios (archivo ignorado por git): { "julio@hscontrol.com": "…", … }
#    en config/users.passwords.local.json
# 2. Archivo para importar (incluye los usuarios con su contraseña cifrada; no se sube a git):
node apps/api/scripts/build-hostinger-sql.mjs --users      # → config/hostinger-db.local.sql
```

[`hostinger-db.sql`](./hostinger-db.sql) es la misma base **sin usuarios** (la que queda en git para revisar).

**Automático por SSH (lo usado el 2026-10-26):** `scripts/hostinger-recreate-db.sh --yes` respalda la base que usa la API (`~/backups/<base>-<fecha>.sql.gz` en el servidor), borra sus tablas, importa `config/hostinger-db.local.sql`, comprueba tablas, usuarios y migraciones, y reinicia la API. Lee `DATABASE_URL` del entorno del sitio en el servidor (no se muestra ni se copia). Misma base y mismo usuario: no hay que tocar hPanel.

Manual, con una base **nueva** (la actual queda intacta como respaldo):

1. hPanel → Bases de datos → **Crear base de datos**: nombre (Hostinger antepone `u656468476_`, p. ej. `u656468476_hs_erp`), usuario nuevo y contraseña **solo letras y números** (sin `$ @ # /`). Asignarla al sitio de la API (lime-chamois).
2. phpMyAdmin de esa base → **Importar** → `config/hostinger-db.local.sql` → Continuar (crea 26 tablas, los catálogos y los usuarios).
3. Sitio de la API → Variables de entorno → cambiar **`DATABASE_URL`** a la base nueva: `mysql://u656468476_<usuario>:<contraseña>@localhost:3306/u656468476_<base>` → Guardar → **Reiniciar**. No hay que tocar código: NestJS solo lee esa variable.
4. Comprobar: `https://lime-chamois-337700.hostingersite.com/api/health/db` → `"db":true`, y entrar con un usuario.

Alternativa sin crear otra base: en phpMyAdmin de `u656468476_hys_sales` (copia de seguridad antes) → Estructura → marcar todas las tablas → Eliminar → Importar el mismo archivo; `DATABASE_URL` no cambia.

Orden: primero la base, después publicar (la API nueva no funciona sobre la base vieja).

Nunca correr `prisma db seed` en Hostinger (son datos de prueba). Cuando haya migraciones nuevas, se aplica solo el `migration.sql` nuevo en phpMyAdmin (o por SSH con `prisma migrate deploy`: la base ya lleva el historial de Prisma) y se vuelve a generar `hostinger-db.sql`.

## 3. Publicar una versión

```bash
git checkout release && git merge --ff-only mvp && git push origin release
```

Son dos ramas distintas en GitHub: `mvp` es el trabajo del día a día (subirla no publica nada) y `release` es la orden de publicar. GitHub Actions (`release`) fusiona `release` en `migration/backend-api` con lo compilado en un solo commit; Hostinger lo despliega solo (un despliegue por versión). En unos minutos: recargar con Ctrl+Shift+R.

Revisar después: `/api/health`, `/api/health/db`, entrar con un usuario de cada rol, una pantalla con datos.

Volver atrás: `git revert` del cambio en `release` y push (se publica de nuevo sin ese cambio). hPanel no tiene botón de volver atrás. Si un despliegue falla en Hostinger, el sitio sigue con la versión anterior.

## Problemas conocidos

| Síntoma | Causa | Solución |
|---|---|---|
| Log con `$ vite build` o `spawn …/esbuild EACCES` | Framework = Vite o comando de build lleno | Framework **Other**, build **vacío** |
| `ERR_PNPM_IGNORED_BUILDS` y falla la instalación | pnpm 11 bloquea los scripts de Prisma | ya resuelto con `allowBuilds` en `apps/api/pnpm-workspace.yaml`; si reaparece, revisar que la raíz sea `apps/api` |
| `ERR_PNPM_OUTDATED_LOCKFILE` / `frozen-lockfile` | se subió algo a mano a `migration/backend-api` sin pasar por el workflow | publicar de nuevo desde `release` (el workflow genera `apps/*/pnpm-lock.yaml`) |
| Página 404 de Hostinger | archivo de entrada vacío | API `dist/main.js`, web `serve-dist.mjs` |
| `/api/health` 503 | la API no arrancó: falta `JWT_SECRET` o `CORS_ORIGIN`, o variable en minúsculas | revisar variables y **Reiniciar** |
| `/api/health/db` con `"db":false` | `DATABASE_URL` mal armada (caracteres especiales en la contraseña) | cambiar la contraseña a letras y números, rearmar la URL, reiniciar |
| La web carga pero no inicia sesión / error CORS | el dominio de la web no está en `CORS_ORIGIN` | agregarlo y reiniciar la API |
| Fotos o PDF "no encontrados" tras desplegar | `UPLOAD_DIR` dentro de la carpeta del sitio | usar `/home/u656468476/hys-uploads/quotations` |
| Una ruta interna (`/clientes/…`) da 404 al recargar | la web no corre con `serve-dist.mjs` | archivo de entrada `serve-dist.mjs` |
| Tiempo real se corta | el proxy cierra conexiones largas | la web reconecta sola y vuelve a pedir los datos |

## Producción: reglas

- Nunca VPS. La base es MySQL del mismo plan; si se crea una nueva, solo cambia `DATABASE_URL`.
- Nada apunta a la base de producción desde local; las lecturas por SSH son de solo lectura (`CLAUDE.md` §3).
- Secretos solo en hPanel y en `config/*.local.*` (ignorados); nunca en git ni en el chat. Si se pegó uno, se cambia.
