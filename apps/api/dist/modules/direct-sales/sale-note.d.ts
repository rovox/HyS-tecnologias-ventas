import type { TDocumentDefinitions } from 'pdfmake/interfaces';
type Num = number | string | {
    toString(): string;
};
export type NoteSale = {
    numero: number;
    fecha: Date;
    sucursal: {
        nombre: string;
        direccion: string;
    };
    vendedor: {
        name: string;
        phone: string;
    };
    clienteNombre: string;
    clienteCelular: string;
    clienteNit: string;
    subtotal: Num;
    descuento: Num;
    total: Num;
    items: {
        codigo: string;
        descripcion: string;
        unidad: string;
        cantidad: Num;
        precioUnitario: Num;
        descuento: Num;
        subtotal: Num;
    }[];
    cobros: {
        medioPago: string | null;
        monto: Num;
    }[];
    motivoAnulacion?: string | null;
};
export declare function saleNoteDefinition(sale: NoteSale, { annulled }?: {
    annulled?: boolean | undefined;
}): TDocumentDefinitions;
export declare function renderSaleNote(sale: NoteSale, options?: {
    annulled?: boolean;
}): Promise<Buffer>;
export {};
