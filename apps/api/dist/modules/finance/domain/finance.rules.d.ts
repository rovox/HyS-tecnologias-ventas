import type { TransitionCheck } from '../../../common/domain/state-machine';
export declare const MOVEMENT_TIPOS: readonly ["ingreso", "egreso", "transferencia"];
export declare const MOVEMENT_ESTADOS: string[];
type Movement = {
    tipo: string;
    concepto: string;
    monto: number | string | {
        toString(): string;
    };
    estado: string;
    cajaId?: string | null;
    cajaDestinoId?: string | null;
};
export type MovementInput = {
    tipo: string;
    concepto: string;
    monto: number;
    cajaId?: string | null;
    cajaDestinoId?: string | null;
    pagadoPor?: string | null;
};
export declare function movementError(input: MovementInput): string | null;
export declare function nextMovementStates(estado: string): readonly string[];
export declare function checkMovementTransition(movement: {
    estado: string;
    tipo: string;
}, to: string, input: {
    cajaId?: string | null;
    motivo?: string | null;
}): TransitionCheck;
export declare function editMovementError(movement: {
    estado: string;
}, canManageMoney: boolean): string | null;
export declare function incomeOf(movements: Movement[]): {
    cobrado: number;
    porValidar: number;
    adicionales: number;
};
export declare function expensesOf(movements: Movement[]): number;
export declare function balanceOf(monto: number, cobrado: number, cancelled: boolean): number;
export declare function incomeConceptError(target: 'visita' | 'trabajo', concepto: string): string | null;
export declare function incomeError(target: {
    monto: number;
    cobrado: number;
    cancelled: boolean;
    closed?: boolean;
}, concepto: string, monto: number): string | null;
export declare function cashBoxBalance(cajaId: string, movements: Movement[]): number;
export declare function pendingRefund(m: {
    tipo: string;
    pagadoPor?: string | null;
    reembolsadoAt?: Date | string | null;
    estado: string;
}): boolean;
export declare function custody<T extends Movement & {
    recibidoPorId?: string | null;
}>(movements: T[]): {
    userId: string;
    total: number;
    cantidad: number;
    movimientos: T[];
}[];
export type Impact = {
    tipo: 'caja';
    cajaId: string;
    antes: number;
    despues: number;
} | {
    tipo: 'saldo';
    antes: number;
    despues: number;
} | {
    tipo: 'costo';
    antes: number;
    despues: number;
};
export declare function movementImpact(m: Movement & {
    monto: number | string | {
        toString(): string;
    };
}, accion: 'validar' | 'anular', ctx: {
    boxes: Record<string, number>;
    cajaId?: string | null;
    target?: {
        monto: number;
        cobrado: number;
        costo: number;
        cancelled: boolean;
    } | null;
}): Impact[];
export {};
