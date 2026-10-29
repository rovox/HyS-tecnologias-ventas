import type { User } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { UpsertGoalDto } from './dto/goal.dto';
export declare class GoalsService {
    private readonly prisma;
    private readonly audit;
    constructor(prisma: PrismaService, audit: AuditService);
    list(user: User, month?: string): import("@prisma/client").Prisma.PrismaPromise<({
        usuario: {
            id: string;
            name: string;
            role: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        usuarioId: string;
        mes: Date;
        metaMonto: import("@prisma/client/runtime/library").Decimal;
        metaCotiz: number;
    })[]>;
    upsert(dto: UpsertGoalDto, user: User, sessionId?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        usuarioId: string;
        mes: Date;
        metaMonto: import("@prisma/client/runtime/library").Decimal;
        metaCotiz: number;
    }>;
}
