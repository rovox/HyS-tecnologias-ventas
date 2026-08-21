import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentSessionId, CurrentUser } from '../auth/current-user.decorator';
import { ROLES } from '../auth/roles';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { CreateScheduleDto, ScheduleStatusDto, UpdateScheduleDto } from './dto/schedule.dto';
import { SchedulesService } from './schedules.service';

@ApiTags('schedules')
@ApiBearerAuth()
@Controller('schedules')
@UseGuards(AuthGuard)
export class SchedulesController {
  constructor(private readonly schedules: SchedulesService) {}

  @Get()
  @ApiOperation({ summary: 'List cronograma trabajos (filters: estado, sucursalId, from, to, tecnicoId)' })
  list(
    @CurrentUser() user: User,
    @Query('estado') estado?: string,
    @Query('sucursalId') sucursalId?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('tecnicoId') tecnicoId?: string,
  ) {
    return this.schedules.list(user, { estado, sucursalId, from, to, tecnicoId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get schedule by id' })
  get(@Param('id') id: string, @CurrentUser() user: User) {
    return this.schedules.get(id, user);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(ROLES.ADMIN, ROLES.VENTAS)
  @ApiOperation({ summary: 'Create schedule job' })
  create(@Body() dto: CreateScheduleDto, @CurrentUser() user: User, @CurrentSessionId() sessionId?: string) {
    return this.schedules.create(dto, user, sessionId);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(ROLES.ADMIN, ROLES.VENTAS, ROLES.TEC)
  @ApiOperation({ summary: 'Update schedule job' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateScheduleDto,
    @CurrentUser() user: User,
    @CurrentSessionId() sessionId?: string,
  ) {
    return this.schedules.update(id, dto, user, sessionId);
  }

  @Post(':id/status')
  @UseGuards(RolesGuard)
  @Roles(ROLES.ADMIN, ROLES.VENTAS, ROLES.TEC)
  @ApiOperation({ summary: 'Change schedule status' })
  status(
    @Param('id') id: string,
    @Body() dto: ScheduleStatusDto,
    @CurrentUser() user: User,
    @CurrentSessionId() sessionId?: string,
  ) {
    return this.schedules.updateStatus(id, dto, user, sessionId);
  }
}
