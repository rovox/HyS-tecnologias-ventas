type Money = number | string | {
    toString(): string;
};
export type ProjectLine = {
    estado: string;
    monto: Money;
    cobrado: number;
    saldo: number;
};
export type JobLine = {
    estado: string;
    monto: Money;
    saldo: number;
};
export declare function clientStatus(projects: ProjectLine[], jobs: JobLine[]): {
    saldoPendiente: number;
    proyectosEnCurso: number;
    trabajosEnCurso: number;
    totalContratado: number;
    servicioEnCurso: boolean;
};
export {};
