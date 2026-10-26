import type { User } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { CreateCategoryDto, PatchCategoryDto } from './dto/category.dto';
export declare class CategoriesService {
    private readonly prisma;
    private readonly audit;
    constructor(prisma: PrismaService, audit: AuditService);
    list(): import("@prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        active: boolean;
        label: string;
        principal: boolean;
        sortOrder: number;
    }[]>;
    assertDivision(id: string | undefined | null): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        active: boolean;
        label: string;
        principal: boolean;
        sortOrder: number;
    }>;
    create(dto: CreateCategoryDto, user: User, sessionId?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        active: boolean;
        label: string;
        principal: boolean;
        sortOrder: number;
    }>;
    deactivate(id: string, dto: PatchCategoryDto, user: User, sessionId?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        active: boolean;
        label: string;
        principal: boolean;
        sortOrder: number;
    }>;
}
