# Flujo — Clientes y cotizaciones

Modules: `/clientes`, `/quotations`  
Owner: **Ventas / Admin**. Contadora: read + **edit** on `/quotations`. Técnicos: read clients.

Form: `apps/web/src/components/NewQuotationForm.jsx` (do not duplicate).  
Row actions: `apps/web/src/components/RowActions.jsx` (`variant="action"` for Ver/Editar).

---

## Clients

Official directory: name, contact, phone, email, address, notes. Category on the client is **optional**.

### Activo vs Contratado

| Flag | Meaning |
|------|---------|
| `esActivo` | Recent activity (90 days) or open draft/enviado quote or open job |
| `esClienteContratado` | At least one quotation `aceptado` **or** a non-cancelled `Schedule` |

Contratado rows/detail use `--client-contracted-*` tokens and a **Contratado** badge (distinct from Activo).

List (`/clientes`): activity summary. Detail: full history including jobs with monto / adelanto / saldo.

**Never delete** clients (UI and API). Edit general data only.

Sucursales: **Central, Punata, Quillacollo** only.

---

## Commercial quotation

Editable after create (`PATCH /api/quotations/:id`) for anyone with `/quotations` access (`canEditQuotationsView`). Closed quotes (`aceptado` / `rechazado`) do not change cliente/monto.

Two save actions on full form: **Guardar borrador** and **Enviar**. No document library.

### Code and title

- Code: `COT-MMDDYY` (month, day, 2-digit year). Same day: `COT-MMDDYY-2`.
- Title: seller summary. Display: `COT-081726 — CCTV 16 canales`.

### Fields

- Client, category, subcategory, sucursal, amount (no line-items), sellers + commission %, notes, PDF.
- Optional **plazo final** (`plazoFinal`) and **fecha de envío** (`fechaEnvio`).
- Optional flag **`tieneLicitacion`**: uploading annex files (`licitacionArchivos`) sets it to `true`. Indicates institutional/priority weight — not a quotation workflow state. Badge: «Con licitación». Does not replace the commercial PDF.

### Search chips (quotations view only)

- **Estado** chips: filled / primary style.
- **Principales** (Seguridad electrónica, Equipos y tecnología, Proyectos): fixed; used as the form category.
- **Pseudo-categorías** (Settings gear dialog): create/delete only; filter chips + subcategory options when creating/editing. Not a global client taxonomy.

### Tareas de cotización (band on `/quotations`)

Component: `QuotationTasksBand.jsx` — pool list always visible; **Nueva tarea** (outline/navy, distinct from lima **Nueva cotización**) opens a quick-create dialog (`QuotationTaskCreateModal`).

**Publish** creates both a Quotation `borrador` (auto number from the first line of the description; client optional) and a Task `tipo=cotizacion` in the pool. The create dialog is minimal: **description is required**; client, plazo, priority, files, and assignee sit behind optional extras. Toast: **Tarea publicada**.

Band shows only `tipo=cotizacion` with `estado != completada`. Each row leads with the **description** (line-clamp), then quote number, Creó + createdAt, plazo (**Vence en 48 h** / **Vencido**), editable priority, state (Disponible / Asignada / En proceso), encargado. Click opens the draft in `NewQuotationForm` (observations editable). **Hacerme cargo** / **Designar**; advance to en proceso / completada (completed leave the list). Poll ~10s + refresh after mutations.

The floating **Tareas** FAB is not used for this flow.

### Trabajos asociados

`QuotationJobsBlock` lists schedules by `quotationId`: monto, adelanto, saldo (adeudo), estado, dates. Filters: `GET /schedules?quotationId=` / `?clienteId=`.

### States

```
borrador → enviado → aceptado | rechazado
```

Records are **not deleted**. `aceptado` can open a sale once.

---

## Code

- UI form: `NewQuotationForm.jsx` (create + edit)
- Tasks band: `QuotationTasksBand.jsx` + `QuotationTaskCreateModal.jsx`
- Jobs: `QuotationJobsBlock.jsx`
- List: `QuotationsLibraryPage.jsx`
- Service: `apps/web/src/services/quotations/index.js`
- API: `apps/api` + `VITE_API_MODE=api`. Default SPA remains mock.
