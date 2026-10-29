// Direct sales (VD-01): products sold from one branch and paid on the spot. Pure TS, no Nest, no Prisma.

/** Every branch is supplied by Central (owner 2026-10-27): a seller sells from his branch or from Central. */
const CENTRAL_SUCURSAL_ID = 'suc_central';
export const PAYMENT_METHODS = ['efectivo', 'qr', 'transferencia'] as const;

const cents = (value: number) => Math.round(value * 100) / 100;

export type SaleLineInput = { cantidad: number; precioUnitario: number; descuento?: number };
export type PaymentInput = { medio: string; monto: number };

/** Line and sale totals: a line is quantity × price − its discount; the sale may take one more discount. */
export function saleTotals(lines: SaleLineInput[], descuentoVenta = 0) {
  const items = lines.map((l) => ({ ...l, descuento: cents(l.descuento ?? 0), subtotal: cents(l.cantidad * l.precioUnitario - (l.descuento ?? 0)) }));
  const subtotal = cents(items.reduce((sum, l) => sum + l.subtotal, 0));
  return { items, subtotal, descuento: cents(descuentoVenta), total: cents(subtotal - descuentoVenta) };
}

/** Why a sale cannot be registered, or null. `available[productoId]` = stock of the branch it leaves from. */
export function saleError(lines: (SaleLineInput & { productoId: string })[], descuentoVenta: number, pagos: PaymentInput[], available: Record<string, number>): string | null {
  if (!lines.length) return 'Agrega al menos un producto';
  for (const l of lines) {
    if (!(l.cantidad > 0)) return 'La cantidad debe ser mayor a 0';
    if (l.precioUnitario < 0) return 'El precio no puede ser negativo';
    if ((l.descuento ?? 0) < 0 || (l.descuento ?? 0) > l.cantidad * l.precioUnitario) return 'El descuento de una línea no puede ser mayor a su importe';
  }
  const needed = new Map<string, number>();
  for (const l of lines) needed.set(l.productoId, (needed.get(l.productoId) ?? 0) + l.cantidad);
  for (const [id, qty] of needed) if ((available[id] ?? 0) < qty) return `Stock insuficiente en la sucursal: hay ${available[id] ?? 0}`;
  const { subtotal, total } = saleTotals(lines, descuentoVenta);
  if (descuentoVenta < 0 || descuentoVenta > subtotal) return 'El descuento no puede ser mayor al subtotal';
  if (!pagos.length && total > 0) return 'Indica cómo se pagó';
  for (const p of pagos) {
    if (!(PAYMENT_METHODS as readonly string[]).includes(p.medio)) return 'Medio de pago no válido';
    if (!(p.monto > 0)) return 'Cada pago debe ser mayor a 0';
  }
  const paid = cents(pagos.reduce((sum, p) => sum + p.monto, 0));
  if (paid !== total) return `Los pagos (Bs ${paid.toFixed(2)}) no suman el total (Bs ${total.toFixed(2)})`;
  return null;
}

/** May this person sell from this branch? Gerencia from any; a seller from his own branch or from Central. */
export function canSellFromBranch(actor: { manager: boolean; seller: boolean; sucursalId?: string | null }, sucursalId: string) {
  if (actor.manager) return true;
  return actor.seller && (sucursalId === actor.sucursalId || sucursalId === CENTRAL_SUCURSAL_ID);
}

type Box = { id: string; tipo: string; sucursalId: string; active: boolean };
/**
 * The box a payment goes to: cash → the cash box of the branch (Central's main box or the branch's petty cash),
 * QR → the QR box, transfer → the bank. Null when it does not exist (the sale is refused, no silent default).
 */
export function boxForPayment(medio: string, sucursalId: string, boxes: Box[]): string | null {
  const active = boxes.filter((b) => b.active);
  if (medio === 'efectivo') return active.find((b) => b.sucursalId === sucursalId && ['caja', 'caja_chica'].includes(b.tipo))?.id ?? null;
  const tipo = medio === 'qr' ? 'qr' : medio === 'transferencia' ? 'banco' : null;
  if (!tipo) return null;
  // By id, so with two QR boxes (primary `caja_qr`, secondary `caja_qr_socia`) a sale always goes to the primary one.
  const byId = active.filter((b) => b.tipo === tipo).sort((a, b) => a.id.localeCompare(b.id));
  return (byId.find((b) => b.sucursalId === sucursalId) ?? byId[0])?.id ?? null;
}

/** NV-0445. */
export const saleNumber = (numero: number) => `NV-${String(numero).padStart(4, '0')}`;

/** Only a registered sale is annulled, with a reason. */
export function annulError(sale: { estado: string }, motivo?: string | null): string | null {
  if (sale.estado === 'anulada') return 'La venta ya está anulada';
  if (!motivo?.trim()) return 'Indica el motivo de la anulación';
  return null;
}
