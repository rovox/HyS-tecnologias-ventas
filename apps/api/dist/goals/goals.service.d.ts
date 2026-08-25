import type { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityService } from '../auth/activity.service';
import { UpsertGoalDto } from './dto/goal.dto';
export declare class GoalsService {
    private readonly prisma;
    private readonly activity;
    constructor(prisma: PrismaService, activity: ActivityService);
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
        metaMonto: import("@prisma/client/runtime/library").Decimal;
        metaCotiz: number;
        mes: Date;
    })[]>;
    upsert(dto: UpsertGoalDto, user: User, sessionId?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        usuarioId: string;
        metaMonto: import("@prisma/client/runtime/library").Decimal;
        metaCotiz: number;
        mes: Date;
    }>;
}
