import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { AuthGuard } from './auth.guard';
import { CurrentUser } from './current-user.decorator';
import { AuthService } from './auth.service';

@ApiTags('sessions')
@ApiBearerAuth()
@Controller('sessions')
@UseGuards(AuthGuard)
export class SessionsController {
  constructor(private readonly auth: AuthService) {}

  @Get()
  @ApiOperation({ summary: 'List sessions' })
  list(@CurrentUser() user: User) {
    return this.auth.listSessions(user);
  }

  @Get(':id/activity')
  @ApiOperation({ summary: 'Activity log for a session' })
  activity(@CurrentUser() user: User, @Param('id') id: string) {
    return this.auth.sessionActivity(user, id);
  }
}
