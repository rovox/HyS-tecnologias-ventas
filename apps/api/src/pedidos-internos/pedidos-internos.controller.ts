import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { AddComentarioDto, UpdateEstadoPedidoDto, UpsertPedidoInternoDto } from './dto/pedido-interno.dto';
import { PedidosInternosService } from './pedidos-internos.service';

@ApiTags('pedidos-internos')
@ApiBearerAuth()
@Controller('pedidos-internos')
@UseGuards(AuthGuard)
export class PedidosInternosController {
  constructor(private readonly service: PedidosInternosService) {}

  @Get()
  @ApiOperation({ summary: 'Listar pedidos internos' })
  findAll(@Query() query: Record<string, string>, @CurrentUser() user: User) {
    return this.service.findAll(user, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener pedido interno por ID' })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Crear pedido interno' })
  create(@Body() dto: UpsertPedidoInternoDto, @CurrentUser() user: User) {
    return this.service.create(dto, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Actualizar pedido interno' })
  update(@Param('id') id: string, @Body() dto: UpsertPedidoInternoDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Eliminar pedido interno' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Cambiar estado del pedido' })
  updateEstado(
    @Param('id') id: string,
    @Body() dto: UpdateEstadoPedidoDto,
    @CurrentUser() user: User,
  ) {
    return this.service.updateEstado(id, dto, user);
  }

  @Post(':id/comments')
  @ApiOperation({ summary: 'Agregar comentario al pedido' })
  addComentario(
    @Param('id') id: string,
    @Body() dto: AddComentarioDto,
    @CurrentUser() user: User,
  ) {
    return this.service.addComentario(id, dto, user);
  }
}
