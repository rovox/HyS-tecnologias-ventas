import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PrismaModule } from './common/prisma/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { ClientsModule } from './modules/clients/clients.module';
import { QuotationsModule } from './modules/quotations/quotations.module';
import { SucursalesModule } from './modules/sucursales/sucursales.module';
import { RelevamientosModule } from './modules/relevamientos/relevamientos.module';
import { GoalsModule } from './modules/goals/goals.module';
import { SalesModule } from './modules/sales/sales.module';
import { MetricsModule } from './modules/metrics/metrics.module';
import { TasksModule } from './modules/tasks/tasks.module';
import { SchedulesModule } from './modules/schedules/schedules.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { RealtimeModule } from './common/realtime/realtime.module';
import { PedidosInternosModule } from './modules/pedidos-internos/pedidos-internos.module';
import { SolicitudesWebModule } from './modules/solicitudes-web/solicitudes-web.module';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    JwtModule.registerAsync({
      global: true,
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = (config.get<string>('JWT_SECRET') || '').trim();
        if (!secret || secret === 'cambiar-en-hostinger') {
          throw new Error(
            'JWT_SECRET debe estar definido en el entorno (hPanel). No se permite el valor por defecto.',
          );
        }
        return {
          secret,
          signOptions: { expiresIn: '8h' as const },
        };
      },
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
    RealtimeModule,
    PedidosInternosModule,
    SolicitudesWebModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
