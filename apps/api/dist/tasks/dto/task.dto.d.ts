export declare class CreateTaskDto {
    titulo?: string;
    descripcion?: string;
    tipo?: string;
    sucursalId?: string;
    asignadoId?: string;
    prioridad?: string;
    prioridadMotivo?: string;
    plazo?: string;
    horario?: string;
    cotizacionId?: string;
    scheduleId?: string;
}
export declare class UpdateTaskDto {
    titulo?: string;
    descripcion?: string;
    asignadoId?: string;
    estado?: string;
    prioridad?: string;
    prioridadMotivo?: string;
    plazo?: string;
    horario?: string;
    cotizacionId?: string;
    scheduleId?: string;
}
