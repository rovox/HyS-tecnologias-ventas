// Inventory: products and stock per branch, always computed from stock movements (never stored by hand).
// Pure TS, no Nest, no Prisma.

export const PRODUCT_TIPOS = ['equipo', 'material', 'servicio'] as const;
export const STOCK_TIPOS = ['entrada', 'salida_proyecto', 'transferencia', 'ajuste'] as const;

type Qty = number | string | { toString(): string };
type StockMove = { cantidad: Qty; sucursalOrigenId?: string | null; sucursalDestinoId?: string | null };

const round = (value: number) => Math.round(value * 100) / 100;

/** Stock of one product per branch: what arrived minus what left. */
export function stockBySede(movements: StockMove[]): Record<string, number> {
  const stock: Record<string, number> = {};
  for (const m of movements) {
    const qty = Number(m.cantidad);
    if (m.sucursalDestinoId) stock[m.sucursalDestinoId] = round((stock[m.sucursalDestinoId] ?? 0) + qty);
    if (m.sucursalOrigenId) stock[m.sucursalOrigenId] = round((stock[m.sucursalOrigenId] ?? 0) - qty);
  }
  return stock;
}

export const totalStock = (stock: Record<string, number>) => round(Object.values(stock).reduce((s, q) => s + q, 0));

/** A product (not a service) at or below its minimum stock. */
export function isLowStock(product: { tipo: string; stockMinimo: Qty; active?: boolean }, total: number): boolean {
  return product.tipo !== 'servicio' && product.active !== false && Number(product.stockMinimo) > 0 && total <= Number(product.stockMinimo);
}

export type StockInput = {
  tipo: string;
  cantidad: number;
  sucursalOrigenId?: string | null;
  sucursalDestinoId?: string | null;
  projectId?: string | null;
  motivo?: string | null;
};

/**
 * Where stock comes from and goes: entrada → destination; salida_proyecto → origin and a project; transferencia →
 * origin and destination; ajuste → destination (surplus) or origin (shortage), with a reason. Never below zero.
 */
export function stockMovementError(input: StockInput, ctx: { productTipo: string; available: number; canAdjust: boolean }): string | null {
  if (!STOCK_TIPOS.includes(input.tipo as never)) return `Tipo de movimiento no válido: ${input.tipo}`;
  if (ctx.productTipo === 'servicio') return 'Un servicio no tiene stock';
  if (!(Number(input.cantidad) > 0)) return 'La cantidad debe ser mayor a 0';
  const from = input.sucursalOrigenId;
  const to = input.sucursalDestinoId;
  if (input.tipo === 'entrada' && (!to || from)) return 'Una entrada necesita solo la sucursal de destino';
  if (input.tipo === 'salida_proyecto' && (!from || to || !input.projectId)) return 'Una salida a proyecto necesita la sucursal de origen y el proyecto';
  if (input.tipo === 'transferencia' && (!from || !to)) return 'Una transferencia necesita sucursal de origen y de destino';
  if (input.tipo === 'transferencia' && from === to) return 'La sucursal de origen y destino deben ser distintas';
  if (input.tipo === 'ajuste') {
    if (!ctx.canAdjust) return 'Solo Gerencia o Contabilidad ajustan el inventario';
    if (Boolean(from) === Boolean(to)) return 'Un ajuste es un sobrante (destino) o un faltante (origen)';
    if (!input.motivo?.trim()) return 'Indica el motivo del ajuste';
  }
  if (from && Number(input.cantidad) > ctx.available) return `Stock insuficiente: hay ${round(ctx.available)} disponible(s)`;
  return null;
}

type DeliveredItem = { productoId?: string | null; cantidad: Qty; materialNombre: string };

/**
 * Stock movements of a delivered internal order: a branch order moves stock between branches; a job order takes it
 * out to the project (material cost). Free-text items (no product) move nothing.
 */
export function movementsForDelivery(
  pedido: { sucursalOrigenId?: string | null; sucursalDestinoId?: string | null; projectId?: string | null; forJob?: boolean },
  items: DeliveredItem[],
): { productoId: string; tipo: 'transferencia' | 'salida_proyecto'; cantidad: number; sucursalOrigenId: string; sucursalDestinoId: string | null; projectId: string | null }[] | string {
  const withProduct = items.filter((i) => i.productoId);
  if (!withProduct.length) return [];
  if (!pedido.sucursalOrigenId) return 'Indica la sucursal de origen del material';
  if (pedido.forJob && !pedido.projectId) return 'El trabajo no es de un proyecto: su material no se descuenta del inventario (quita el producto o usa texto libre)';
  if (!pedido.projectId && !pedido.sucursalDestinoId) return 'Indica el trabajo de un proyecto o la sucursal de destino';
  if (!pedido.projectId && pedido.sucursalDestinoId === pedido.sucursalOrigenId) return 'La sucursal de origen y destino deben ser distintas';
  return withProduct.map((i) => ({
    productoId: i.productoId!,
    tipo: pedido.projectId ? 'salida_proyecto' : 'transferencia',
    cantidad: Number(i.cantidad),
    sucursalOrigenId: pedido.sucursalOrigenId!,
    sucursalDestinoId: pedido.projectId ? null : (pedido.sucursalDestinoId ?? null),
    projectId: pedido.projectId ?? null,
  }));
}

/** Material cost of a project: what left the inventory to it, at the unit cost of each movement. */
export function materialCost(movements: { tipo: string; cantidad: Qty; costoUnitario: Qty }[]): number {
  return round(movements.filter((m) => m.tipo === 'salida_proyecto').reduce((s, m) => s + Number(m.cantidad) * Number(m.costoUnitario), 0));
}
