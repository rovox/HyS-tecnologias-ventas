import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentUser } from '../auth/current-user.decorator';
import { MetricsService } from './metrics.service';
import { metricsUserId } from '../auth/roles';

@ApiTags('metrics')
@ApiBearerAuth()
@Controller('metrics')
@UseGuards(AuthGuard)
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get('sales')
  @ApiOperation({ summary: 'Sales goal metrics for a month' })
  sales(@CurrentUser() user: User, @Query('month') month?: string, @Query('userId') userId?: string) {
    return this.metrics.sales(metricsUserId(user, userId), month);
  }

  @Get('activity')
  @ApiOperation({ summary: 'Activity chart metrics' })
  activity(@CurrentUser() user: User, @Query('month') month?: string, @Query('userId') userId?: string) {
    return this.metrics.activity(metricsUserId(user, userId), month);
  }

  @Get('feed')
  @ApiOperation({ summary: 'Activity feed' })
  feed(@CurrentUser() user: User) {
    return this.metrics.feed(user);
  }
}
