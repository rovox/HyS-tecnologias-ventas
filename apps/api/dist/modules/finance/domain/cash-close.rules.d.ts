export declare function countTotal(conteo: Record<string, number>): number;
export declare function countError(conteo: Record<string, unknown>): string | null;
export type CashMove = {
    id: string;
    tipo: string;
    concepto: string;
    monto: number | string | {
        toString(): string;
    };
    estado: string;
    metodo?: string | null;
    medioPago?: string | null;
    pagadoPor?: string | null;
    cajaId?: string | null;
    cajaDestinoId?: string | null;
    recibidoPorId?: string | null;
};
export declare function expectedCash(saldoInicial: number, movimientos: CashMove[], cajaId: string, counter?: Set<string>): {
    lines: {
        id: string;
        efecto: number;
    }[];
    ingresos: number;
    egresos: number;
    esperado: number;
};
export declare function otherMethods(movimientos: CashMove[]): {
    qr: number;
    transferencia: number;
};
export declare function closeError(diferencia: number, motivo?: string | null): string | null;
export declare function differenceMovement(diferencia: number): {
    tipo: string;
    concepto: string;
    monto: number;
    label: string;
} | null;
export declare function closeRequirements(input: {
    dia: string;
    today: string;
    closed: boolean;
    pendingDay: string | null;
}): {
    ok: boolean;
    texto: string;
}[];
export declare function reviewError(revisionEstado: string | null, action: 'aprobar' | 'observar', motivo?: string): string | null;
