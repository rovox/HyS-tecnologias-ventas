import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async touchClientActivity(clienteId: string) {
    if (!clienteId) return;
    await this.client.update({
      where: { id: clienteId },
      data: { lastActivityAt: new Date() },
    });
  }
}
