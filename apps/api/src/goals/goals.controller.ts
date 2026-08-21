import { Body, Controller, Get, Put, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentSessionId, CurrentUser } from '../auth/current-user.decorator';
import { ROLES } from '../auth/roles';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { UpsertGoalDto } from './dto/goal.dto';
import { GoalsService } from './goals.service';

@ApiTags('goals')
@ApiBearerAuth()
@Controller('goals')
@UseGuards(AuthGuard)
export class GoalsController {
  constructor(private readonly goals: GoalsService) {}

  @Get()
  @ApiOperation({ summary: 'List seller monthly goals' })
  list(@CurrentUser() user: User, @Query('month') month?: string) {
    return this.goals.list(user, month);
  }

  @Put()
  @UseGuards(RolesGuard)
  @Roles(ROLES.ADMIN)
  @ApiOperation({ summary: 'Upsert goal (admin only)' })
  upsert(@Body() dto: UpsertGoalDto, @CurrentUser() user: User, @CurrentSessionId() sessionId?: string) {
    return this.goals.upsert(dto, user, sessionId);
  }
}
