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
import { AuthGuard } from '../auth/auth.guard';
import { CurrentSessionId, CurrentUser } from '../auth/current-user.decorator';
import { UpsertRelevamientoDto } from './dto/relevamiento.dto';
import { RelevamientosService } from './relevamientos.service';

@ApiTags('relevamientos')
@ApiBearerAuth()
@Controller('relevamientos')
@UseGuards(AuthGuard)
export class RelevamientosController {
  constructor(private readonly relevamientos: RelevamientosService) {}

  @Get()
  @ApiOperation({ summary: 'List relevamientos' })
  list(@CurrentUser() user: User, @Query('cotizacionId') cotizacionId?: string) {
    return this.relevamientos.list(user, cotizacionId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get relevamiento by id' })
  get(@Param('id') id: string, @CurrentUser() user: User) {
    return this.relevamientos.get(id, user);
  }

  @Post()
  @ApiOperation({ summary: 'Create relevamiento' })
  create(@Body() dto: UpsertRelevamientoDto, @CurrentUser() user: User, @CurrentSessionId() sessionId?: string) {
    return this.relevamientos.create(dto, user, sessionId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update relevamiento (resuelto requiere foto)' })
  update(
    @Param('id') id: string,
    @Body() dto: Partial<UpsertRelevamientoDto>,
    @CurrentUser() user: User,
    @CurrentSessionId() sessionId?: string,
  ) {
    return this.relevamientos.update(id, dto, user, sessionId);
  }

  @Post(':id/files')
  @ApiOperation({ summary: 'Upload evidence photo' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: { file: { type: 'string', format: 'binary' } },
    },
  })
  @UseInterceptors(FileInterceptor('file', { limits: { fileSize: 8 * 1024 * 1024 } }))
  files(
    @Param('id') id: string,
    @UploadedFile() file: { buffer?: Buffer; originalname?: string; mimetype?: string },
    @CurrentUser() user: User,
    @CurrentSessionId() sessionId?: string,
  ) {
    return this.relevamientos.attachPhoto(id, file, user, sessionId);
  }
}

@ApiTags('files')
@ApiBearerAuth()
@Controller('files/relevamientos')
@UseGuards(AuthGuard)
export class RelevamientoFilesController {
  constructor(private readonly relevamientos: RelevamientosService) {}

  @Get(':name')
  @ApiOperation({ summary: 'Download relevamiento photo' })
  async getFile(
    @Param('name') name: string,
    @Res() res: { sendFile: (path: string) => unknown },
  ) {
    const full = await this.relevamientos.filePath(name);
    return res.sendFile(full);
  }
}
