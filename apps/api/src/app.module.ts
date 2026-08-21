import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ClientsModule } from './clients/clients.module';
import { QuotationsModule } from './quotations/quotations.module';
import { SucursalesModule } from './sucursales/sucursales.module';
import { RelevamientosModule } from './relevamientos/relevamientos.module';
import { GoalsModule } from './goals/goals.module';
import { SalesModule } from './sales/sales.module';
import { MetricsModule } from './metrics/metrics.module';
import { TasksModule } from './tasks/tasks.module';
import { SchedulesModule } from './schedules/schedules.module';
import { CategoriesModule } from './categories/categories.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_SECRET') || 'cambiar-en-hostinger',
        signOptions: { expiresIn: '8h' as const },
      }),
    }),
    PrismaModule,
    AuthModule,
    ClientsModule,
    QuotationsModule,
    SucursalesModule,
    RelevamientosModule,
    GoalsModule,
    SalesModule,
    MetricsModule,
    TasksModule,
    SchedulesModule,
    CategoriesModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
