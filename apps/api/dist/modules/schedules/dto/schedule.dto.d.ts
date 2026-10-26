export declare class CreateScheduleDto {
    categoriaId?: string;
    clienteId: string;
    descripcionTrabajo: string;
    sucursalId: string;
    fechaProgramada: string;
    lugar?: string;
    monto?: number;
    adelanto?: number;
    horario?: string;
    vendedorId?: string;
    tecnicoId?: string;
    quotationId?: string;
    observaciones?: string;
    mapsLink?: string;
    estado?: string;
}
export declare class UpdateScheduleDto {
    categoriaId?: string;
    lugar?: string;
    descripcionTrabajo?: string;
    monto?: number;
    adelanto?: number;
    fechaProgramada?: string;
    horario?: string;
    vendedorId?: string;
    tecnicoId?: string;
    observaciones?: string;
    mapsLink?: string;
    estado?: string;
    fechaFinalizacion?: string;
}
export declare class ScheduleStatusDto {
    estado: string;
    fechaFinalizacion?: string;
}
export declare class CreateSchedulePaymentDto {
    tipo: string;
    monto: number;
    metodo?: string;
    nota?: string;
    relevamientoId?: string;
    quotationId?: string;
    recibidoPorId?: string;
}
