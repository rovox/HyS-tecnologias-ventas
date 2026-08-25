import type { User } from '@prisma/client';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, PatchCategoryDto } from './dto/category.dto';
export declare class CategoriesController {
    private readonly categories;
    constructor(categories: CategoriesService);
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
