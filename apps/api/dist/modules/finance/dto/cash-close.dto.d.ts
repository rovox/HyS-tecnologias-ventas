export declare class CashCloseQuery {
    sucursalId: string;
    dia: string;
}
export declare class CloseCashDto extends CashCloseQuery {
    conteo: Record<string, number>;
    motivoDiferencia?: string;
    observaciones?: string;
}
export declare class ListCashClosesQuery {
    sucursalId?: string;
    desde?: string;
    hasta?: string;
}
