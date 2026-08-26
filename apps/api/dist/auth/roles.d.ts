import type { User } from '@prisma/client';
export declare const ROLES: {
    readonly ADMIN: "ADMINISTRADOR";
    readonly VENTAS: "VENTAS / ADMINISTRACIÓN";
    readonly TEC: "SEGURIDAD ELECTRÓNICA";
    readonly CONT: "Contadora";
    readonly NONE: "SIN ACCESO";
};
export declare function isAdmin(user?: User | null): boolean;
export declare function isVentas(user?: User | null): boolean;
export declare function isTec(user?: User | null): boolean;
export declare function isCont(user?: User | null): boolean;
export declare function isNone(user?: User | null): boolean;
export declare function assertAdmin(user: User): void;
export declare function assertCanMutateQuotes(user: User): void;
export declare function assertCanMutateClients(user: User): void;
export declare function assertCanMutateSchedules(user: User): void;
export declare function assertCanCreateSchedules(user: User): void;
export declare function scheduleWhere(user: User): {
    id: string;
    tecnicoId?: undefined;
} | {
    id?: undefined;
    tecnicoId?: undefined;
} | {
    tecnicoId: string;
    id?: undefined;
};
export declare function quotationWhere(user: User): {
    id: string;
} | {
    id?: undefined;
};
export declare function clientWhere(user: User): {
    id: string;
} | {
    id?: undefined;
};
export declare function saleWhere(user: User): {
    id: string;
    quotation?: undefined;
} | {
    id?: undefined;
    quotation?: undefined;
} | {
    quotation: {
        OR: ({
            vendedorId: string;
            sellers?: undefined;
        } | {
            sellers: {
                some: {
                    userId: string;
                };
            };
            vendedorId?: undefined;
        })[];
    };
    id?: undefined;
};
export declare function relevamientoWhere(user: User, cotizacionId?: string): {
    cotizacionId: string;
} | {
    cotizacionId?: undefined;
} | {
    id: string;
} | {
    usuarioId: string;
    cotizacionId: string;
    id?: undefined;
} | {
    usuarioId: string;
    cotizacionId?: undefined;
    id?: undefined;
};
export declare function taskWhere(user: User, tipo?: string): {
    OR: ({
        asignadoId: string;
        creadorId?: undefined;
    } | {
        creadorId: string;
        asignadoId?: undefined;
    })[];
} | {
    id: string;
    tipo?: undefined;
    AND?: undefined;
} | {
    tipo: string;
    id?: undefined;
    AND?: undefined;
} | {
    id?: undefined;
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
    id?: undefined;
    tipo?: undefined;
};
export declare function metricsUserId(user: User, requested?: string): string | undefined;
