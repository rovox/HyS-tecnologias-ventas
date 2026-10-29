export declare class DirectSaleLineDto {
    productoId: string;
    cantidad: number;
    precioUnitario: number;
    descuento?: number;
}
export declare class DirectSalePaymentDto {
    medio: string;
    monto: number;
}
export declare class CreateDirectSaleDto {
    sucursalId: string;
    clienteId?: string;
    clienteNombre?: string;
    clienteCelular?: string;
    clienteNit?: string;
    items: DirectSaleLineDto[];
    descuento?: number;
    pagos: DirectSalePaymentDto[];
    reemplazaAId?: string;
}
export declare class AnnulDirectSaleDto {
    motivo: string;
}
export declare class ListDirectSalesQuery {
    sucursalId?: string;
    vendedorId?: string;
    estado?: string;
    desde?: string;
    hasta?: string;
}
