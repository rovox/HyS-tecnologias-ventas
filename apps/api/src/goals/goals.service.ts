import { BadRequestException, Injectable } from '@nestjs/common';
import type { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityService } from '../auth/activity.service';
import { UpsertGoalDto } from './dto/goal.dto';
import { assertAdmin, isAdmin, isVentas } from '../auth/roles';

function monthStart(month?: string) {
  const prefix = month || new Date().toISOString().slice(0, 7);
  const start = new Date(`${prefix}-01T00:00:00.000Z`);
  if (Number.isNaN(start.getTime())) throw new BadRequestException('Mes inválido');
  return { prefix, start };
}

@Injectable()
export class GoalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
  ) {}

  list(user: User, month?: string) {
    const { start } = monthStart(month);
    return this.prisma.sellerGoal.findMany({
      where: { mes: start, ...(isVentas(user) && !isAdmin(user) ? { usuarioId: user.id } : {}) },
      include: { usuario: { select: { id: true, name: true, role: true } } },
    });
  }

  async upsert(dto: UpsertGoalDto, user: User, sessionId?: string) {
    assertAdmin(user);
    const { start } = monthStart(dto.month);
    const row = await this.prisma.sellerGoal.upsert({
      where: { usuarioId_mes: { usuarioId: dto.usuarioId, mes: start } },
      update: { metaMonto: dto.metaMonto, metaCotiz: dto.metaCotiz },
      create: { usuarioId: dto.usuarioId, mes: start, metaMonto: dto.metaMonto, metaCotiz: dto.metaCotiz },
    });
    await this.activity.log(user.id, sessionId, 'goal.upsert', 'seller_goal', row.id);
    return row;
  }
}
