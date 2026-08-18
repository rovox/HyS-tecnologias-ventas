# Plan API fase 1 — cotizaciones y ventas

Migración PocketBase → **NestJS + Prisma + MySQL** en Hostinger. Primera entrega: **un microservicio** (un Node Web App) solo para el dominio comercial. El resto del ERP sigue en el frontend mock.

Contrato UI actual: `apps/web/src/services/quotations` y `clients`. No reimplementar cronograma completo aquí.

---

## Alcance (sí / no)

| Incluye | No incluye (fases posteriores) |
|---------|--------------------------------|
| Auth mínima (login JWT) | Finanzas, cajas, vehículos |
| Clientes (CRUD corto, necesario para cotizar) | Pedidos internos, marketing |
| Cotizaciones comerciales + adjuntos | Calendario / cronograma de campo |
| Aceptar cotización → **venta** | Nest monolito con todos los módulos |
| Trabajos **dentro de la venta** (delegación) | PocketBase removal |
| Pagos contra el monto de la venta | Relevamientos / visitas |

**Cronograma:** se seguirá usando el POC/mock. Esta API no es el dueño del calendario; como máximo guarda `sale.jobs[]` con estado y monto, sin UI de agenda.

---

## Lógica de negocio

```
Cliente
  └── Cotización (enviada)  monto, vendedores+%, adjuntos
        └── aceptada
              └── Venta (sale)
                    ├── total = quotation.total
                    ├── cobrado = Σ payments
                    ├── saldo = total − cobrado
                    └── Trabajos (jobs) delegados al equipo
```

Reglas:

1. Alta de cotización = `enviada`. Código `COT-MMDDYY` (+ sufijo si hay colisión el mismo día).
2. Sin líneas de ítems. `total` es el monto declarado; el detalle está en archivos.
3. Comisión del creador = 100% si es el único vendedor.
4. `POST /quotations/:id/accept` crea la venta (una sola vez).
5. Trabajos no pueden sumar más que `sale.total` (aviso o bloqueo configurable).
6. Pagos no pueden superar `sale.total`.
7. Rechazar cotización no crea venta.

---

## Servicio Hostinger (fase 1)

Un Web App Node 22:

```
apps/api-sales/          ← microservicio (nuevo, no inflar apps/api placeholder)
  src/
    auth/
    clients/
    quotations/
    sales/               ← ventas + jobs + payments
    files/               ← upload PDF/imagen (disco o S3 compatible)
  prisma/
```

Nombre sugerido de app: `hys-sales-api`. Base path: `/api`. El frontend apunta `VITE_API_MODE=api` y `VITE_API_URL`.

PocketBase queda como referencia de colecciones (`quotations`, `clientes`, `users`). No se arranca en esta fase.

---

## Orden de implementación

1. **Scaffold Nest + Prisma + MySQL** en Hostinger (un schema, un deploy).
2. **Auth:** `POST /auth/login` con los mismos 4 roles del POC. JWT.
3. **Clients:** CRUD mínimo (`nombre`, contacto, sucursal).
4. **Quotations:** create (enviada), list/filter, status, upload files.
5. **Sales:** `accept` → venta; `POST /sales/:id/jobs`; `POST /sales/:id/payments`.
6. **Swap frontend:** repositorios HTTP detrás de `quotationsService` / `clientsService` (mismo contrato). Sin reescribir pantallas.

No empezar por cronograma, reportes ni Nest “completo”.

---

## Endpoints fase 1

### Auth
- `POST /auth/login` `{ email, password }` → `{ user, accessToken }`
- `GET /auth/me`
- `POST /auth/logout`

### Clients
- `GET /clients?q=`
- `POST /clients`
- `GET /clients/:id`
- `PATCH /clients/:id`

### Quotations
- `GET /quotations?estado=&vendedorId=&sucursalId=`
- `POST /quotations` `{ titulo, clienteId, categoria, subcategoria, sucursalId, monto, vendedores[], observacion }`
- `GET /quotations/:id`
- `POST /quotations/:id/files` multipart PDF/imagen
- `POST /quotations/:id/status` `{ estado: aceptada | rechazada }`
- `POST /quotations/:id/accept` → `{ quotation, sale }`

### Sales
- `GET /sales`
- `GET /sales/:id` (jobs + payments + saldo)
- `POST /sales/:id/jobs` `{ titulo, asignadoId?, monto? }`
- `PATCH /sales/:id/jobs/:jobId` `{ estado }`
- `POST /sales/:id/payments` `{ monto, metodo, nota }`

Estados job (mínimos, alineados al ERP): `programado | en_proceso | terminado | cancelado`.

---

## Modelo Prisma (borrador)

```
User, Client, Branch
Quotation (numero, titulo, estado, monto, cliente, sucursal, files)
QuotationSeller (userId, commissionPct)
Sale (quotationId unique, total, status)
SaleJob (saleId, titulo, estado, monto)
SalePayment (saleId, monto, metodo)
```

IDs: UUID. `numero` unique.

---

## Criterios de listo

- [ ] Login demo funciona contra Nest
- [ ] Crear cotización desde `NewQuotationForm` persiste en MySQL
- [ ] Adjunto PDF/imagen recuperable
- [ ] Aceptar → venta con saldo = monto
- [ ] Registrar pago reduce saldo
- [ ] Un job no rompe el total de la venta
- [ ] Cronograma UI no depende de esta API

---

## Fases siguientes (no hacer ahora)

2. Operaciones / cronograma (calendario, visitas)
3. Pedidos internos
4. Finanzas
5. Apagar PocketBase

Ver [backend-status.md](./backend-status.md) y [frontend-backend-contract.md](./frontend-backend-contract.md).
