import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';

function mariaAdapter() {
  const url = process.env.DATABASE_URL;
  if (!url) return undefined;
  return new PrismaMariaDb(url);
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const adapter = mariaAdapter();
    super(adapter ? { adapter } : undefined);
  }

  async onModuleInit() {
    await this.$connect();
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  async touchClientActivity(clienteId: string | null | undefined) {
    if (!clienteId) return;
    await this.client.update({
      where: { id: clienteId },
      data: { lastActivityAt: new Date() },
    });
  }
}
