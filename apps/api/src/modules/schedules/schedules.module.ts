import { Module } from '@nestjs/common';
import { SchedulesController } from './schedules.controller';
import { SchedulesService } from './schedules.service';
import { CategoriesModule } from '../categories';
import { FinanceModule } from '../finance';

@Module({
  imports: [CategoriesModule, FinanceModule],
  controllers: [SchedulesController],
  providers: [SchedulesService],
  exports: [SchedulesService],
})
export class SchedulesModule {}
