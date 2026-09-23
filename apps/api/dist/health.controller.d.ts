import { PrismaService } from './prisma/prisma.service';
export declare class HealthController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    check(): {
        ok: boolean;
        service: string;
    };
    db(): Promise<{
        ok: boolean;
        service: string;
        db: boolean;
    }>;
}
