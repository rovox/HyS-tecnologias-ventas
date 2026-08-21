import { BadRequestException, ConflictException, Injectable } from '@nestjs/common';
import type { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityService } from '../auth/activity.service';
import { assertCanMutateQuotes } from '../auth/roles';
import { CreateCategoryDto } from './dto/category.dto';

function slugify(label: string) {
  return label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 64);
}

@Injectable()
export class CategoriesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
  ) {}

  list() {
    return this.prisma.quotationCategory.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
    });
  }

  async create(dto: CreateCategoryDto, user: User, sessionId?: string) {
    assertCanMutateQuotes(user);
    const label = dto.label.trim();
    if (label.length < 2) throw new BadRequestException('Nombre de categoría muy corto');
    const id = (dto.id || slugify(label) || `cat_${Date.now()}`).slice(0, 64);
    const existing = await this.prisma.quotationCategory.findFirst({
      where: { OR: [{ id }, { label }] },
    });
    if (existing) throw new ConflictException('Ya existe una categoría con ese nombre o id');
    const maxSort = await this.prisma.quotationCategory.aggregate({ _max: { sortOrder: true } });
    const row = await this.prisma.quotationCategory.create({
      data: {
        id,
        label,
        sortOrder: (maxSort._max.sortOrder ?? 0) + 1,
        active: true,
      },
    });
    await this.activity.log(user.id, sessionId, 'category.create', 'quotation_category', row.id);
    return row;
  }
}
