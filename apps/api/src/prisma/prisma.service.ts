import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { PrismaClient } from '@prisma/client';

function mariaAdapter(): PrismaMariaDb {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    console.error(
      '[Prisma] DATABASE_URL no está definida — revisa las variables en hPanel (clave en MAYÚSCULAS).',
    );
    return new PrismaMariaDb({
      host: '127.0.0.1',
      port: 3306,
      user: '__unset__',
      password: '',
      database: '__unset__',
    });
  }
  return new PrismaMariaDb(url);
}

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  constructor() {
    super({ adapter: mariaAdapter() });
  }

  async onModuleInit() {
    if (!process.env.DATABASE_URL?.trim()) return;
    try {
      await this.$connect();
    } catch (err) {
      // No tumbar Nest si MySQL falla; /api/health/db reportará el estado.
      console.error('[Prisma] $connect falló al arrancar:', err);
    }
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
