import { Module } from '@nestjs/common';
import { ClientReportService } from './client-report.service';
import { ReportingController } from './reporting.controller';

/** Read side (CQRS-style): views that join several modules. It never writes. */
@Module({
  controllers: [ReportingController],
  providers: [ClientReportService],
})
export class ReportingModule {}
