import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentSessionId, CurrentUser } from '../auth/current-user.decorator';
import { ROLES } from '../auth/roles';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { CreateJobDto, CreatePaymentDto, JobStatusDto } from './dto/sales.dto';
import { SalesService } from './sales.service';

@ApiTags('sales')
@ApiBearerAuth()
@Controller('sales')
@UseGuards(AuthGuard)
export class SalesController {
  constructor(private readonly sales: SalesService) {}

  @Get()
  @ApiOperation({ summary: 'List sales (frozen domain — read)' })
  list(@CurrentUser() user: User) {
    return this.sales.list(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get sale by id' })
  get(@Param('id') id: string, @CurrentUser() user: User) {
    return this.sales.get(id, user);
  }

  @Post(':id/jobs')
  @UseGuards(RolesGuard)
  @Roles(ROLES.ADMIN)
  @ApiOperation({ summary: 'Add job (admin only; domain frozen)' })
  addJob(
    @Param('id') id: string,
    @Body() dto: CreateJobDto,
    @CurrentUser() user: User,
    @CurrentSessionId() sessionId?: string,
  ) {
    return this.sales.addJob(id, dto, user, sessionId);
  }

  @Patch(':id/jobs/:jobId')
  @UseGuards(RolesGuard)
  @Roles(ROLES.ADMIN)
  @ApiOperation({ summary: 'Update job status (admin only; domain frozen)' })
  updateJob(
    @Param('id') id: string,
    @Param('jobId') jobId: string,
    @Body() dto: JobStatusDto,
    @CurrentUser() user: User,
    @CurrentSessionId() sessionId?: string,
  ) {
    return this.sales.updateJob(id, jobId, dto.estado, user, sessionId);
  }

  @Post(':id/payments')
  @UseGuards(RolesGuard)
  @Roles(ROLES.ADMIN)
  @ApiOperation({ summary: 'Add payment (admin only; domain frozen)' })
  addPayment(
    @Param('id') id: string,
    @Body() dto: CreatePaymentDto,
    @CurrentUser() user: User,
    @CurrentSessionId() sessionId?: string,
  ) {
    return this.sales.addPayment(id, dto, user, sessionId);
  }
}
