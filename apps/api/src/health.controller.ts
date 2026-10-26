import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PrismaService } from './common/prisma/prisma.service';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'Liveness probe' })
  check() {
    return { ok: true, service: 'hs-erp' };
  }

  @Get('db')
  @ApiOperation({ summary: 'MySQL / Prisma readiness' })
  async db() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { ok: true, service: 'hs-erp', db: true };
    } catch {
      throw new ServiceUnavailableException({ ok: false, service: 'hs-erp', db: false });
    }
  }
}
