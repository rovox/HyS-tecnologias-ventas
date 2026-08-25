import type { User } from '@prisma/client';
import { UpsertGoalDto } from './dto/goal.dto';
import { GoalsService } from './goals.service';
export declare class GoalsController {
    private readonly goals;
    constructor(goals: GoalsService);
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
