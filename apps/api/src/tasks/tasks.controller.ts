import { Body, Controller, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentSessionId, CurrentUser } from '../auth/current-user.decorator';
import { ROLES } from '../auth/roles';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import { TasksService } from './tasks.service';

@ApiTags('tasks')
@ApiBearerAuth()
@Controller('tasks')
@UseGuards(AuthGuard)
export class TasksController {
  constructor(private readonly tasks: TasksService) {}

  @Get()
  @ApiOperation({ summary: 'List tasks visible to the user' })
  list(@CurrentUser() user: User, @Query('tipo') tipo?: string) {
    return this.tasks.list(user, tipo);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get task by id' })
  get(@Param('id') id: string, @CurrentUser() user: User) {
    return this.tasks.get(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Create task' })
  create(@Body() dto: CreateTaskDto, @CurrentUser() user: User, @CurrentSessionId() sessionId?: string) {
    return this.tasks.create(dto, user, sessionId);
  }

  @Post(':id/claim')
  @UseGuards(RolesGuard)
  @Roles(ROLES.ADMIN, ROLES.VENTAS)
  @ApiOperation({ summary: 'Claim an unassigned quotation task' })
  claim(@Param('id') id: string, @CurrentUser() user: User, @CurrentSessionId() sessionId?: string) {
    return this.tasks.claim(id, user, sessionId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update task' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
    @CurrentUser() user: User,
    @CurrentSessionId() sessionId?: string,
  ) {
    return this.tasks.update(id, dto, user, sessionId);
  }
}
