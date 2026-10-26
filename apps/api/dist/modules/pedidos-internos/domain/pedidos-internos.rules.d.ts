import type { TransitionCheck } from '../../../common/domain/state-machine';
export declare const PEDIDO_ESTADOS: string[];
export declare function nextStates(estado: string): readonly string[];
export declare function checkTransition(from: string, to: string): TransitionCheck;
type ItemCost = {
    cantidad: number;
    costoUnitario?: number | null;
};
export declare function itemTotal(item: ItemCost): number;
export declare function pedidoTotal(items: ItemCost[]): number;
export declare function deliveryFields(estado: string, input: {
    fechaEntrega?: string;
    entregadoPorId?: string;
}, actorId: string, now: Date): {
    fechaEntregaReal?: Date;
    entregadoPorId?: string;
};
export declare function deleteError(estado: string): string | null;
export declare function transitionNeedsReason(to: string): boolean;
export {};
