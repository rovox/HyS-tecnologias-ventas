import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import type { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityService } from './activity.service';
import { LoginDto } from './dto/login.dto';
import { assertAdmin, isAdmin, isVentas } from './roles';

function publicUser(user: User) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    phone: user.phone,
    active: user.active,
    monthlyGoalBs: Number(user.monthlyGoalBs),
    sucursalId: user.sucursalId,
    department: user.sucursalId,
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly activity: ActivityService,
  ) {}

  async login(dto: LoginDto, ip?: string, userAgent?: string) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email.trim().toLowerCase() } });
    if (!user || !user.active) throw new UnauthorizedException('Credenciales inválidas');
    const ok = await bcrypt.compare(dto.password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Credenciales inválidas');

    const session = await this.prisma.session.create({
      data: { userId: user.id, ip: ip || null, userAgent: userAgent || null },
    });
    await this.activity.log(user.id, session.id, 'login', 'session', session.id);

    const accessToken = await this.jwt.signAsync({
      sub: user.id,
      email: user.email,
      role: user.role,
      sessionId: session.id,
    });
    return { user: publicUser(user), accessToken };
  }

  async logout(user: User, sessionId?: string) {
    if (sessionId) {
      await this.prisma.session.updateMany({
        where: { id: sessionId, endedAt: null },
        data: { endedAt: new Date() },
      });
      await this.activity.log(user.id, sessionId, 'logout', 'session', sessionId);
    }
    return { ok: true };
  }

  me(user: User) {
    return publicUser(user);
  }

  async forgotPassword(email: string) {
    const user = await this.prisma.user.findUnique({ where: { email: email.trim().toLowerCase() } });
    if (user) {
      const open = await this.prisma.session.findFirst({
        where: { userId: user.id, endedAt: null },
        orderBy: { startedAt: 'desc' },
      });
      if (open) await this.activity.log(user.id, open.id, 'forgot_password', 'user', user.id);
    }
    return { ok: true };
  }

  async listUsers(actor: User) {
    if (!isAdmin(actor) && !isVentas(actor)) throw new ForbiddenException('Sin permiso para listar usuarios');
    const rows = await this.prisma.user.findMany({
      where: { active: true },
      select: { id: true, email: true, name: true, role: true, phone: true, active: true, monthlyGoalBs: true, sucursalId: true },
      orderBy: { name: 'asc' },
    });
    return rows.map((row) => ({ ...row, monthlyGoalBs: Number(row.monthlyGoalBs), department: row.sucursalId }));
  }

  async listSessions(actor: User) {
    assertAdmin(actor);
    return this.prisma.session.findMany({
      orderBy: { startedAt: 'desc' },
      take: 100,
      include: { user: { select: { id: true, email: true, name: true, role: true } } },
    });
  }

  async sessionActivity(actor: User, sessionId: string) {
    assertAdmin(actor);
    return this.prisma.activity.findMany({
      where: { sessionId },
      orderBy: { at: 'desc' },
    });
  }
}
