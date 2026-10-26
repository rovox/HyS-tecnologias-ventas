import type { User } from '@prisma/client';
import { AuthService } from './auth.service';
import { ForgotPasswordDto, LoginDto } from './dto/login.dto';
export declare class AuthController {
    private readonly auth;
    constructor(auth: AuthService);
    login(dto: LoginDto, req: {
        ip?: string;
        headers: Record<string, string | string[] | undefined>;
    }): Promise<{
        user: {
            id: string;
            email: string;
            name: string;
            role: string;
            phone: string;
            active: boolean;
            monthlyGoalBs: number;
            sucursalId: string | null;
            department: string | null;
        };
        accessToken: string;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        ok: boolean;
    }>;
    logout(user: User, sessionId?: string): Promise<{
        ok: boolean;
    }>;
    me(user: User): {
        id: string;
        email: string;
        name: string;
        role: string;
        phone: string;
        active: boolean;
        monthlyGoalBs: number;
        sucursalId: string | null;
        department: string | null;
    };
}
