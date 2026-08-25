import { Body, Controller, Get, Param, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentSessionId, CurrentUser } from '../auth/current-user.decorator';
import { ROLES } from '../auth/roles';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, PatchCategoryDto } from './dto/category.dto';

@ApiTags('categories')
@ApiBearerAuth()
@Controller('categories')
@UseGuards(AuthGuard)
export class CategoriesController {
  constructor(private readonly categories: CategoriesService) {}

  @Get()
  @ApiOperation({ summary: 'List active quotation categories' })
  list() {
    return this.categories.list();
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(ROLES.ADMIN, ROLES.VENTAS, ROLES.CONT)
  @ApiOperation({ summary: 'Create quotation category' })
  create(@Body() dto: CreateCategoryDto, @CurrentUser() user: User, @CurrentSessionId() sessionId?: string) {
    return this.categories.create(dto, user, sessionId);
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(ROLES.ADMIN, ROLES.VENTAS, ROLES.CONT)
  @ApiOperation({ summary: 'Deactivate quotation category (soft delete)' })
  deactivate(
    @Param('id') id: string,
    @Body() dto: PatchCategoryDto,
    @CurrentUser() user: User,
    @CurrentSessionId() sessionId?: string,
  ) {
    return this.categories.deactivate(id, dto, user, sessionId);
  }
}
