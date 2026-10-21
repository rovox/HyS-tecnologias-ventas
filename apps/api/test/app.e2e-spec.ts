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

  describe('solicitudes web (WEB-01)', () => {
    const key = 'e2e-web-leads-key';
    const lead = {
      nombre: 'Prueba E2E',
      empresa: `Empresa E2E ${Date.now()}`,
      email: `e2e-${Date.now()}@demo.bo`,
      telefono: '70011122',
      departamento: 'Cochabamba',
      servicio: 'Cableado estructurado',
      detalle: 'Cableado de 20 puntos Cat 6A con certificación.',
    };
    let solicitudId = '';
    let tecToken = '';

    beforeAll(async () => {
      process.env.WEB_LEADS_KEY = key;
      const tec = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'marcos.tec@demo.hs.local', password: 'marcos' });
      tecToken = tec.body?.accessToken || tec.body?.token || '';
    });

    it('rejects the webhook without the key', async () => {
      await request(app.getHttpServer()).post('/api/solicitudes-web/webhook').send(lead).expect(401);
    });

    it('stores a request with the right key', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/solicitudes-web/webhook')
        .set('X-HS-Webhook-Key', key)
        .send(lead)
        .expect(201);
      solicitudId = res.body.id;
      expect(solicitudId).toBeTruthy();
    });

    it('lists requests for VENTAS and blocks technicians', async () => {
      const res = await request(app.getHttpServer())
        .get('/api/solicitudes-web')
        .query({ q: lead.empresa })
        .set('Authorization', `Bearer ${ventasToken}`)
        .expect(200);
      expect(res.body[0]?.id).toBe(solicitudId);
      await request(app.getHttpServer())
        .get('/api/solicitudes-web')
        .set('Authorization', `Bearer ${tecToken}`)
        .expect(403);
    });

    it('converts into one client and reuses it for a repeated contact', async () => {
      const first = await request(app.getHttpServer())
        .post(`/api/solicitudes-web/${solicitudId}/convertir`)
        .set('Authorization', `Bearer ${ventasToken}`)
        .expect(201);
      expect(first.body.created).toBe(true);
      const clientId = first.body.client.id;

      const again = await request(app.getHttpServer())
        .post('/api/solicitudes-web/webhook')
        .set('X-HS-Webhook-Key', key)
        .send(lead)
        .expect(201);
      const second = await request(app.getHttpServer())
        .post(`/api/solicitudes-web/${again.body.id}/convertir`)
        .set('Authorization', `Bearer ${ventasToken}`)
        .expect(201);
      expect(second.body.created).toBe(false);
      expect(second.body.client.id).toBe(clientId);
    });
  });

  describe('técnico access and pedidos internos (MVP)', () => {
    let tecToken = '';

    beforeAll(async () => {
      const tec = await request(app.getHttpServer())
        .post('/api/auth/login')
        .send({ email: 'marcos.tec@demo.hs.local', password: 'marcos' });
      tecToken = tec.body?.accessToken || tec.body?.token || '';
    });

    it('lets técnico read the user directory and their own profile only', async () => {
      const dir = await request(app.getHttpServer())
        .get('/api/users/directory')
        .set('Authorization', `Bearer ${tecToken}`)
        .expect(200);
      expect(Object.keys(dir.body[0]).sort()).toEqual(['id', 'name', 'role']);
      await request(app.getHttpServer()).get('/api/users').set('Authorization', `Bearer ${tecToken}`).expect(403);
      await request(app.getHttpServer()).get('/api/users/usr_tecnico').set('Authorization', `Bearer ${tecToken}`).expect(200);
      await request(app.getHttpServer()).get('/api/users/usr_ventas').set('Authorization', `Bearer ${tecToken}`).expect(403);
    });

    it('keeps pedidos internos for admin and ventas', async () => {
      await request(app.getHttpServer()).get('/api/pedidos-internos').set('Authorization', `Bearer ${tecToken}`).expect(403);
      const res = await request(app.getHttpServer())
        .get('/api/pedidos-internos/ped_seed_1')
        .set('Authorization', `Bearer ${ventasToken}`)
        .expect(200);
      expect(res.body.pedido.estado).toBe('solicitado');
      expect(res.body.pedido.transicionesValidas).toEqual(['aprobado', 'rechazado', 'cancelado']);
      expect(res.body.pedido.costoTotal).toBe(225);
      expect(res.body.detalles[0].costoTotal).toBe(225);
    });

    it('rejects a transition outside the flow', async () => {
      const res = await request(app.getHttpServer())
        .patch('/api/pedidos-internos/ped_seed_1/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ estado: 'entregado' })
        .expect(400);
      expect(res.body.message).toContain('solicitado → entregado');
    });
  });

  it('frozen sales jobs require admin', async () => {
    await request(app.getHttpServer())
      .post('/api/sales/sale_andina/jobs')
      .set('Authorization', `Bearer ${ventasToken}`)
      .send({ titulo: 'x' })
      .expect(403);
  });
});
