export declare const ROLES: {
    readonly ADMIN: "ADMINISTRADOR";
    readonly VENTAS: "VENTAS / ADMINISTRACIÓN";
    readonly TEC: "SEGURIDAD ELECTRÓNICA";
    readonly CONTA: "CONTABILIDAD";
    readonly NONE: "SIN ACCESO";
};
export type Actor = {
    id: string;
    role: string;
};
export declare const MANAGER_ROLES: readonly string[];
export declare const isAdmin: (actor?: Actor | null) => boolean;
export declare const isVentas: (actor?: Actor | null) => boolean;
export declare const isTec: (actor?: Actor | null) => boolean;
export declare const isConta: (actor?: Actor | null) => boolean;
export declare const isCommercial: (actor?: Actor | null) => boolean;
export declare const canMutateQuotes: (actor?: Actor | null) => boolean;
export declare const canMutateClients: (actor?: Actor | null) => boolean;
export declare const canManageWebLeads: (actor?: Actor | null) => boolean;
export declare const canSeeQuotations: (actor?: Actor | null) => boolean;
export declare const canValidateMovements: (actor?: Actor | null) => boolean;
export declare const canRegisterMovements: (actor: Actor) => boolean;
export declare const canSeeLedger: (actor?: Actor | null) => boolean;
export declare const canManageInventory: (actor?: Actor | null) => boolean;
export declare const canAdjustInventory: (actor?: Actor | null) => boolean;
export declare const usesMaterialOnOwnJobs: (actor?: Actor | null) => boolean;
export declare const canManageProjects: (actor?: Actor | null) => boolean;
export declare const canSeeProjects: (actor?: Actor | null) => boolean;
export declare const canCreateSchedules: (actor?: Actor | null) => boolean;
export declare const canMutateSchedules: (actor: Actor) => boolean;
export declare const canMutateRelevamientos: (actor: Actor) => boolean;
export declare const canManagePedidos: (actor?: Actor | null) => boolean;
export declare const canSeePedidos: (actor?: Actor | null) => boolean;
export declare const canListUsers: (actor?: Actor | null) => boolean;
export declare const canListUserDirectory: (actor: Actor) => boolean;
export declare const canViewUser: (actor: Actor, targetId: string) => boolean;
export declare function scheduleWhere(actor: Actor): {
    id: string;
} | {
    tecnicoId?: undefined;
} | {
    tecnicoId: string;
};
export declare function quotationWhere(actor: Actor): {
    id?: string;
};
export declare function clientWhere(actor: Actor): {};
export declare function relevamientoWhere(actor: Actor, cotizacionId?: string): {
    id: string;
} | {
    cotizacionId: string;
} | {
    cotizacionId?: undefined;
} | {
    OR: ({
        usuarioId: string;
        tecnicoId?: undefined;
    } | {
        tecnicoId: string;
        usuarioId?: undefined;
    })[];
    cotizacionId: string;
} | {
    OR: ({
        usuarioId: string;
        tecnicoId?: undefined;
    } | {
        tecnicoId: string;
        usuarioId?: undefined;
    })[];
    cotizacionId?: undefined;
};
export declare function taskWhere(actor: Actor, tipo?: string): {
    id: string;
} | {
    OR: ({
        asignadoId: string;
        creadorId?: undefined;
    } | {
        creadorId: string;
        asignadoId?: undefined;
    })[];
} | {
    tipo: string;
    AND?: undefined;
} | {
    tipo?: undefined;
    AND?: undefined;
} | {
    AND: ({
        OR: ({
            asignadoId: string;
            creadorId?: undefined;
        } | {
            creadorId: string;
            asignadoId?: undefined;
        })[];
    } | {
        tipo: string;
    })[];
    tipo?: undefined;
};
export declare function goalWhere(actor: Actor): {
    id: string;
} | {
    usuarioId?: undefined;
} | {
    usuarioId: string;
};
export declare function metricsUserId(actor: Actor, requested?: string): string | undefined;
