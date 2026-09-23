import { PrismaService } from '../prisma/prisma.service';
export declare class ActivityService {
    private readonly prisma;
    constructor(prisma: PrismaService);
    log(userId: string, sessionId: string | undefined, action: string, entityType?: string, entityId?: string): Promise<void>;
}
