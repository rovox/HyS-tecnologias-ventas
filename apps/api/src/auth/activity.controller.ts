import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from './auth.guard';
import { Roles, RolesGuard } from './roles.guard';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('activity')
@Controller('activity')
@UseGuards(AuthGuard, RolesGuard)
@ApiBearerAuth()
export class ActivityController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Roles('ADMINISTRADOR')
  @ApiOperation({ summary: 'List audit activity log' })
  async list(
    @Query('limit') limit?: string,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
  ) {
    const take = Math.min(Number(limit) || 100, 500);
    return this.prisma.activity.findMany({
      take,
      orderBy: { at: 'desc' },
      where: {
        ...(userId ? { userId } : {}),
        ...(action ? { action: { contains: action } } : {}),
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    });
  }
}
