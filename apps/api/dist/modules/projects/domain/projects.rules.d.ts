import type { TransitionCheck } from '../../../common/domain/state-machine';
export declare const PROJECT_ESTADOS: string[];
type ProjectState = {
    estado: string;
};
export declare function nextProjectStates(project: ProjectState): readonly string[];
export declare function checkProjectTransition(project: ProjectState, to: string, ctx: {
    saldo: number;
    isAdmin: boolean;
    motivo?: string | null;
    openJobs?: number;
}): TransitionCheck;
export declare function warranty(entregadoAt: Date | string | null | undefined, meses: number, now: Date): {
    hasta: null;
    vigente: boolean;
} | {
    hasta: Date;
    vigente: boolean;
};
export declare function montoChangeError(ctx: {
    isAdmin: boolean;
    estado: string;
}, monto: number, motivo?: string | null): string | null;
export declare function newJobError(project: ProjectState): string | null;
export declare const projectCode: (quotationNumero: string) => string;
export type JobOptions = {
    fechaProgramada?: string;
    lugar?: string;
    tecnicoId?: string;
    horario?: string;
};
type QuoteForProject = {
    id: string;
    numero: string;
    titulo: string;
    categoriaId: string;
    monto: number;
    clienteId: string;
    sucursalId: string;
    vendedorId?: string | null;
};
export declare function firstJobFromQuotation(quote: QuoteForProject, clientAddress: string, options: JobOptions, now: Date): {
    categoriaId: string;
    clienteId: string;
    lugar: string;
    descripcionTrabajo: string;
    monto: number;
    adelanto: number;
    saldo: number;
    fechaProgramada: Date;
    horario: string | null;
    estado: string;
    sucursalId: string;
    vendedorId: string | null;
    tecnicoId: string | null;
    quotationId: string;
};
export {};
