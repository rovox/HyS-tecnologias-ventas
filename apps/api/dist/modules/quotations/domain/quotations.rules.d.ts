import type { TransitionCheck } from '../../../common/domain/state-machine';
type QuoteState = {
    estado: string;
    eliminadaAt?: Date | string | null;
};
export declare function nextStates(quote: QuoteState): readonly string[];
export declare function checkQuotationTransition(quote: QuoteState & {
    archivoPdfUrl?: string | null;
}, to: string, input?: {
    motivo?: string | null;
}): TransitionCheck;
type AcceptableQuote = QuoteState & {
    clienteId?: string | null;
};
export declare function acceptError(quote: AcceptableQuote): string | null;
export declare function expiresAt(fechaEnvio: Date | string | null | undefined): Date | null;
export declare function expiryCutoff(now: Date): Date;
export declare function isExpired(quote: QuoteState & {
    fechaEnvio?: Date | string | null;
}, now: Date): boolean;
export declare function deleteError(quote: QuoteState, motivo?: string | null): string | null;
export declare function restoreError(quote: QuoteState): string | null;
export declare function editError(quote: QuoteState, changes: Record<string, unknown>): string | null;
export declare function vistaFilter(vista?: string): {
    estados: readonly string[];
    eliminadas: boolean | null;
} | null;
export {};
