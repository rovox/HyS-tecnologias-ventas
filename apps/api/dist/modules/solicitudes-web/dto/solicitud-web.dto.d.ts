export declare const SOLICITUD_ESTADOS: readonly ["nueva", "contactada", "convertida", "descartada"];
export declare class WebhookSolicitudDto {
    nombre: string;
    empresa?: string;
    email?: string;
    telefono?: string;
    departamento?: string;
    servicio?: string;
    detalle: string;
    pagina?: string;
}
export declare class UpdateSolicitudDto {
    estado?: string;
    notas?: string;
}
