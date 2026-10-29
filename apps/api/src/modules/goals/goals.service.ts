import { BadRequestException, Injectable } from '@nestjs/common';
import type { User } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { UpsertGoalDto } from './dto/goal.dto';
import { assertAdmin, goalWhere } from '../../common/policy/roles';

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
    private readonly audit: AuditService,
  ) {}

  list(user: User, month?: string) {
    const { start } = monthStart(month);
    return this.prisma.sellerGoal.findMany({
      where: { mes: start, ...goalWhere(user) },
      include: { usuario: { select: { id: true, name: true, role: true } } },
    });
  }

  async upsert(dto: UpsertGoalDto, user: User, sessionId?: string) {
    assertAdmin(user);
    const { start } = monthStart(dto.month);
    const row = await this.prisma.sellerGoal.upsert({
      where: { usuarioId_mes: { usuarioId: dto.usuarioId, mes: start } },
      update: { metaMonto: dto.metaMonto, ...(dto.metaCotiz !== undefined ? { metaCotiz: dto.metaCotiz } : {}) },
      create: { usuarioId: dto.usuarioId, mes: start, metaMonto: dto.metaMonto, metaCotiz: dto.metaCotiz ?? 0 },
    });
    await this.audit.record({ user, sessionId, action: 'goal.upsert', entity: 'goal', id: row.id });
    return row;
  }
}
