import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../auth/auth.guard';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('sucursales')
@ApiBearerAuth()
@Controller('sucursales')
@UseGuards(AuthGuard)
export class SucursalesController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @ApiOperation({ summary: 'List sucursales (Central, Punata, Quillacollo)' })
  list() {
    return this.prisma.sucursal.findMany({ orderBy: { nombre: 'asc' } });
  }
}
