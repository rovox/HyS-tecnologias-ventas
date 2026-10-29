import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { AuthGuard } from '../../common/auth/auth.guard';
import { CurrentSessionId, CurrentUser } from '../../common/auth/current-user.decorator';
import { CreateProductDto, ListMovementsQuery, StockBatchDto, StockMovementDto, UpdateProductDto } from './dto/inventory.dto';
import { InventoryService } from './inventory.service';

@ApiTags('inventory')
@ApiBearerAuth()
@Controller('inventory')
@UseGuards(AuthGuard)
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Get('products')
  @ApiOperation({ summary: 'Catalog with stock per branch (computed from movements) and low-stock flag' })
  products(@CurrentUser() user: User) {
    return this.inventory.products(user);
  }

  @Post('products')
  @ApiOperation({ summary: 'New product (commercial roles)' })
  create(@Body() dto: CreateProductDto, @CurrentUser() user: User, @CurrentSessionId() sessionId?: string) {
    return this.inventory.createProduct(dto, user, sessionId);
  }

  @Patch('products/:id')
  @ApiOperation({ summary: 'Edit or archive (active = false) a product' })
  update(@Param('id') id: string, @Body() dto: UpdateProductDto, @CurrentUser() user: User, @CurrentSessionId() sessionId?: string) {
    return this.inventory.updateProduct(id, dto, user, sessionId);
  }

  @Get('products/:id/kardex')
  @ApiOperation({ summary: 'Kardex of a product in a branch (or the company) with its running balance' })
  kardex(@Param('id') id: string, @Query('sucursalId') sucursalId: string | undefined, @CurrentUser() user: User) {
    return this.inventory.kardex(id, user, sucursalId);
  }

  @Get('movements')
  @ApiOperation({ summary: 'History: by branch, types, Bolivian days and product' })
  movements(@Query() query: ListMovementsQuery, @CurrentUser() user: User) {
    return this.inventory.movements(user, query);
  }

  @Post('movements/lote')
  @ApiOperation({ summary: 'Several products moved the same way (entrada, transferencia, baja…) in one transaction' })
  batch(@Body() dto: StockBatchDto, @CurrentUser() user: User, @CurrentSessionId() sessionId?: string) {
    return this.inventory.registerBatch(dto, user, sessionId);
  }

  @Post('movements')
  @ApiOperation({ summary: 'Entrada, transferencia, salida a proyecto, baja or ajuste (Gerencia)' })
  move(@Body() dto: StockMovementDto, @CurrentUser() user: User, @CurrentSessionId() sessionId?: string) {
    return this.inventory.registerMovement(dto, user, sessionId);
  }
}
