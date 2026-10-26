import { AuditService } from '../../common/audit/audit.service';
export declare class ActivityController {
    private readonly audit;
    constructor(audit: AuditService);
    list(limit?: string, userId?: string, action?: string): import("@prisma/client").Prisma.PrismaPromise<({
        user: {
            id: string;
            email: string;
            name: string;
        };
    } & {
        at: Date;
        id: string;
        userId: string;
        sessionId: string;
        action: string;
        entityType: string | null;
        entityId: string | null;
        detalle: import("@prisma/client/runtime/library").JsonValue | null;
    })[]>;
    history(entity: string, id: string): import("@prisma/client").Prisma.PrismaPromise<({
        user: {
            id: string;
            email: string;
            name: string;
        };
    } & {
        at: Date;
        id: string;
        userId: string;
        sessionId: string;
        action: string;
        entityType: string | null;
        entityId: string | null;
        detalle: import("@prisma/client/runtime/library").JsonValue | null;
    })[]>;
}
