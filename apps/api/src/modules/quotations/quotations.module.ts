import { Module } from '@nestjs/common';
import { QuotationsController, QuotationFilesController } from './quotations.controller';
import { QuotationsService } from './quotations.service';
import { CategoriesModule } from '../categories';

@Module({
  imports: [CategoriesModule],
  controllers: [QuotationsController, QuotationFilesController],
  providers: [QuotationsService],
})
export class QuotationsModule {}
