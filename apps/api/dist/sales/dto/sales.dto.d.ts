export declare class CreateJobDto {
    titulo: string;
    asignadoId?: string;
    monto?: number;
}
export declare class JobStatusDto {
    estado: string;
}
export declare class CreatePaymentDto {
    monto: number;
    metodo?: string;
    nota?: string;
}
