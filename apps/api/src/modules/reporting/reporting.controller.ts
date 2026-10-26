import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { AuthGuard } from '../../common/auth/auth.guard';
import { CurrentUser } from '../../common/auth/current-user.decorator';
import { ClientReportService } from './client-report.service';

@ApiTags('reporting')
@ApiBearerAuth()
@Controller('reporting')
@UseGuards(AuthGuard)
export class ReportingController {
  constructor(private readonly clients: ClientReportService) {}

  @Get('clients')
  @ApiOperation({ summary: 'Clients with what they owe and whether a service is in course' })
  clientList(@CurrentUser() user: User) {
    return this.clients.clients(user);
  }

  @Get('clients/:id')
  @ApiOperation({ summary: 'Client page: projects with warranty, jobs, quotations, payments, visits' })
  client(@Param('id') id: string, @CurrentUser() user: User) {
    return this.clients.client(id, user);
  }
}
