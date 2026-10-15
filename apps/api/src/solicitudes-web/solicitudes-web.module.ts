import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { ClientsModule } from '../clients/clients.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { SolicitudesWebController, SolicitudesWebhookController } from './solicitudes-web.controller';
import { SolicitudesWebService } from './solicitudes-web.service';
import { WebhookKeyGuard } from './webhook-key.guard';

@Module({
  imports: [AuthModule, RealtimeModule, ClientsModule],
  controllers: [SolicitudesWebhookController, SolicitudesWebController],
  providers: [SolicitudesWebService, WebhookKeyGuard],
})
export class SolicitudesWebModule {}
