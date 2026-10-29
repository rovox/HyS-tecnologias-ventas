import { OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
export declare class PrismaService extends PrismaClient implements OnModuleDestroy {
    constructor();
    onModuleDestroy(): Promise<void>;
    touchClientActivity(clienteId: string | null | undefined): Promise<void>;
}
