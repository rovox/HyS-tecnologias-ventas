export declare class CreateScheduleDto {
    type: string;
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
