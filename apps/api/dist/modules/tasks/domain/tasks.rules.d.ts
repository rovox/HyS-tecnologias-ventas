export declare const TASK_ESTADOS: readonly ["pendiente", "completada", "descartada"];
export declare const TASK_PRIORIDADES: readonly ["alta", "media", "baja"];
type TaskLike = {
    estado: string;
    prioridad: string;
    plazo?: Date | string | null;
    asignadoId?: string | null;
    creadorId: string;
};
export declare function isOverdue(task: Pick<TaskLike, 'estado' | 'plazo'>, now: Date): boolean;
export declare function compareTasks(a: TaskLike, b: TaskLike): number;
export declare function pendingSummary(tasks: TaskLike[], userId: string, now: Date): {
    mias: number;
    sinAsignar: number;
    vencidas: number;
};
export declare function convertError(task: Pick<TaskLike, 'estado'> & {
    cotizacionId?: string | null;
}): string | null;
export {};
