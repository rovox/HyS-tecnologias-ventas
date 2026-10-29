export declare class FirstEntryDto {
    cantidad: number;
    costoUnitario: number;
    sucursalId: string;
    nota?: string;
}
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
    stockInicial?: FirstEntryDto;
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
export declare class StockBatchLineDto {
    productoId: string;
    cantidad: number;
    costoUnitario?: number;
}
export declare class StockBatchDto {
    tipo: string;
    sucursalOrigenId?: string;
    sucursalDestinoId?: string;
    projectId?: string;
    motivo?: string;
    nota?: string;
    items: StockBatchLineDto[];
}
export declare class ListMovementsQuery {
    productoId?: string;
    sucursalId?: string;
    tipos?: string;
    desde?: string;
    hasta?: string;
}
