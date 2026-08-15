# Hostinger Cloud Startup — frontend POC deploy

Use the **existing private GitHub repository**. Do not create another repo.

- Remote: the `origin` already configured on this machine (`HyS-tecnologias-ventas`)
- Branch to deploy for this milestone: `migration/frontend-poc`
- Do not deploy `main` until this branch is reviewed and merged

This document describes **Option A: frontend-only** (Vite static + mock services). NestJS is not part of this deploy.

## TEMPORARY: pre-built `dist/` (do not run Vite on Hostinger)

Hostinger Cloud Startup mounts the build filesystem **`noexec`**. `esbuild`’s native binary cannot run during `pnpm install` postinstall, during `vite build`, or even after copying it to `/tmp`. That is kernel-level. Do not try to chmod, allowlist, or downgrade esbuild on Hostinger.

**POC workaround:** build the SPA on a machine that can execute esbuild, commit `apps/web/dist/`, and tell Hostinger to skip Vite.

Local rebuild (required after frontend changes):

```bash
pnpm --filter web build
git add apps/web/dist
git commit -m "chore: refresh pre-built frontend POC for Hostinger"
git push
```

Follow-up (not this milestone): GitHub Actions on `ubuntu-latest` that builds and deploys `dist/` (FTP/API). Use that when NestJS is in production. Do not add that workflow until then.

## Recommended hPanel settings

Hostinger auto-detects many fields. Confirm each value. **Do not use `pnpm run build` on Hostinger** — that runs Vite and will fail with `EACCES` on esbuild.

| Setting | Recommended value | Verify in hPanel |
|---------|-------------------|------------------|
| Source | Import Git repository → existing private repo | Pick the already-connected GitHub account |
| Branch | `migration/frontend-poc` | Defaults to repo default (`main`) — **change it** |
| Framework preset | **Vite** (or Static / Other) | Override if it picks Nest |
| Node.js version | **22** | Used only for `pnpm install` + verify |
| Root directory | `apps/web` | Required |
| Package manager | **pnpm** | Auto from `pnpm-lock.yaml` |
| Build command | `pnpm run verify:dist` | Checks committed `dist/index.html`. **Not** `pnpm run build` |
| Output directory | `dist` | Committed `apps/web/dist` |
| Entry file | **leave empty** | Hostinger copies `dist` to the site root |
| Environment variables | see below | Already baked into the committed bundle |

If Hostinger refuses an empty entry file, set **Entry file** to `serve-dist.mjs` (Node stdlib static server, no native binaries). Leave it empty if the panel copies `dist` without a process.

`pnpm install` on Hostinger is expected to succeed (esbuild postinstall is ignored in `pnpm-workspace.yaml`). The previous log `Done in 4.5s using pnpm v11.21.0` is the success case. Failure starts only if the build command runs Vite.

Do **not** set Root directory to `/`. The root `package.json` `start` script still launches PocketBase.

Do **not** delete `pnpm-lock.yaml`, prune the pnpm store, or pin `esbuild@^0.24.0`.

## Environment variables

```
VITE_API_MODE=mock
VITE_API_URL=/api
```

These are already in `apps/web/.env.production` and were applied when `dist/` was built. Changing them in hPanel does **nothing** until you rebuild locally and commit a new `dist/`.

## Domain

1. In hPanel, deploy onto the existing Hostinger domain.
2. If the domain already has another website on the plan, Hostinger may require replacing that slot first.
3. DNS should already point at Hostinger.

## SPA routing

`apps/web/public/.htaccess` is copied into `dist/` by Vite. It rewrites unknown paths to `index.html`.

After deploy, hard-refresh:

- `/login`
- `/dashboard`
- `/clientes`
- `/quotations`
- `/pedidos-internos/ped_andina` (nested)

If a nested URL 404s, check `public_html/.htaccess` in File Manager.

## GitHub auto-deploy

Push to `migration/frontend-poc` after committing an updated `apps/web/dist/`.

```bash
git push -u origin migration/frontend-poc
```

Logs:

- **Build logs** — should show `pnpm install` then `pre-built dist present`
- **Runtime logs** — unused unless `serve-dist.mjs` is the entry file

## Rollback

1. In GitHub, note the previous good commit on `migration/frontend-poc`.
2. Revert with a new commit (`git revert`). Do not force-push unless requested.
3. Push; Hostinger redeploys the committed `dist/`.

Do not move the `horizons-original` tag. Do not force-push `main`.

## Option A vs later architecture

**This POC:** Option A — pre-built Vite static files from `apps/web/dist`.

**Final target (not this milestone):** Option B — NestJS serves `/api` and the SPA. Build the frontend in CI (GitHub Actions), not on Hostinger’s noexec builder.

**Option C** (two Web Apps) is allowed by Cloud Startup but not needed for the mock POC.

## Checklist after first deploy

- [ ] Login with `julio.admin@demo.hs.local` / `Demo1234!`
- [ ] Banner “POC frontend · datos ficticios”
- [ ] `/quotations` commercial flow
- [ ] Browser network tab: **no** requests to `/hcgi/platform`
- [ ] Nested route refresh works
- [ ] Logos load from `/branding/logo.svg` (not Horizons CDN)
