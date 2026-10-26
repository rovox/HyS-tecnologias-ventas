import type { TransitionCheck } from '../../../common/domain/state-machine';
export declare function nextVisitStates(estado: string): readonly string[];
export declare function checkVisitTransition(from: string, to: string, ctx: {
    fotos: number;
    motivo?: string | null;
}): TransitionCheck;
export declare function isClosed(estado: string): boolean;
type JobForWarranty = {
    estado: string;
    fechaProgramada: Date;
    fechaFinalizacion?: Date | null;
    project?: {
        estado: string;
        entregadoAt?: Date | null;
        garantiaMeses: number;
    } | null;
};
export declare function warrantyUntil(job: JobForWarranty): Date | null;
export declare function inWarranty(garantiaHasta: Date | null | undefined, fecha: Date): boolean | null;
export declare function visitPayments(movements: {
    monto: number | string | {
        toString(): string;
    };
    estado: string;
}[]): {
    cobrado: number;
    porRendir: number;
};
export {};
