export declare const PAYMENT_METHODS: readonly ["efectivo", "qr", "transferencia"];
export type SaleLineInput = {
    cantidad: number;
    precioUnitario: number;
    descuento?: number;
};
export type PaymentInput = {
    medio: string;
    monto: number;
};
export declare function saleTotals(lines: SaleLineInput[], descuentoVenta?: number): {
    items: {
        descuento: number;
        subtotal: number;
        cantidad: number;
        precioUnitario: number;
    }[];
    subtotal: number;
    descuento: number;
    total: number;
};
export declare function saleError(lines: (SaleLineInput & {
    productoId: string;
})[], descuentoVenta: number, pagos: PaymentInput[], available: Record<string, number>): string | null;
export declare function canSellFromBranch(actor: {
    manager: boolean;
    seller: boolean;
    sucursalId?: string | null;
}, sucursalId: string): boolean;
type Box = {
    id: string;
    tipo: string;
    sucursalId: string;
    active: boolean;
};
export declare function boxForPayment(medio: string, sucursalId: string, boxes: Box[]): string | null;
export declare const saleNumber: (numero: number) => string;
export declare function annulError(sale: {
    estado: string;
}, motivo?: string | null): string | null;
export {};
