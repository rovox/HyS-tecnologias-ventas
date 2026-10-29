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
    responsableId?: string;
    asunto?: string;
    fechaLimite?: string;
}
export declare class SettleAdvanceDto {
    nota?: string;
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
    sucursalId?: string;
}
export declare class ExportMovementsQuery extends ListMovementsQuery {
    formato: 'csv' | 'xlsx';
}
export declare class IncomeDto {
    concepto: string;
    monto: number;
    metodo?: string;
    nota?: string;
    recibidoPorId?: string;
    cuentaDestino?: 'qr_empresa' | 'qr_socia' | 'qr_personal';
}
