import { Injectable, OnModuleDestroy } from '@nestjs/common';
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
// No $connect at boot: Prisma connects on the first query, so a slow or down MySQL never delays app.listen()
// (Hostinger gives the process a few seconds). /api/health/db reports the state.
export class PrismaService extends PrismaClient implements OnModuleDestroy {
  constructor() {
    super({ adapter: mariaAdapter() });
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
