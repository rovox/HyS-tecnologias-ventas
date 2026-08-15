# Hostinger Cloud Startup — frontend POC deploy

Use the **existing private GitHub repository**. Do not create another repo.

- Remote: the `origin` already configured on this machine (`HyS-tecnologias-ventas`)
- Branch to deploy for this milestone: `migration/frontend-poc`
- Do not deploy `main` until this branch is reviewed and merged

This document describes **Option A: frontend-only** (Vite static + mock services). NestJS is not part of this deploy.

## Recommended hPanel settings

Hostinger auto-detects many fields. Confirm each value on the deploy screen; labels below match current Hostinger Node.js Web App docs (GitHub flow, root directory, build command, output directory, entry file, env vars).

| Setting | Recommended value | Verify in hPanel |
|---------|-------------------|------------------|
| Source | Import Git repository → existing private repo | Pick the already-connected GitHub account |
| Branch | `migration/frontend-poc` | Defaults to repo default (`main`) — **change it** |
| Framework preset | **Vite** (or React) | Auto-detect; override if it picks Nest/Other |
| Node.js version | **22** | 18/20/22/24 are supported; 22 is the documented default |
| Root directory | `apps/web` | Required. Monorepo: Hostinger builds **only this subdirectory** |
| Package manager | npm | Auto from lockfile |
| Build command | `npm run build` | Script lives in `apps/web/package.json` |
| Output directory | `dist` | Vite writes `apps/web/dist` |
| Entry file | **leave empty** | Static Vite apps have no Node server process |
| Environment variables | see below | Applied at build and runtime |

Do **not** set Root directory to `/` for this POC. The root `package.json` `start` script still launches PocketBase, which is not this milestone.

## Environment variables

```
VITE_API_MODE=mock
VITE_API_URL=/api
```

No secrets. `VITE_*` values are baked into the browser bundle at **build** time. After changing them, trigger a new deploy.

`apps/web/.env.production` already contains these values, so hPanel env vars are optional but useful as an explicit record.

## Domain

1. In hPanel, deploy the Node.js Web App onto the existing Hostinger domain (the flow creates/uses the website slot for that domain).
2. If the domain already has another website on the plan, Hostinger may require removing or replacing that slot first — confirm in the panel; do not assume two sites share one document root.
3. DNS for the existing domain should already point at Hostinger. No extra DNS is required for a mock frontend.

## SPA routing

`apps/web/public/.htaccess` rewrites unknown paths to `index.html` (Apache). Hostinger also generates an `.htaccess` in `public_html` for Node/Vite apps.

After deploy, hard-refresh:

- `/login`
- `/dashboard`
- `/clientes`
- `/quotations`
- `/pedidos-internos/ped_andina` (nested)

If a nested URL 404s, the rewrite did not apply. Check `public_html/.htaccess` in File Manager. Do not hand-edit Hostinger-generated rules if a redeploy will overwrite them; prefer keeping the copy in `apps/web/public/.htaccess`.

Static Vite apps **do not** expose Restart. There is no long-running Node process.

## GitHub auto-deploy

Push to `migration/frontend-poc` triggers a rebuild when this branch is the connected deploy branch.

```bash
git push -u origin migration/frontend-poc
```

Logs:

- **Build logs** — website dashboard → Deployments
- **Runtime logs** — not used for this static POC

## Rollback

1. In GitHub, note the previous good commit on `migration/frontend-poc`.
2. Revert with a new commit (`git revert`) or reset **only if you explicitly intend to rewrite the branch** — do not force-push unless requested.
3. Push; Hostinger rebuilds.
4. Alternatively, in hPanel Deployments, redeploy a previous successful build if the UI offers it (confirm in panel; this control varies).

Do not move the `horizons-original` tag. Do not force-push `main`.

## Option A vs later architecture

**This POC:** Option A — one Vite Web App from `apps/web`.

**Final target (not this milestone):** Option B — one NestJS Web App at repo root (or `apps/api`) that serves `/api` and the built SPA. Compatible if the SPA keeps using `VITE_API_URL=/api`.

**Option C** (two Web Apps) is allowed by Cloud Startup (up to 10 Node.js sites) but adds CORS and cookies. Not needed for the mock POC.

## Checklist after first deploy

- [ ] Login with `ana.admin@demo.hs.local` / `Demo1234!`
- [ ] Banner “POC frontend · datos ficticios”
- [ ] `/quotations` commercial flow
- [ ] Browser network tab: **no** requests to `/hcgi/platform`
- [ ] Nested route refresh works
- [ ] Logos load from `/branding/logo.svg` (not Horizons CDN)
