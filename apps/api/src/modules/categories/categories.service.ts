import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import type { User } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { assertCanMutateQuotes } from '../../common/policy/roles';
import { CreateCategoryDto, PatchCategoryDto } from './dto/category.dto';
import { chipChangeError, divisionError } from './domain/categories.rules';

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
    private readonly audit: AuditService,
  ) {}

  /** Active categories: the 3 divisions first, then the subcategory chips. */
  list() {
    return this.prisma.quotationCategory.findMany({
      where: { active: true },
      orderBy: [{ principal: 'desc' }, { sortOrder: 'asc' }, { label: 'asc' }],
    });
  }

  /** Used by quotations and jobs: the category must be one of the active divisions (400 otherwise). */
  async assertDivision(id: string | undefined | null) {
    const row = id ? await this.prisma.quotationCategory.findUnique({ where: { id } }) : null;
    const error = divisionError(row);
    if (error) throw new BadRequestException(error);
    return row!;
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
    await this.audit.record({ user, sessionId, action: 'category.create', entity: 'category', id: row.id });
    return row;
  }

  async deactivate(id: string, dto: PatchCategoryDto, user: User, sessionId?: string) {
    assertCanMutateQuotes(user);
    const row = await this.prisma.quotationCategory.findUnique({ where: { id } });
    if (!row) throw new NotFoundException('Categoría no encontrada');
    const fixed = chipChangeError(row);
    if (fixed) throw new BadRequestException(fixed);
    if (dto.active === false || dto.active === undefined) {
      const updated = await this.prisma.quotationCategory.update({
        where: { id },
        data: { active: false },
      });
      await this.audit.record({ user, sessionId, action: 'category.deactivate', entity: 'category', id });
      return updated;
    }
    const updated = await this.prisma.quotationCategory.update({
      where: { id },
      data: { active: dto.active },
    });
    await this.audit.record({ user, sessionId, action: 'category.update', entity: 'category', id });
    return updated;
  }
}
