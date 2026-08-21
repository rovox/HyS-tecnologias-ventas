import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiBearerAuth, ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentSessionId, CurrentUser } from '../auth/current-user.decorator';
import { ROLES } from '../auth/roles';
import { Roles, RolesGuard } from '../auth/roles.guard';
import { CreateQuotationDto, StatusDto } from './dto/quotation.dto';
import { QuotationsService } from './quotations.service';

@ApiTags('quotations')
@ApiBearerAuth()
@Controller('quotations')
@UseGuards(AuthGuard)
export class QuotationsController {
  constructor(private readonly quotations: QuotationsService) {}

  @Get()
  @ApiOperation({ summary: 'List quotations' })
  list(
    @Query('estado') estado?: string,
    @Query('vendedorId') vendedorId?: string,
    @Query('sucursalId') sucursalId?: string,
    @CurrentUser() user?: User,
  ) {
    return this.quotations.list({ estado, vendedorId, sucursalId }, user as User);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get quotation by id' })
  get(@Param('id') id: string, @CurrentUser() user: User) {
    return this.quotations.get(id, user);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(ROLES.ADMIN, ROLES.VENTAS)
  @ApiOperation({ summary: 'Create quotation' })
  create(@Body() dto: CreateQuotationDto, @CurrentUser() user: User, @CurrentSessionId() sessionId?: string) {
    return this.quotations.create(dto, user, sessionId);
  }

  @Post(':id/status')
  @UseGuards(RolesGuard)
  @Roles(ROLES.ADMIN, ROLES.VENTAS)
  @ApiOperation({ summary: 'Change quotation status' })
  status(
    @Param('id') id: string,
    @Body() dto: StatusDto,
    @CurrentUser() user: User,
    @CurrentSessionId() sessionId?: string,
  ) {
    return this.quotations.updateStatus(id, dto.estado, user, sessionId, dto.motivoRechazo);
  }

  @Post(':id/accept')
  @UseGuards(RolesGuard)
  @Roles(ROLES.ADMIN, ROLES.VENTAS)
  @ApiOperation({ summary: 'Accept quotation (shortcut)' })
  accept(@Param('id') id: string, @CurrentUser() user: User, @CurrentSessionId() sessionId?: string) {
    return this.quotations.accept(id, user, sessionId);
  }

  @Post(':id/files')
  @ApiOperation({ summary: 'Upload quotation PDF' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 15 * 1024 * 1024 } }))
  files(
    @Param('id') id: string,
    @UploadedFile() file: { buffer?: Buffer; path?: string; originalname?: string },
    @CurrentUser() user: User,
    @CurrentSessionId() sessionId?: string,
  ) {
    return this.quotations.attachFile(id, file, user, sessionId);
  }
}

@ApiTags('files')
@ApiBearerAuth()
@Controller('files/quotations')
@UseGuards(AuthGuard)
export class QuotationFilesController {
  constructor(private readonly quotations: QuotationsService) {}

  @Get(':name')
  @ApiOperation({ summary: 'Download quotation PDF by stored name' })
  async getFile(
    @Param('name') name: string,
    @CurrentUser() user: User,
    @Res() res: { sendFile: (path: string) => unknown },
  ) {
    const full = await this.quotations.filePath(name, user);
    return res.sendFile(full);
  }
}
