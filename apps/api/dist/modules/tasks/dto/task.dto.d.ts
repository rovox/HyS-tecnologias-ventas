export declare class CreateTaskDto {
    clienteId?: string;
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
    clienteId?: string;
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
