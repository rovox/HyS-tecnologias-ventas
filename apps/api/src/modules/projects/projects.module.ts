import { Module } from '@nestjs/common';
import { SchedulesModule } from '../schedules';
import { FinanceModule } from '../finance';
import { ProjectsController } from './projects.controller';
import { ProjectsService } from './projects.service';

@Module({
  imports: [SchedulesModule, FinanceModule],
  controllers: [ProjectsController],
  providers: [ProjectsService],
  exports: [ProjectsService],
})
export class ProjectsModule {}
