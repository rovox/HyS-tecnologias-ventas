import { Module } from '@nestjs/common';
import { QuotationsController, QuotationFilesController } from './quotations.controller';
import { QuotationsService } from './quotations.service';

@Module({
  controllers: [QuotationsController, QuotationFilesController],
  providers: [QuotationsService],
})
export class QuotationsModule {}
