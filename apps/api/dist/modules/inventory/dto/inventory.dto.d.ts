export declare class CreateProductDto {
    codigo: string;
    nombre: string;
    marca?: string;
    categoriaId: string;
    tipo: string;
    unidad?: string;
    costo?: number;
    precio?: number;
    stockMinimo?: number;
}
export declare class UpdateProductDto {
    nombre?: string;
    marca?: string;
    categoriaId?: string;
    tipo?: string;
    unidad?: string;
    costo?: number;
    precio?: number;
    stockMinimo?: number;
    active?: boolean;
}
export declare class StockMovementDto {
    productoId: string;
    tipo: string;
    cantidad: number;
    costoUnitario?: number;
    sucursalOrigenId?: string;
    sucursalDestinoId?: string;
    projectId?: string;
    motivo?: string;
    nota?: string;
}
