import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
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
import { AuthGuard } from '../../common/auth/auth.guard';
import { CurrentSessionId, CurrentUser } from '../../common/auth/current-user.decorator';
import { ROLES } from '../../common/policy/roles';
import { Roles, RolesGuard } from '../../common/auth/roles.guard';
import {
  AcceptQuotationDto,
  CreateQuotationDto,
  DeleteQuotationDto,
  ListQuotationsQuery,
  StatusDto,
  UpdateQuotationDto,
} from './dto/quotation.dto';
import { QuotationsService } from './quotations.service';
import { QuotationFilesService } from './quotation-files.service';
import { QuotationFlowService } from './quotation-flow.service';

@ApiTags('quotations')
@ApiBearerAuth()
@Controller('quotations')
@UseGuards(AuthGuard)
export class QuotationsController {
  constructor(
    private readonly quotations: QuotationsService,
    private readonly quotationFiles: QuotationFilesService,
    private readonly flow: QuotationFlowService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List quotations (vista=abiertas | cerradas, filters, search)' })
  list(@Query() query: ListQuotationsQuery, @CurrentUser() user: User) {
    return this.quotations.list(query, user);
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

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles(ROLES.ADMIN, ROLES.VENTAS)
  @ApiOperation({ summary: 'Update quotation (encargado, licitación, plazo)' })
  patch(
    @Param('id') id: string,
    @Body() dto: UpdateQuotationDto,
    @CurrentUser() user: User,
    @CurrentSessionId() sessionId?: string,
  ) {
    return this.quotations.update(id, dto, user, sessionId);
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
    return this.flow.updateStatus(id, dto.estado, user, sessionId, dto.motivoRechazo, dto.fechaEnvio);
  }

  @Post(':id/eliminar')
  @UseGuards(RolesGuard)
  @Roles(ROLES.ADMIN, ROLES.VENTAS)
  @ApiOperation({ summary: 'Delete (hide) a quotation with a reason; it stays in "cerradas" and can be restored' })
  remove(
    @Param('id') id: string,
    @Body() dto: DeleteQuotationDto,
    @CurrentUser() user: User,
    @CurrentSessionId() sessionId?: string,
  ) {
    return this.flow.remove(id, dto.motivo, user, sessionId);
  }

  @Post(':id/restaurar')
  @UseGuards(RolesGuard)
  @Roles(ROLES.ADMIN, ROLES.VENTAS)
  @ApiOperation({ summary: 'Restore a deleted quotation' })
  restore(@Param('id') id: string, @CurrentUser() user: User, @CurrentSessionId() sessionId?: string) {
    return this.flow.restore(id, user, sessionId);
  }

  @Post(':id/accept')
  @UseGuards(RolesGuard)
  @Roles(ROLES.ADMIN, ROLES.VENTAS)
  @ApiOperation({ summary: 'Approve quotation: creates the project (idempotent)' })
  accept(
    @Param('id') id: string,
    @Body() dto: AcceptQuotationDto,
    @CurrentUser() user: User,
    @CurrentSessionId() sessionId?: string,
  ) {
    return this.flow.accept(id, dto, user, sessionId);
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
    @Query('kind') kind: string | undefined,
    @UploadedFile() file: { buffer?: Buffer; path?: string; originalname?: string },
    @CurrentUser() user: User,
    @CurrentSessionId() sessionId?: string,
  ) {
    return this.quotationFiles.attachFile(id, file, user, sessionId, kind || 'pdf');
  }
}

@ApiTags('files')
@ApiBearerAuth()
@Controller('files/quotations')
@UseGuards(AuthGuard)
export class QuotationFilesController {
  constructor(private readonly files: QuotationFilesService) {}

  @Get(':name')
  @ApiOperation({ summary: 'Download quotation PDF by stored name' })
  async getFile(
    @Param('name') name: string,
    @CurrentUser() user: User,
    @Res() res: { sendFile: (path: string) => unknown },
  ) {
    const full = await this.files.filePath(name, user);
    return res.sendFile(full);
  }
}
