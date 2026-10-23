import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { AuthGuard } from '../../common/auth/auth.guard';
import { CurrentSessionId, CurrentUser } from '../../common/auth/current-user.decorator';
import { Roles, RolesGuard } from '../../common/auth/roles.guard';
import { ROLES } from '../../common/policy/roles';
import { CreateProjectJobDto, ListProjectsQuery, ProjectAmountDto, ProjectPaymentDto, ProjectStatusDto, UpdateProjectDto } from './dto/project.dto';
import { ProjectsService } from './projects.service';

@ApiTags('projects')
@ApiBearerAuth()
@Controller('projects')
@UseGuards(AuthGuard, RolesGuard)
@Roles(ROLES.ADMIN, ROLES.VENTAS)
export class ProjectsController {
  constructor(private readonly projects: ProjectsService) {}

  @Get()
  @ApiOperation({ summary: 'List projects with collected, owed and warranty' })
  list(@Query() query: ListProjectsQuery, @CurrentUser() user: User) {
    return this.projects.list(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Project with its jobs and payments' })
  get(@Param('id') id: string, @CurrentUser() user: User) {
    return this.projects.get(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Edit title, warranty months or responsible' })
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto, @CurrentUser() user: User, @CurrentSessionId() sessionId?: string) {
    return this.projects.update(id, dto, user, sessionId);
  }

  @Post(':id/estado')
  @ApiOperation({ summary: 'Move the project: en_ejecucion, entregado (warranty starts), cerrado (no debt), anulado (admin, reason)' })
  status(@Param('id') id: string, @Body() dto: ProjectStatusDto, @CurrentUser() user: User, @CurrentSessionId() sessionId?: string) {
    return this.projects.changeStatus(id, dto, user, sessionId);
  }

  @Post(':id/trabajos')
  @ApiOperation({ summary: 'Add a job of the project to the cronograma' })
  addJob(@Param('id') id: string, @Body() dto: CreateProjectJobDto, @CurrentUser() user: User, @CurrentSessionId() sessionId?: string) {
    return this.projects.addJob(id, dto, user, sessionId);
  }

  @Patch(':id/monto')
  @ApiOperation({ summary: 'Change the official amount (Gerencia, with a reason)' })
  amount(@Param('id') id: string, @Body() dto: ProjectAmountDto, @CurrentUser() user: User, @CurrentSessionId() sessionId?: string) {
    return this.projects.changeAmount(id, dto, user, sessionId);
  }

  @Post(':id/cobros')
  @Roles(ROLES.ADMIN, ROLES.VENTAS, ROLES.TEC)
  @ApiOperation({ summary: 'Register a payment of the project (to be validated)' })
  pay(@Param('id') id: string, @Body() dto: ProjectPaymentDto, @CurrentUser() user: User, @CurrentSessionId() sessionId?: string) {
    return this.projects.registerPayment(id, dto, user, sessionId);
  }
}
