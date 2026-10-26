import { JwtService } from '@nestjs/jwt';
import type { User } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { LoginDto } from './dto/login.dto';
export declare class AuthService {
    private readonly prisma;
    private readonly jwt;
    private readonly audit;
    constructor(prisma: PrismaService, jwt: JwtService, audit: AuditService);
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
    listUsers(actor: User): Promise<({
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
    userDirectory(actor: User): Promise<{
        id: string;
        name: string;
        role: string;
    }[]>;
    getUser(actor: User, id: string): Promise<{
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
        userId: string;
        sessionId: string;
        action: string;
        entityType: string | null;
        entityId: string | null;
        detalle: import("@prisma/client/runtime/library").JsonValue | null;
    }[]>;
}
