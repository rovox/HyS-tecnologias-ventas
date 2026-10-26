import type { User } from '@prisma/client';
import { AuthService } from './auth.service';
export declare class UsersController {
    private readonly auth;
    constructor(auth: AuthService);
    list(user: User): Promise<({
        id: string;
        email: string;
        sucursalId: string | null;
        name: string;
        role: string;
        phone: string;
        active: boolean;
        monthlyGoalBs: import("@prisma/client/runtime/library").Decimal;
    } & {
        monthlyGoalBs: number;
        department: string | null;
    })[]>;
    directory(user: User): Promise<{
        id: string;
        name: string;
        role: string;
    }[]>;
    get(id: string, user: User): Promise<{
        id: string;
        email: string;
        sucursalId: string | null;
        name: string;
        role: string;
        phone: string;
        active: boolean;
        monthlyGoalBs: import("@prisma/client/runtime/library").Decimal;
    } & {
        monthlyGoalBs: number;
        department: string | null;
    }>;
}
