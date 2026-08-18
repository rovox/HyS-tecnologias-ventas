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
| `pnpm --filter web build` (`vite build`) | GitHub Actions (`ubuntu-latest`) | Needs esbuild; Hostinger is `noexec` |
| Commit `apps/web/dist/` | GitHub Actions (`[skip ci]`) | The compiled HTML/JS/CSS **is** the deployable |
| GitHub → Hostinger | Hostinger | Pulls the repo and **publishes** `dist/` after `pnpm install` |

`verify:dist` is optional. If Hostinger runs `vite build` (Vite framework preset), the log shows `$ vite build` and fails with `EACCES` even when `dist/` is already in the repo.

The GitHub connection is **CD** (every push deploys the committed `dist/`). Hostinger is not the compiler.

**CI** is [`.github/workflows/web.yml`](../../.github/workflows/web.yml) on `ubuntu-latest`: lint, `vite build`, then commit `apps/web/dist` with `[skip ci]`. Do not build `dist/` on your laptop for deploy.

**pnpm on Hostinger:** Cloud Startup Corepack may invoke pnpm 11.x while the repo used to pin 10.14.0. That mismatch aborts install (`does not switch versions when running under corepack`). The root `package.json` pins `pnpm@11.21.0` with `devEngines.packageManager.onFail: ignore` and `.npmrc` `pm-on-fail=ignore` so a 11.22 bump does not break CD.

## Publishing `dist/`

Push **source** to `migration/frontend-poc`. Actions compiles. Hostinger’s first deploy of that push may still have the previous bundle; wait for the follow-up commit `chore: refresh web dist [skip ci]`, then hard-refresh the site.

```bash
git push origin migration/frontend-poc
```

Do not `git add apps/web/dist` locally. Preview locally with `pnpm build:web` + `pnpm start:web` if needed.

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
| Build command | empty | Hostinger copies committed `dist/` after `pnpm install`. Never `$ vite build` |
| Output directory | `dist` | Committed `apps/web/dist` |
| Entry file | **leave empty** | Hostinger copies `dist` to the site root |
| Environment variables | see below | Baked in at Actions build time |

If Hostinger refuses an empty entry file, set **Entry file** to `serve-dist.mjs` (Node stdlib static server, no native binaries).

`pnpm install` on Hostinger should succeed (esbuild postinstall is ignored in `pnpm-workspace.yaml`). A good log ends with **Done … using pnpm v11.21.0** and does **not** run `$ vite build`. `verify:dist` is optional.

A bad log still contains `$ vite build` or `spawn .../esbuild EACCES` — the Framework preset is still Vite.

Do **not** set Root directory to `/`. The root `package.json` `start` script still launches PocketBase.

Do **not** delete `pnpm-lock.yaml`, prune the pnpm store, or pin `esbuild@^0.24.0`.

## Environment variables

```
VITE_API_MODE=mock
VITE_API_URL=/api
```

These are already in `apps/web/.env.production` and are applied when **GitHub Actions** runs `vite build`. Changing them in hPanel does **nothing** until the next Actions build.

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

Push source to `migration/frontend-poc`. Do not include a local `dist/` refresh.

```bash
git push origin migration/frontend-poc
```

Logs:

- **GitHub Actions `web`** — lint + `vite build`, then bot commit of `apps/web/dist`
- **Hostinger** — `pnpm install` (v11), copy `dist/` (twice: source push, then dist commit)
- **Runtime logs** — unused unless `serve-dist.mjs` is the entry file

A Hostinger log that still says `configured to use 10.14.0 of pnpm` or `$ vite build` is a bad deploy.

## Rollback

1. In GitHub, note the previous good commit on `migration/frontend-poc`.
2. Revert with a new commit (`git revert`). Do not force-push unless requested.
3. Push; Hostinger republishes that commit’s `dist/`.

Do not move the `horizons-original` tag. Do not force-push `main`.

## Option A vs later architecture

**This POC:** Option A — GitHub Actions compiles `apps/web/dist` and commits it. Hostinger hosts those files; it does not compile.

**Later:** Option B — NestJS (MySQL) serves `/api`. **CI** stays GitHub Actions. **CD** stays Hostinger publishing static files (and a separate Node app for the API). Hostinger still should not run esbuild.

**Option C** (two Web Apps) is allowed by Cloud Startup but not needed for the mock POC.

## Checklist after first deploy

- [ ] Login with `julio.admin@demo.hs.local` / `Demo1234!`
- [ ] Banner “POC frontend · datos ficticios”
- [ ] `/quotations` commercial flow
- [ ] Browser network tab: **no** requests to `/hcgi/platform`
- [ ] Nested route refresh works
- [ ] Logos load from `/branding/logo.svg` (not Horizons CDN)
