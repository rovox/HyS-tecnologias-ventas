import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentSessionId, CurrentUser } from '../auth/current-user.decorator';
import { ClientsService } from './clients.service';
import { UpdateClientDto, UpsertClientDto } from './dto/upsert-client.dto';

@ApiTags('clients')
@ApiBearerAuth()
@Controller('clients')
@UseGuards(AuthGuard)
export class ClientsController {
  constructor(private readonly clients: ClientsService) {}

  @Get()
  @ApiOperation({ summary: 'List clients (optional q / active filters)' })
  list(@CurrentUser() user: User, @Query('q') q?: string, @Query('active') active?: string) {
    return this.clients.list(user, q, active);
  }

  @Get(':id/history')
  @ApiOperation({ summary: 'Client commercial history' })
  history(@Param('id') id: string, @CurrentUser() user: User) {
    return this.clients.history(id, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get client by id' })
  get(@Param('id') id: string, @CurrentUser() user: User) {
    return this.clients.get(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Create client (no delete endpoint)' })
  create(@Body() dto: UpsertClientDto, @CurrentUser() user: User, @CurrentSessionId() sessionId?: string) {
    return this.clients.create(dto, user, sessionId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update client' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateClientDto,
    @CurrentUser() user: User,
    @CurrentSessionId() sessionId?: string,
  ) {
    return this.clients.update(id, dto, user, sessionId);
  }
}
