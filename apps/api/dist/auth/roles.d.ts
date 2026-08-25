import type { User } from '@prisma/client';
export declare const ROLES: {
    readonly ADMIN: "ADMINISTRADOR";
    readonly VENTAS: "VENTAS / ADMINISTRACIÓN";
    readonly TEC: "SEGURIDAD ELECTRÓNICA";
    readonly CONT: "Contadora";
};
export declare function isAdmin(user?: User | null): boolean;
export declare function isVentas(user?: User | null): boolean;
export declare function isTec(user?: User | null): boolean;
export declare function isCont(user?: User | null): boolean;
export declare function assertAdmin(user: User): void;
export declare function assertCanMutateQuotes(user: User): void;
export declare function assertCanMutateClients(user: User): void;
export declare function assertCanMutateSchedules(user: User): void;
export declare function assertCanCreateSchedules(user: User): void;
export declare function scheduleWhere(user: User): {
    sucursalId?: undefined;
    tecnicoId?: undefined;
    id?: undefined;
} | {
    sucursalId: string;
    tecnicoId?: undefined;
    id?: undefined;
} | {
    tecnicoId: string;
    sucursalId?: undefined;
    id?: undefined;
} | {
    id: string;
    sucursalId?: undefined;
    tecnicoId?: undefined;
};
export declare function quotationWhere(user: User): {
    id?: undefined;
} | {
    id: string;
};
export declare function clientWhere(user: User): {
    sucursalId?: undefined;
} | {
    sucursalId: string;
};
export declare function saleWhere(user: User): {
    quotation?: undefined;
    id?: undefined;
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
} | {
    id: string;
    quotation?: undefined;
};
export declare function relevamientoWhere(user: User, cotizacionId?: string): {
    cotizacionId: string;
} | {
    cotizacionId?: undefined;
} | {
    usuarioId: string;
    cotizacionId: string;
    id?: undefined;
} | {
    usuarioId: string;
    cotizacionId?: undefined;
    id?: undefined;
} | {
    id: string;
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
    tipo: string;
    OR?: undefined;
    id?: undefined;
    AND?: undefined;
} | {
    tipo?: undefined;
    OR?: undefined;
    id?: undefined;
    AND?: undefined;
} | {
    sucursalId: string;
    tipo: string;
    OR?: undefined;
    id?: undefined;
    AND?: undefined;
} | {
    OR: ({
        tipo: string;
        AND?: undefined;
    } | {
        AND: ({
            sucursalId: string;
        } | {
            sucursalId?: undefined;
        } | {
            NOT: {
                tipo: string;
            };
        })[];
        tipo?: undefined;
    })[];
    tipo?: undefined;
    id?: undefined;
    AND?: undefined;
} | {
    id: string;
    tipo?: undefined;
    OR?: undefined;
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
    OR?: undefined;
    id?: undefined;
};
export declare function metricsUserId(user: User, requested?: string): string | undefined;
