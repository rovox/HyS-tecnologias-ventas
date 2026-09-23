import {
  Controller,
  Header,
  Post,
  Query,
  Req,
  Sse,
  UnauthorizedException,
  UseGuards,
  MessageEvent,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtService } from '@nestjs/jwt';
import { Observable } from 'rxjs';
import type { User } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { RealtimeService } from './realtime.service';

type AuthRequest = { user: User };

@ApiTags('realtime')
@Controller('realtime')
export class RealtimeController {
  constructor(
    private readonly realtime: RealtimeService,
    private readonly jwt: JwtService,
  ) {}

  @Post('ticket')
  @UseGuards(AuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Emit short-lived SSE ticket (query token)' })
  async ticket(@Req() req: AuthRequest) {
    const token = await this.jwt.signAsync(
      { sub: req.user.id, purpose: 'sse' },
      { expiresIn: '60s' },
    );
    return { token, expiresIn: 60 };
  }

  @Sse('events')
  @Header('X-Accel-Buffering', 'no')
  @Header('Cache-Control', 'no-cache')
  @Header('Connection', 'keep-alive')
  @ApiOperation({ summary: 'SSE stream — pass ticket as ?access_token=' })
  async events(@Query('access_token') accessToken?: string): Promise<Observable<MessageEvent>> {
    const token = String(accessToken || '').trim();
    if (!token) throw new UnauthorizedException('Ticket SSE requerido');
    try {
      const payload = await this.jwt.verifyAsync<{ sub: string; purpose?: string }>(token);
      if (payload.purpose !== 'sse') throw new UnauthorizedException('Ticket inválido');
    } catch {
      throw new UnauthorizedException('Ticket SSE inválido o vencido');
    }
    return this.realtime.stream();
  }
}
