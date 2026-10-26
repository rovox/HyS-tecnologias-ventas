import type { TransitionCheck } from '../../../common/domain/state-machine';
export declare function checkScheduleTransition(from: string, to: string): TransitionCheck;
export declare function categoryChangeError(current: {
    quotationId?: string | null;
    categoriaId: string;
}, requested?: string): string | null;
export declare function montoChangeError(current: {
    projectId?: string | null;
    monto: number | string | {
        toString(): string;
    };
}, requested?: number): string | null;
