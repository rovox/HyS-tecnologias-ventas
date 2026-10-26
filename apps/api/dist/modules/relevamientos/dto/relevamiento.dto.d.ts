declare class VisitFieldsDto {
    sucursalId?: string;
    fecha: string;
    fechaFin?: string;
    hora?: string;
    tipoVisita?: string;
    prioridad?: string;
    vendedorId?: string;
    tecnicoId?: string;
    lugar: string;
    mapsLink?: string;
    notas?: string;
    motivo?: string;
    problemaReportado?: string;
    equipoAfectado?: string;
    causaProbable?: string;
    diagnostico?: string;
    solucion?: string;
    requiereMaterial?: boolean;
    requiereVolver?: boolean;
    trabajoRelacionadoId?: string;
    garantiaHasta?: string;
    necesidadCliente?: string;
    areaRevisar?: string;
    medidasPuntos?: string;
    cantidadEstimada?: number | null;
    observacionTecnica?: string;
    requiereCotizacion?: boolean;
    observacionFinal?: string;
}
export declare class CreateRelevamientoDto extends VisitFieldsDto {
    cotizacionId?: string;
    clienteId?: string;
}
declare const UpdateRelevamientoDto_base: import("@nestjs/common").Type<Partial<VisitFieldsDto>>;
export declare class UpdateRelevamientoDto extends UpdateRelevamientoDto_base {
}
export declare class VisitStatusDto {
    estado: string;
    motivo?: string;
}
export declare class VisitPaymentDto {
    monto: number;
    metodo?: string;
    nota?: string;
    recibidoPorId?: string;
}
export {};
