import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { AuthGuard } from '../../common/auth/auth.guard';
import { CurrentSessionId, CurrentUser } from '../../common/auth/current-user.decorator';
import { CreateProductDto, StockMovementDto, UpdateProductDto } from './dto/inventory.dto';
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

  @Get('movements')
  @ApiOperation({ summary: 'Stock movements (optionally of one product)' })
  movements(@CurrentUser() user: User, @Query('productoId') productoId?: string) {
    return this.inventory.movements(user, productoId);
  }

  @Post('movements')
  @ApiOperation({ summary: 'Entrada, transferencia, salida a proyecto or ajuste (Gerencia)' })
  move(@Body() dto: StockMovementDto, @CurrentUser() user: User, @CurrentSessionId() sessionId?: string) {
    return this.inventory.registerMovement(dto, user, sessionId);
  }
}
