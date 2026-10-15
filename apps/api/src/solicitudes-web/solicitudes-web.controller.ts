import { Body, Controller, Get, HttpCode, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { User } from '@prisma/client';
import { AuthGuard } from '../auth/auth.guard';
import { CurrentSessionId, CurrentUser } from '../auth/current-user.decorator';
import { UpdateSolicitudDto, WebhookSolicitudDto } from './dto/solicitud-web.dto';
import { SolicitudesWebService } from './solicitudes-web.service';
import { WebhookKeyGuard } from './webhook-key.guard';

/** Called by the WordPress site (server to server), never by the SPA. */
@ApiTags('solicitudes-web')
@Controller('solicitudes-web/webhook')
@UseGuards(WebhookKeyGuard)
export class SolicitudesWebhookController {
  constructor(private readonly solicitudes: SolicitudesWebService) {}

  @Post()
  @HttpCode(201)
  @ApiHeader({ name: 'X-HS-Webhook-Key', required: true })
  @ApiOperation({ summary: 'Store a contact-form request from hstecnologias.com' })
  create(@Body() dto: WebhookSolicitudDto) {
    return this.solicitudes.createFromWebhook(dto);
  }
}

@ApiTags('solicitudes-web')
@ApiBearerAuth()
@Controller('solicitudes-web')
@UseGuards(AuthGuard)
export class SolicitudesWebController {
  constructor(private readonly solicitudes: SolicitudesWebService) {}

  @Get()
  @ApiOperation({ summary: 'List web requests (optional estado / q filters)' })
  list(@CurrentUser() user: User, @Query('estado') estado?: string, @Query('q') q?: string) {
    return this.solicitudes.list(user, estado, q);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get web request by id' })
  get(@Param('id') id: string, @CurrentUser() user: User) {
    return this.solicitudes.get(id, user);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update state (nueva / contactada / descartada) or notes' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSolicitudDto,
    @CurrentUser() user: User,
    @CurrentSessionId() sessionId?: string,
  ) {
    return this.solicitudes.update(id, dto, user, sessionId);
  }

  @Post(':id/convertir')
  @ApiOperation({ summary: 'Convert into an official client (reuses an existing match)' })
  convert(@Param('id') id: string, @CurrentUser() user: User, @CurrentSessionId() sessionId?: string) {
    return this.solicitudes.convert(id, user, sessionId);
  }
}
