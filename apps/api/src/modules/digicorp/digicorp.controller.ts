import { Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { AuthGuard } from '../../common/auth/auth.guard';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { ListDigicorpQuery } from './dto/digicorp.dto';
import { DigicorpService } from './digicorp.service';

@ApiTags('digicorp')
@ApiBearerAuth()
@Controller('digicorp')
@UseGuards(AuthGuard)
export class DigicorpController {
  constructor(private readonly digicorp: DigicorpService) {}

  @Get('productos')
  @ApiOperation({ summary: "Digicorp's public catalog (search, brand), with the last sync" })
  list(@Query() query: ListDigicorpQuery, @CurrentUser() user: User) {
    return this.digicorp.list(query, user);
  }

  @Get('productos/:sku')
  @ApiOperation({ summary: 'One product; its detail is refreshed on demand after 30 days' })
  detail(@Param('sku') sku: string, @CurrentUser() user: User) {
    return this.digicorp.detail(sku, user);
  }

  @Post('sync')
  @ApiOperation({ summary: 'Refresh the catalog now (Administración, Contabilidad); runs in the background' })
  sync(@CurrentUser() user: User) {
    return this.digicorp.startSync(user);
  }
}
