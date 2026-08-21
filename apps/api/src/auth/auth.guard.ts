import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly jwt: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext) {
    const req = context.switchToHttp().getRequest();
    const header = String(req.headers.authorization || '');
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) throw new UnauthorizedException('Sesión requerida');

    let payload: { sub: string; sessionId?: string };
    try {
      payload = await this.jwt.verifyAsync<{ sub: string; sessionId?: string }>(token);
    } catch {
      throw new UnauthorizedException('Token inválido o vencido');
    }
    if (!payload.sessionId) {
      throw new UnauthorizedException('Sesión requerida');
    }
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.active) throw new UnauthorizedException('Cuenta inactiva');
    const session = await this.prisma.session.findUnique({ where: { id: payload.sessionId } });
    if (!session || session.endedAt) throw new UnauthorizedException('Sesión cerrada');
    req.user = user;
    req.sessionId = payload.sessionId;
    return true;
  }
}
