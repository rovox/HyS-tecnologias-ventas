import { Body, Controller, Get, Param, Post, Query, StreamableFile, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { AuthGuard } from '../../common/auth/auth.guard';
import { CurrentSessionId, CurrentUser } from '../../common/auth/current-user.decorator';
import { AnnulDirectSaleDto, CreateDirectSaleDto, ListDirectSalesQuery } from './dto/direct-sale.dto';
import { DirectSalesService } from './direct-sales.service';

@ApiTags('direct-sales')
@ApiBearerAuth()
@Controller('direct-sales')
@UseGuards(AuthGuard)
export class DirectSalesController {
  constructor(private readonly sales: DirectSalesService) {}

  @Get()
  @ApiOperation({ summary: 'Direct sales (branch, days, seller, state)' })
  list(@Query() query: ListDirectSalesQuery, @CurrentUser() user: User) {
    return this.sales.list(query, user);
  }

  @Get(':id/nota.pdf')
  @ApiOperation({ summary: 'The stored sale note (the ANULADA copy of an annulled sale; ?original=1 for the first one)' })
  async note(@Param('id') id: string, @Query('original') original: string | undefined, @CurrentUser() user: User) {
    const { bytes, name } = await this.sales.note(id, user, original === '1');
    return new StreamableFile(bytes, { type: 'application/pdf', disposition: `inline; filename="${name}"` });
  }

  @Get(':id')
  @ApiOperation({ summary: 'One direct sale with its lines and payments' })
  get(@Param('id') id: string, @CurrentUser() user: User) {
    return this.sales.get(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Sell: stock leaves the branch and the payments are validated into the box of their method' })
  create(@Body() dto: CreateDirectSaleDto, @CurrentUser() user: User, @CurrentSessionId() sessionId?: string) {
    return this.sales.create(dto, user, sessionId);
  }

  @Post(':id/anular')
  @ApiOperation({ summary: 'Annul with a reason (Administración, Contabilidad): stock comes back, payments are annulled' })
  annul(@Param('id') id: string, @Body() dto: AnnulDirectSaleDto, @CurrentUser() user: User, @CurrentSessionId() sessionId?: string) {
    return this.sales.annul(id, dto, user, sessionId);
  }
}
