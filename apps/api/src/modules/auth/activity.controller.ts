import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { AuthGuard } from '../../common/auth/auth.guard';
import { Roles, RolesGuard } from '../../common/auth/roles.guard';
import { AuditService } from '../../common/audit/audit.service';
import { ROLES } from '../../common/policy/roles';

@ApiTags('activity')
@Controller('activity')
@UseGuards(AuthGuard, RolesGuard)
@ApiBearerAuth()
export class ActivityController {
  constructor(private readonly audit: AuditService) {}

  @Get()
  @Roles(ROLES.ADMIN)
  @ApiOperation({ summary: 'List audit activity log' })
  list(
    @Query('limit') limit?: string,
    @Query('userId') userId?: string,
    @Query('action') action?: string,
  ) {
    return this.audit.list({ limit: Number(limit) || undefined, userId, action });
  }

  /** History of one record (chatter): visible to everyone who works in the app, as business-design §3 asks. */
  @Get(':entity/:id')
  @Roles(ROLES.ADMIN, ROLES.VENTAS, ROLES.TEC)
  @ApiOperation({ summary: 'Change history of one record' })
  history(@Param('entity') entity: string, @Param('id') id: string) {
    return this.audit.list({ entity, entityId: id, limit: 200 });
  }
}
