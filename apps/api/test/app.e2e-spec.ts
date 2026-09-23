import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Sales API (e2e)', () => {
  let app: INestApplication;
  let ventasToken = '';
  let adminToken = '';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    await app.init();

    const ventas = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'dennis.ventas@demo.hs.local', password: 'dennis' });
    ventasToken = ventas.body?.accessToken || ventas.body?.token || '';

    const admin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send({ email: 'julio.admin@demo.hs.local', password: 'julio' });
    adminToken = admin.body?.accessToken || admin.body?.token || '';
  });

  afterAll(async () => {
    await app.close();
  });

  it('rejects unauthenticated metrics', async () => {
    await request(app.getHttpServer()).get('/api/metrics/sales').expect(401);
  });

  it('logs in with seed passwords', async () => {
    expect(ventasToken).toBeTruthy();
    expect(adminToken).toBeTruthy();
  });

  it('VENTAS cannot PUT goals', async () => {
    await request(app.getHttpServer())
      .put('/api/goals')
      .set('Authorization', `Bearer ${ventasToken}`)
      .send({ usuarioId: 'usr_ventas', month: '2026-08', metaMonto: 1, metaCotiz: 1 })
      .expect(403);
  });

  it('clients have no DELETE route', async () => {
    await request(app.getHttpServer())
      .delete('/api/clients/cli_andina')
      .set('Authorization', `Bearer ${adminToken}`)
      .expect(404);
  });

  it('creates task with empty optional links', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/tasks')
      .set('Authorization', `Bearer ${ventasToken}`)
      .send({ titulo: 'E2E tarea', horario: '', cotizacionId: '', plazo: '' })
      .expect(201);
    expect(res.body.titulo).toBe('E2E tarea');
  });

  it('lists schedules with filters', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/schedules')
      .query({ estado: 'en_proceso', sucursalId: 'suc_central' })
      .set('Authorization', `Bearer ${ventasToken}`)
      .expect(200);
    expect(Array.isArray(res.body)).toBe(true);
  });

  it('metrics sales accepts month filter', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/metrics/sales')
      .query({ month: '2026-08' })
      .set('Authorization', `Bearer ${ventasToken}`)
      .expect(200);
    expect(res.body.month).toBe('2026-08');
  });

  it('frozen sales jobs require admin', async () => {
    await request(app.getHttpServer())
      .post('/api/sales/sale_andina/jobs')
      .set('Authorization', `Bearer ${ventasToken}`)
      .send({ titulo: 'x' })
      .expect(403);
  });
});
