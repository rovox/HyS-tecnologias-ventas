import { Module } from '@nestjs/common';
import { ClientsModule } from '../clients';
import { SolicitudesWebController, SolicitudesWebhookController } from './solicitudes-web.controller';
import { SolicitudesWebService } from './solicitudes-web.service';
import { WebhookKeyGuard } from './webhook-key.guard';

@Module({
  imports: [ClientsModule],
  controllers: [SolicitudesWebhookController, SolicitudesWebController],
  providers: [SolicitudesWebService, WebhookKeyGuard],
})
export class SolicitudesWebModule {}
