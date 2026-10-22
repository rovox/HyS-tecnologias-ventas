import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ROLE_ACCOUNTS, credentialsFor } from '../../../config/users';

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
      .send(credentialsFor(ROLE_ACCOUNTS.ventas));
    ventasToken = ventas.body?.accessToken || ventas.body?.token || '';

    const admin = await request(app.getHttpServer())
      .post('/api/auth/login')
      .send(credentialsFor(ROLE_ACCOUNTS.admin));
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
      telefono: `7${String(Date.now()).slice(-7)}`,
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
        .send(credentialsFor(ROLE_ACCOUNTS.tecnico));
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
        .send(credentialsFor(ROLE_ACCOUNTS.tecnico));
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
      const goals = await request(app.getHttpServer()).get('/api/goals').set('Authorization', `Bearer ${tecToken}`).expect(200);
      expect(goals.body).toEqual([]);
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

  describe('quotation → project → payments (MVP-6)', () => {
    const auth = () => ({ Authorization: `Bearer ${ventasToken}` });
    let quoteId = '';
    let scheduleId = '';

    beforeAll(async () => {
      const quote = await request(app.getHttpServer())
        .post('/api/quotations')
        .set(auth())
        .send({ titulo: `E2E proyecto ${Date.now()}`, clienteId: 'cli_andina', sucursalId: 'suc_central', monto: 1000 })
        .expect(201);
      quoteId = quote.body.id;
      await request(app.getHttpServer())
        .post(`/api/quotations/${quoteId}/files`)
        .set(auth())
        .attach('file', Buffer.from('%PDF-1.4 e2e'), 'cotizacion.pdf')
        .expect(201);
      await request(app.getHttpServer()).post(`/api/quotations/${quoteId}/status`).set(auth()).send({ estado: 'enviado' }).expect(201);
    });

    it('accepting through the status creates exactly one project with the quotation total', async () => {
      const res = await request(app.getHttpServer()).post(`/api/quotations/${quoteId}/status`).set(auth()).send({ estado: 'aceptado' }).expect(201);
      expect(res.body.estado).toBe('aceptado');
      const again = await request(app.getHttpServer()).post(`/api/quotations/${quoteId}/accept`).set(auth()).send({}).expect(201);
      expect(again.body.alreadyConverted).toBe(true);
      const list = await request(app.getHttpServer()).get('/api/schedules').query({ quotationId: quoteId }).set(auth()).expect(200);
      expect(list.body).toHaveLength(1);
      expect(Number(list.body[0].monto)).toBe(1000);
      expect(Number(list.body[0].saldo)).toBe(1000);
      expect(again.body.schedule.id).toBe(list.body[0].id);
      scheduleId = list.body[0].id;
    });

    it('keeps the balance in the API: cobros, adicional, overpayment and descuento', async () => {
      const pay = (body: object, status = 201) =>
        request(app.getHttpServer()).post(`/api/schedules/${scheduleId}/payments`).set(auth()).send(body).expect(status);
      expect(Number((await pay({ tipo: 'adelanto', monto: 400 })).body.saldo)).toBe(600);
      const over = await pay({ tipo: 'cobro', monto: 700 }, 400);
      expect(over.body.message).toContain('supera el saldo pendiente (600)');
      expect(Number((await pay({ tipo: 'extra_asistencia', monto: 50, nota: 'Material extra' })).body.saldo)).toBe(600);
      const last = await pay({ tipo: 'descuento', monto: 600, nota: 'Saldo perdonado' });
      expect(Number(last.body.saldo)).toBe(0);
      expect(Number(last.body.adelanto)).toBe(1000);
      expect(last.body.payments).toHaveLength(3);
    });

    it('does not change the official amount of a project', async () => {
      const res = await request(app.getHttpServer()).patch(`/api/schedules/${scheduleId}`).set(auth()).send({ monto: 1200 }).expect(400);
      expect(res.body.message).toContain('no se modifica');
    });

    it('keeps relevamientos away from users without access', async () => {
      const none = await request(app.getHttpServer()).post('/api/auth/login').send(credentialsFor('marcelo@hscontrol.com'));
      const token = none.body?.accessToken || '';
      await request(app.getHttpServer())
        .post('/api/relevamientos')
        .set('Authorization', `Bearer ${token}`)
        .send({ clienteId: 'cli_andina', fecha: '2026-11-01', lugar: 'Oficina' })
        .expect(403);
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
