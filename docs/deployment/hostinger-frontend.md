# Hostinger Cloud Startup — frontend POC deploy

Use the **existing private GitHub repository**. Do not create another repo.

- Remote: the `origin` already configured on this machine (`HyS-tecnologias-ventas`)
- Branch to deploy for this milestone: `migration/frontend-poc`
- Do not deploy `main` until this branch is reviewed and merged

This document describes **Option A: frontend-only** (Vite static + mock services). NestJS is not part of this deploy.

## Why Hostinger does not *build* the app

GitHub ↔ Hostinger is still useful. What Hostinger **cannot** do is compile this Vite app.

Vite 7 always starts a native **esbuild** binary (`@esbuild/linux-x64/.../bin/esbuild`) to load `vite.config.js` and to bundle. Hostinger Cloud Startup mounts the builder filesystem **`noexec`** (the kernel refuses to execute binaries from that disk). That includes:

- `esbuild` postinstall
- `vite build`
- a copy of the binary in `/tmp`

`EACCES` / `spawn .../esbuild` is that restriction. Reinstalling (`pnpm install --force`), chmod, `approve-builds`, or pinning `esbuild@0.24` does not change it. Hostinger’s auto-diagnosis that “permissions were lost and a reinstall will restore +x” is wrong for this host.

So the split is:

| Step | Where it runs | Why |
|------|----------------|-----|
| `pnpm --filter web build` (`vite build`) | Your machine (or later GitHub Actions) | Needs esbuild; that environment is not `noexec` |
| Commit `apps/web/dist/` | Git | The compiled HTML/JS/CSS **is** the deployable |
| GitHub → Hostinger | Hostinger | Pulls the repo and **publishes** `dist/` |
| `pnpm run verify:dist` | Hostinger | Does **not** compile. Only checks `dist/index.html` exists so a bad clone fails fast |

`verify:dist` is a gate, not a build. If Hostinger runs `vite build` (Vite framework preset), the log shows `$ vite build` and fails with `EACCES` even when `dist/` is already in the repo.

The GitHub connection is **CD** (every push deploys the committed `dist/`). Hostinger is not the compiler.

**CI** is [`.github/workflows/web.yml`](../../.github/workflows/web.yml) on `ubuntu-latest`: `pnpm install --frozen-lockfile`, lint, `vite build`, upload `web-dist`. That workflow does **not** commit `dist/` back to the branch.

**pnpm on Hostinger:** Cloud Startup Corepack may invoke pnpm 11.x while the repo used to pin 10.14.0. That mismatch aborts install (`does not switch versions when running under corepack`). The root `package.json` pins `pnpm@11.21.0` with `devEngines.packageManager.onFail: ignore` and `.npmrc` `pm-on-fail=ignore` so a 11.22 bump does not break CD.

## TEMPORARY: pre-built `dist/`

**POC workaround:** build locally, commit `apps/web/dist/`, Hostinger only verifies and copies that folder.

After any frontend change:

```bash
pnpm --filter web build
git add apps/web/dist
git commit -m "chore: refresh pre-built frontend POC for Hostinger"
git push origin migration/frontend-poc
```

If you push source without a new `dist/`, the live site stays on the last committed bundle.

## Recommended hPanel settings

**Do not leave Framework = Vite.** That preset forces `$ vite build` and ignores a safe command. Set Framework to **Other**.

| Setting | Recommended value | Verify in hPanel |
|---------|-------------------|------------------|
| Source | Import Git repository → existing private repo | Already-connected GitHub account |
| Branch | `migration/frontend-poc` | Defaults to `main` — **change it** |
| Framework preset | **Other** (not Vite) | Vite preset runs `vite build` → `EACCES` |
| Node.js version | **22** | Only for `pnpm install` + verify |
| Root directory | `apps/web` | Required |
| Package manager | **pnpm** | Auto from `pnpm-lock.yaml` |
| Build command | `pnpm run verify:dist` | Must appear in the log as `$ pnpm run verify:dist`, never `$ vite build` |
| Output directory | `dist` | Committed `apps/web/dist` |
| Entry file | **leave empty** | Hostinger copies `dist` to the site root |
| Environment variables | see below | Already baked into the committed bundle |

If Hostinger refuses an empty entry file, set **Entry file** to `serve-dist.mjs` (Node stdlib static server, no native binaries).

`pnpm install` on Hostinger should succeed (esbuild postinstall is ignored in `pnpm-workspace.yaml`). A good log:

```
Done in … using pnpm v11…
$ pnpm run verify:dist
pre-built dist present; skipping vite
```

A bad log still contains `$ vite build` or `spawn .../esbuild EACCES` — the Framework/build command was not overridden.

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

Push to `migration/frontend-poc` **including** an updated `apps/web/dist/` when the UI changed. GitHub Actions will also lint and compile; Hostinger still publishes the committed `dist/`.

```bash
git push -u origin migration/frontend-poc
```

Logs:

- **GitHub Actions** — `pnpm install`, lint, `vite build` (compiler)
- **Hostinger build logs** — `pnpm install` (v11) then `pre-built dist present` (publisher)
- **Runtime logs** — unused unless `serve-dist.mjs` is the entry file

A Hostinger log that still says `configured to use 10.14.0 of pnpm` or `$ vite build` is a bad deploy.

## Rollback

1. In GitHub, note the previous good commit on `migration/frontend-poc`.
2. Revert with a new commit (`git revert`). Do not force-push unless requested.
3. Push; Hostinger republishes that commit’s `dist/`.

Do not move the `horizons-original` tag. Do not force-push `main`.

## Option A vs later architecture

**This POC:** Option A — GitHub delivers a pre-built `apps/web/dist`. Hostinger hosts files; it does not compile. GitHub Actions is the compile check.

**Later:** Option B — NestJS (MySQL) serves `/api`. **CI** stays GitHub Actions. **CD** stays Hostinger publishing static files (and a separate Node app for the API). Hostinger still should not run esbuild.

**Option C** (two Web Apps) is allowed by Cloud Startup but not needed for the mock POC.

## Checklist after first deploy

- [ ] Login with `julio.admin@demo.hs.local` / `Demo1234!`
- [ ] Banner “POC frontend · datos ficticios”
- [ ] `/quotations` commercial flow
- [ ] Browser network tab: **no** requests to `/hcgi/platform`
- [ ] Nested route refresh works
- [ ] Logos load from `/branding/logo.svg` (not Horizons CDN)
