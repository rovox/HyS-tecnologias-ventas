# Quotations (Cotizaciones) — priority 1

**Status:** 🟡 list and form load for admin and ventas; the new rules (items, discount, expiry, templates) are not built.

## Purpose
A Cotización is the technical-economic proposal with items. It is the **only place where a discount exists**. Flow: `borrador → enviada → aceptada | rechazada | vencida`. Accepting it creates a **Proyecto** (official amount = quotation total, immutable). A products-only quotation can become a Venta directa.

## Health (S1, 2026-10-12, with the PLAT-01 temporary fix)
| Screen | admin | ventas | técnico |
|---|---|---|---|
| `/quotations` | ✅ | ✅ | not allowed (S7 not run; the API answered 403 on `/api/quotations`) |
| New/edit form, PDF, accept/reject | not run | not run | – |

## Checklist
- [ ] COT-01 Catalog + `QuotationItem` (products, labor), totals computed in the API.
- [ ] COT-02 Discount (ventas, admin only), expiry after 15 days → state `vencida`, PDF with H&S brand.
- [ ] COT-03 Atomic numbering (GAP-05); implement the `rechazado` branch with reason; categories from `/categories`.
- [ ] COT-04 Accept → create the Proyecto in one API call; move `convertToSchedule` rules out of the UI (GAP-07).
- [ ] COT-05 Templates by job type (later, owner decision), Contabilidad review.

## Smoke steps
1. Ventas: create a quotation with a PDF → it appears without reload (S2).
2. Send, then accept → a Proyecto exists (S3).
3. Técnico opens `/quotations` → redirected; API 403 (S7).
