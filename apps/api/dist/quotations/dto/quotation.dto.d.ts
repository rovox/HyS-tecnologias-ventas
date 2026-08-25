export declare class VendorDto {
    userId: string;
    nombre?: string;
    commissionPct?: number;
}
export declare class CreateQuotationDto {
    titulo?: string;
    clienteId?: string;
    categoria?: string;
    categoriaId?: string;
    subcategoria?: string;
    sucursalId?: string;
    sucursalNombre?: string;
    monto?: number;
    observacion?: string;
    archivo?: string;
    estado?: string;
    vendedores?: VendorDto[];
    tieneLicitacion?: boolean;
    licitacionNumero?: string;
    licitacionEntidad?: string;
    plazoFinal?: string;
}
export declare class UpdateQuotationDto {
    titulo?: string;
    categoria?: string;
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
