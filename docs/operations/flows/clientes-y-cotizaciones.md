# Flujo — Clientes y cotizaciones

Modules: `/clientes`, `/quotations`  
Owner: **Ventas / Admin**. Read: técnicos and finance.

Form: `apps/web/src/components/NewQuotationForm.jsx` (do not duplicate).

---

## Clients

Official directory: name, contact, phone, email, address, notes. Category on the client is **optional** — the same client can have quotations/jobs across categories.

List (`/clientes`): activity summary (active/inactive, open jobs, quotation count, recent tasks). No monto/saldo on this view. Detail (eye) opens full history: cotizaciones, relevamientos, ventas/trabajos.

**Never delete** clients (UI and API). Edit general data only.

Accepting a quotation (`POST /api/quotations/:id/accept`) opens a frozen `Sale`. Optional next step: create a **Schedule** job (`POST /api/schedules`) linked via `quotationId` for the calendar / Activity overlay.

Sucursales: **Central, Punata, Quillacollo** only.

---

## Commercial quotation

Two save actions: **Guardar borrador** and **Enviar**. No document library.

### Code and title

- Code: `COT-MMDDYY` (month, day, 2-digit year). Same day: `COT-MMDDYY-2`.
- Title: seller summary. Display: `COT-081726 — CCTV 16 canales`.

### Fields

- Client (search or create), category, subcategory, sucursal, amount (no line-items), sellers + commission %, notes, PDF.
- Creator starts at **100%** commission. Extra sellers must make the total 100%.
- PDF required to **Enviar**. Optional on draft. Bytes go to the API (`UPLOAD_DIR`); the row stores `archivoPdfUrl`.

### States

```
borrador → enviado → aceptado | rechazado
```

Records are **not deleted**. `aceptado` can open a sale once; the quotation stays `aceptado`.

---

## Code

- UI form: `NewQuotationForm.jsx`
- List: `QuotationsLibraryPage.jsx`
- Service: `apps/web/src/services/quotations/index.js`
- API: `apps/api` + `VITE_API_MODE=api`. Default SPA remains mock.
