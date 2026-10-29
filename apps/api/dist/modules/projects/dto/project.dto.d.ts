export declare class ListProjectsQuery {
    estado?: string;
    clienteId?: string;
}
export declare class UpdateProjectDto {
    titulo?: string;
    garantiaMeses?: number;
    responsableId?: string;
}
export declare class ProjectStatusDto {
    estado: string;
    motivo?: string;
}
export declare class CreateProjectJobDto {
    descripcionTrabajo: string;
    fechaProgramada: string;
    horario?: string;
    tecnicoId?: string;
    lugar?: string;
}
export declare class ProjectAmountDto {
    montoOficial: number;
    motivo: string;
}
export declare class ProjectPaymentDto {
    concepto: string;
    monto: number;
    metodo?: string;
    nota?: string;
    recibidoPorId?: string;
    cuentaDestino?: 'qr_empresa' | 'qr_socia' | 'qr_personal';
}
