type Named = {
    nombre?: string | null;
    name?: string | null;
    codigo?: string | null;
} | null | undefined;
export type ExportMovement = {
    fecha: Date | string;
    tipo: string;
    concepto: string;
    monto: number | string | {
        toString(): string;
    };
    estado: string;
    nota?: string | null;
    caja?: Named;
    cajaDestino?: Named;
    sucursal?: Named;
    project?: Named;
    cliente?: Named;
    registradoPor?: Named;
    recibidoPor?: Named;
};
export type LedgerRow = {
    fecha: string;
    hora: string;
    tipo: string;
    concepto: string;
    monto: number;
    estado: string;
    caja: string;
    sucursal: string;
    proyecto: string;
    cliente: string;
    registro: string;
    tieneDinero: string;
    nota: string;
};
export declare const LEDGER_COLUMNS: [keyof LedgerRow, string][];
export declare function ledgerRows(movements: ExportMovement[]): LedgerRow[];
export type LedgerSummary = {
    ingresos: number;
    egresos: number;
    neto: number;
    porValidar: {
        cantidad: number;
        monto: number;
    };
    anulados: number;
    porConcepto: {
        concepto: string;
        monto: number;
    }[];
};
export declare function ledgerSummary(movements: ExportMovement[]): LedgerSummary;
export {};
