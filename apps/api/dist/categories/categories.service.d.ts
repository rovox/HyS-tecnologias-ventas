import type { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityService } from '../auth/activity.service';
import { CreateCategoryDto, PatchCategoryDto } from './dto/category.dto';
export declare class CategoriesService {
    private readonly prisma;
    private readonly activity;
    constructor(prisma: PrismaService, activity: ActivityService);
    list(): import("@prisma/client").Prisma.PrismaPromise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        active: boolean;
        label: string;
        sortOrder: number;
    }[]>;
    create(dto: CreateCategoryDto, user: User, sessionId?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        active: boolean;
        label: string;
        sortOrder: number;
    }>;
    deactivate(id: string, dto: PatchCategoryDto, user: User, sessionId?: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        active: boolean;
        label: string;
        sortOrder: number;
    }>;
}
