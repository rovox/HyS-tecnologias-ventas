import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from './prisma/prisma.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Liveness probe' })
  check() {
    return { ok: true, service: 'sales' };
  }

  @Get('db')
  @ApiOperation({ summary: 'MySQL / Prisma readiness' })
  async db() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { ok: true, service: 'sales', db: true };
    } catch {
      throw new ServiceUnavailableException({ ok: false, service: 'sales', db: false });
    }
  }
}
