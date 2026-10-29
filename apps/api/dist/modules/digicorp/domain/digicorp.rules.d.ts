export declare const productUrl: (sku: string) => string;
export declare function cleanText(value: unknown): string;
export declare function htmlToText(html: unknown): string;
export type CatalogRow = {
    sku: string;
    nombre: string;
    marca: string;
    imagenUrl: string;
    hash: string;
};
export declare function parseListPage(body: unknown): CatalogRow[];
export declare function parseDetail(body: unknown): {
    imagenUrl?: string | undefined;
    descripcion: string | null;
    seccion: string;
    categoriaCodigo: string;
    stockTotal: number | null;
    moneda: string;
    imagenGrandeUrl: string;
};
export declare function blockedReason(status: number, contentType: string | null): string | null;
export declare const syncDue: (lastOk: Date | null, now: Date) => boolean;
