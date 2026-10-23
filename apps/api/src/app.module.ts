import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { CommonModule } from './common/common.module';
import { AuthModule } from './modules/auth';
import { ClientsModule } from './modules/clients';
import { QuotationsModule } from './modules/quotations';
import { SucursalesModule } from './modules/sucursales';
import { RelevamientosModule } from './modules/relevamientos';
import { GoalsModule } from './modules/goals';
import { SalesModule } from './modules/sales';
import { MetricsModule } from './modules/metrics';
import { TasksModule } from './modules/tasks';
import { SchedulesModule } from './modules/schedules';
import { CategoriesModule } from './modules/categories';
import { PedidosInternosModule } from './modules/pedidos-internos';
import { SolicitudesWebModule } from './modules/solicitudes-web';
import { ProjectsModule } from './modules/projects';
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
    CommonModule,
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
    PedidosInternosModule,
    SolicitudesWebModule,
    ProjectsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
