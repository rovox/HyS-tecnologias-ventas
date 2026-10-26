import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RealtimeService } from '../realtime/realtime.service';
import { fieldChanges } from '../domain/audit-diff';

export type AuditEntry = {
  user?: { id: string } | null;
  sessionId?: string;
  /** What happened, e.g. `quotation.update`. Also the realtime event type. */
  action: string;
  /** The aggregate the UI lists (realtime entity), e.g. `quotation`. */
  entity: string;
  id: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  /** Other entities whose lists or totals change too (e.g. a payment affects `project` and `client`). */
  affects?: string[];
  patch?: Record<string, unknown>;
};

/** The single way a mutation is recorded: audit row (who, when, field, before/after) plus the realtime event. */
@Injectable()
export class AuditService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly realtime: RealtimeService,
  ) {}

  /** Call after the transaction commits, so listeners never refetch data that is not there yet. */
  async record(entry: AuditEntry) {
    await this.log(entry);
    this.realtime.emit(entry.action, entry.entity, entry.id, {
      byUserId: entry.user?.id,
      patch: entry.patch,
      affects: entry.affects,
    });
  }

  /** Audit row only (login, logout): nothing for the UI to refresh. Needs a session. */
  async log(entry: Omit<AuditEntry, 'affects' | 'patch'>) {
    if (!entry.user || !entry.sessionId) return;
    const changes = fieldChanges(entry.before, entry.after);
    await this.prisma.activity.create({
      data: {
        userId: entry.user.id,
        sessionId: entry.sessionId,
        action: entry.action,
        entityType: entry.entity,
        entityId: entry.id,
        detalle: Object.keys(changes).length ? (changes as Prisma.InputJsonValue) : undefined,
      },
    });
  }

  list(filter: { limit?: number; userId?: string; action?: string; entity?: string; entityId?: string }) {
    return this.prisma.activity.findMany({
      take: Math.min(filter.limit || 100, 500),
      orderBy: { at: 'desc' },
      where: {
        ...(filter.userId ? { userId: filter.userId } : {}),
        ...(filter.action ? { action: { contains: filter.action } } : {}),
        ...(filter.entity ? { entityType: filter.entity } : {}),
        ...(filter.entityId ? { entityId: filter.entityId } : {}),
      },
      include: { user: { select: { id: true, name: true, email: true } } },
    });
  }
}
