import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { AuthService } from './auth.service';
import { AuthGuard } from './auth.guard';
import { CurrentSessionId, CurrentUser } from './current-user.decorator';
import { ForgotPasswordDto, LoginDto } from './dto/login.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post('login')
  @ApiOperation({ summary: 'Login and create session' })
  login(
    @Body() dto: LoginDto,
    @Req() req: { ip?: string; headers: Record<string, string | string[] | undefined> },
  ) {
    const agent = req.headers['user-agent'];
    return this.auth.login(dto, req.ip, Array.isArray(agent) ? agent[0] : agent);
  }

  @Post('forgot-password')
  @ApiOperation({ summary: 'Request password reset (demo stub)' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.auth.forgotPassword(dto.email);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Post('logout')
  @ApiOperation({ summary: 'End current session' })
  logout(@CurrentUser() user: User, @CurrentSessionId() sessionId?: string) {
    return this.auth.logout(user, sessionId);
  }

  @ApiBearerAuth()
  @UseGuards(AuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Current user profile' })
  me(@CurrentUser() user: User) {
    return this.auth.me(user);
  }
}
