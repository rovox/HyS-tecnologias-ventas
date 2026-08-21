import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ActivityService {
  constructor(private readonly prisma: PrismaService) {}

  async log(userId: string, sessionId: string | undefined, action: string, entityType?: string, entityId?: string) {
    if (!sessionId) return;
    await this.prisma.activity.create({
      data: { userId, sessionId, action, entityType, entityId },
    });
  }
}
