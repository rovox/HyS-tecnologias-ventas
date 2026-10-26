export declare const DIVISIONS: readonly [{
    readonly id: "computo_comunicacion";
    readonly label: "Cómputo y comunicación";
    readonly sortOrder: 1;
}, {
    readonly id: "seguridad_electronica";
    readonly label: "Seguridad electrónica";
    readonly sortOrder: 2;
}, {
    readonly id: "cableado_estructurado";
    readonly label: "Cableado estructurado";
    readonly sortOrder: 3;
}];
type CategoryRow = {
    principal: boolean;
    active: boolean;
} | null | undefined;
export declare function divisionError(row: CategoryRow): string | null;
export declare function chipChangeError(row: CategoryRow): string | null;
export {};
