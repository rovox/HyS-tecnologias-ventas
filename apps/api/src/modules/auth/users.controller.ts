import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { AuthGuard } from '../../common/auth/auth.guard';
import { AuthService } from './auth.service';
import { CurrentUser } from '../../common/auth/current-user.decorator';

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
@UseGuards(AuthGuard)
export class UsersController {
  constructor(private readonly auth: AuthService) {}

  @Get()
  @ApiOperation({ summary: 'List users visible to the current role' })
  list(@CurrentUser() user: User) {
    return this.auth.listUsers(user);
  }

  @Get('directory')
  @ApiOperation({ summary: 'Id, name and role of active users (any role with access)' })
  directory(@CurrentUser() user: User) {
    return this.auth.userDirectory(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'One user profile (self, or admin/ventas)' })
  get(@Param('id') id: string, @CurrentUser() user: User) {
    return this.auth.getUser(user, id);
  }
}
