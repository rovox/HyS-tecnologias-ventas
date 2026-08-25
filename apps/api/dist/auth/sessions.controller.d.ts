import type { User } from '@prisma/client';
import { AuthService } from './auth.service';
export declare class SessionsController {
    private readonly auth;
    constructor(auth: AuthService);
    list(user: User): Promise<({
        user: {
            id: string;
            email: string;
            name: string;
            role: string;
        };
    } & {
        id: string;
        userId: string;
        startedAt: Date;
        endedAt: Date | null;
        ip: string | null;
        userAgent: string | null;
    })[]>;
    activity(user: User, id: string): Promise<{
        id: string;
        at: Date;
        sessionId: string;
        userId: string;
        action: string;
        entityType: string | null;
        entityId: string | null;
    }[]>;
}
