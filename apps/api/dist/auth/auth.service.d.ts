import { JwtService } from '@nestjs/jwt';
import type { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityService } from './activity.service';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private readonly prisma;
    private readonly jwt;
    private readonly activity;
    constructor(prisma: PrismaService, jwt: JwtService, activity: ActivityService);
    login(dto: LoginDto, ip?: string, userAgent?: string): Promise<{
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
    forgotPassword(email: string): Promise<{
        ok: boolean;
    }>;
    listUsers(actor: User): Promise<{
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
    listSessions(actor: User): Promise<({
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
    sessionActivity(actor: User, sessionId: string): Promise<{
        at: Date;
        id: string;
        sessionId: string;
        userId: string;
        action: string;
        entityType: string | null;
        entityId: string | null;
    }[]>;
}
