export declare class VendorDto {
    userId: string;
    nombre?: string;
    commissionPct?: number;
}
export declare class CreateQuotationDto {
    tareaId?: string;
    titulo?: string;
    clienteId?: string;
    categoriaId: string;
    subcategoria?: string;
    sucursalId?: string;
    sucursalNombre?: string;
    monto: number;
    observacion?: string;
    archivo?: string;
    vendedores?: VendorDto[];
    tieneLicitacion?: boolean;
    licitacionNumero?: string;
    licitacionEntidad?: string;
    plazoFinal?: string;
}
export declare class UpdateQuotationDto {
    titulo?: string;
    categoriaId?: string;
    subcategoria?: string;
    monto?: number;
    clienteId?: string;
    fechaEnvio?: string;
    observacion?: string;
    vendedores?: VendorDto[];
    tieneLicitacion?: boolean;
    licitacionNumero?: string;
    licitacionEntidad?: string;
    plazoFinal?: string;
}
export declare class StatusDto {
    estado: string;
    motivoRechazo?: string;
    fechaEnvio?: string;
}
export declare class DeleteQuotationDto {
    motivo: string;
}
export declare class ListQuotationsQuery {
    vista?: 'abiertas' | 'cerradas';
    estado?: string;
    categoriaId?: string;
    vendedorId?: string;
    sucursalId?: string;
    clienteId?: string;
    q?: string;
}
export declare class AcceptQuotationDto {
    fechaProgramada?: string;
    lugar?: string;
    tecnicoId?: string;
    horario?: string;
}
