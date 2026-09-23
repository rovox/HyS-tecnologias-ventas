import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { RealtimeModule } from '../realtime/realtime.module';
import { QuotationsController, QuotationFilesController } from './quotations.controller';
import { QuotationsService } from './quotations.service';

@Module({
  imports: [AuthModule, RealtimeModule],
  controllers: [QuotationsController, QuotationFilesController],
  providers: [QuotationsService],
})
export class QuotationsModule {}
