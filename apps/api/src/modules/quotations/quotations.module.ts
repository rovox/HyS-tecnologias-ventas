import { Module } from '@nestjs/common';
import { QuotationsController, QuotationFilesController } from './quotations.controller';
import { QuotationsService } from './quotations.service';
import { QuotationFilesService } from './quotation-files.service';
import { QuotationFlowService } from './quotation-flow.service';
import { CategoriesModule } from '../categories';
import { TasksModule } from '../tasks';

@Module({
  imports: [CategoriesModule, TasksModule],
  controllers: [QuotationsController, QuotationFilesController],
  providers: [QuotationsService, QuotationFlowService, QuotationFilesService],
})
export class QuotationsModule {}
