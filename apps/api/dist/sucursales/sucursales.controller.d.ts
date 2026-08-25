import { PrismaService } from '../prisma/prisma.service';
export declare class SucursalesController {
    private readonly prisma;
    constructor(prisma: PrismaService);
    list(): import("@prisma/client").Prisma.PrismaPromise<{
        id: string;
        nombre: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
}
