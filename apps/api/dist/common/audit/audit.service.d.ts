import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
export type AuditEntry = {
    user?: {
        id: string;
    } | null;
    sessionId?: string;
    action: string;
    entity: string;
    id: string;
    before?: Record<string, unknown> | null;
    after?: Record<string, unknown> | null;
    affects?: string[];
    patch?: Record<string, unknown>;
};
export declare class AuditService {
    private readonly prisma;
    private readonly realtime;
    constructor(prisma: PrismaService, realtime: RealtimeService);
    record(entry: AuditEntry): Promise<void>;
    log(entry: Omit<AuditEntry, 'affects' | 'patch'>): Promise<void>;
    list(filter: {
        limit?: number;
        userId?: string;
        action?: string;
        entity?: string;
        entityId?: string;
    }): Prisma.PrismaPromise<({
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
        detalle: Prisma.JsonValue | null;
    })[]>;
}
