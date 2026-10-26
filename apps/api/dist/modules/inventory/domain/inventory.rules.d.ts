export declare const PRODUCT_TIPOS: readonly ["equipo", "material", "servicio"];
export declare const STOCK_TIPOS: readonly ["entrada", "salida_proyecto", "transferencia", "ajuste"];
type Qty = number | string | {
    toString(): string;
};
type StockMove = {
    cantidad: Qty;
    sucursalOrigenId?: string | null;
    sucursalDestinoId?: string | null;
};
export declare function stockBySede(movements: StockMove[]): Record<string, number>;
export declare const totalStock: (stock: Record<string, number>) => number;
export declare function isLowStock(product: {
    tipo: string;
    stockMinimo: Qty;
    active?: boolean;
}, total: number): boolean;
export type StockInput = {
    tipo: string;
    cantidad: number;
    sucursalOrigenId?: string | null;
    sucursalDestinoId?: string | null;
    projectId?: string | null;
    motivo?: string | null;
};
export declare function stockMovementError(input: StockInput, ctx: {
    productTipo: string;
    available: number;
    canAdjust: boolean;
}): string | null;
type DeliveredItem = {
    productoId?: string | null;
    cantidad: Qty;
    materialNombre: string;
};
export declare function movementsForDelivery(pedido: {
    sucursalOrigenId?: string | null;
    sucursalDestinoId?: string | null;
    projectId?: string | null;
    forJob?: boolean;
}, items: DeliveredItem[]): {
    productoId: string;
    tipo: 'transferencia' | 'salida_proyecto';
    cantidad: number;
    sucursalOrigenId: string;
    sucursalDestinoId: string | null;
    projectId: string | null;
}[] | string;
export declare function materialCost(movements: {
    tipo: string;
    cantidad: Qty;
    costoUnitario: Qty;
}[]): number;
export {};
