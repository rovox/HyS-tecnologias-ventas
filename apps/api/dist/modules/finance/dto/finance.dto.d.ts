export declare class CreateMovementDto {
    tipo: string;
    concepto: string;
    monto: number;
    fecha?: string;
    metodo?: string;
    nota?: string;
    projectId?: string;
    cajaId?: string;
    cajaDestinoId?: string;
    pagadoPor?: string;
    sucursalId?: string;
}
export declare class UpdateMovementDto {
    concepto?: string;
    monto?: number;
    fecha?: string;
    metodo?: string;
    nota?: string;
    pagadoPor?: string;
    recibidoPorId?: string;
    cajaId?: string;
}
export declare class ImpactQuery {
    accion: 'validar' | 'anular';
    cajaId?: string;
}
export declare class ValidateMovementDto {
    cajaId?: string;
}
export declare class ReasonDto {
    motivo: string;
}
export declare class ListMovementsQuery {
    tipo?: string;
    estado?: string;
    cajaId?: string;
    projectId?: string;
    clienteId?: string;
    desde?: string;
    hasta?: string;
}
export declare class IncomeDto {
    concepto: string;
    monto: number;
    metodo?: string;
    nota?: string;
    recibidoPorId?: string;
}
