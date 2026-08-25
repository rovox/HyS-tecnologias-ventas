import type { User } from '@prisma/client';
import { AuthService } from './auth.service';
export declare class UsersController {
    private readonly auth;
    constructor(auth: AuthService);
    list(user: User): Promise<{
        monthlyGoalBs: number;
        department: string | null;
        id: string;
        email: string;
        sucursalId: string | null;
        name: string;
        role: string;
        phone: string;
        active: boolean;
    }[]>;
}
