export declare class PedidoItemDto {
    productoId?: string;
    materialNombre: string;
    cantidad: number;
    unidad?: string;
    costoUnitario?: number;
    observaciones?: string;
}
export declare class UpsertPedidoInternoDto {
    responsableId?: string;
    sucursalOrigenId?: string;
    sucursalDestinoId?: string;
    cronogramaId?: string;
    prioridad?: string;
    estado?: string;
    fechaEntregaEstimada?: string;
    observaciones?: string;
    items?: PedidoItemDto[];
}
export declare class UpdateEstadoPedidoDto {
    estado: string;
    fecha_entrega?: string;
    entregado_por_id?: string;
    observacion?: string;
}
export declare class AddComentarioDto {
    contenido: string;
}
