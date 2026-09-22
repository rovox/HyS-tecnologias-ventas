import { PrismaService } from '../prisma/prisma.service';
export declare class ActivityController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(limit?: string, userId?: string, action?: string): Promise<({
        user: {
            id: string;
            email: string;
            name: string;
        };
    } & {
        at: Date;
        id: string;
        sessionId: string;
        userId: string;
        action: string;
        entityType: string | null;
        entityId: string | null;
    })[]>;
}
