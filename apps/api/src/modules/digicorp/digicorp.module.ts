import { Module } from '@nestjs/common';
import { DigicorpController } from './digicorp.controller';
import { DigicorpService } from './digicorp.service';

@Module({
  controllers: [DigicorpController],
  providers: [DigicorpService],
})
export class DigicorpModule {}
