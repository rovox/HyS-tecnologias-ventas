import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../src/app.module';
import { ROLE_ACCOUNTS, credentialsFor } from '../../../config/users';

describe('hs-erp API (e2e)', () => {
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
      await request(app.getHttpServer()).get('/api/projects').set('Authorization', `Bearer ${tecToken}`).expect(403);
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

  describe('mandatory division (CAT-01)', () => {
    const auth = () => ({ Authorization: `Bearer ${ventasToken}` });
    const base = { titulo: 'E2E categoría', clienteId: 'cli_andina', sucursalId: 'suc_central', monto: 500 };

    it('lists the 3 divisions first', async () => {
      const res = await request(app.getHttpServer()).get('/api/categories').set(auth()).expect(200);
      expect(res.body.filter((c: { principal: boolean }) => c.principal).map((c: { id: string }) => c.id)).toEqual([
        'computo_comunicacion',
        'seguridad_electronica',
        'cableado_estructurado',
      ]);
    });

    it('rejects a quotation without a division or with a subcategory chip', async () => {
      await request(app.getHttpServer()).post('/api/quotations').set(auth()).send(base).expect(400);
      const chip = await request(app.getHttpServer()).post('/api/categories').set(auth()).send({ label: `Chip ${Date.now()}` }).expect(201);
      const res = await request(app.getHttpServer()).post('/api/quotations').set(auth()).send({ ...base, categoriaId: chip.body.id }).expect(400);
      expect(res.body.message).toMatch(/principales/);
    });

    it('rejects a job without a division and keeps the divisions fixed', async () => {
      const job = { clienteId: 'cli_andina', sucursalId: 'suc_central', descripcionTrabajo: 'E2E', fechaProgramada: '2026-11-02' };
      await request(app.getHttpServer()).post('/api/schedules').set(auth()).send(job).expect(400);
      const ok = await request(app.getHttpServer()).post('/api/schedules').set(auth()).send({ ...job, categoriaId: 'computo_comunicacion' }).expect(201);
      expect(ok.body.categoriaId).toBe('computo_comunicacion');
      await request(app.getHttpServer()).patch('/api/categories/seguridad_electronica').set(auth()).send({ active: false }).expect(400);
    });
  });

  describe('quotation states, expiry, delete and restore (QUO-02)', () => {
    const auth = () => ({ Authorization: `Bearer ${ventasToken}` });
    const http = () => request(app.getHttpServer());
    const create = async (extra: object = {}) =>
      (await http().post('/api/quotations').set(auth())
        .send({ titulo: `E2E QUO-02 ${Date.now()}`, categoriaId: 'computo_comunicacion', clienteId: 'cli_mall', sucursalId: 'suc_central', monto: 800, ...extra })
        .expect(201)).body;
    const attachPdf = (id: string) => http().post(`/api/quotations/${id}/files`).set(auth()).attach('file', Buffer.from('%PDF-1.4 e2e'), 'c.pdf').expect(201);
    const ids = async (vista: string) => (await http().get('/api/quotations').query({ vista }).set(auth()).expect(200)).body.map((q: { id: string }) => q.id);

    it('needs an amount above 0', async () => {
      await http().post('/api/quotations').set(auth()).send({ titulo: 'x', categoriaId: 'computo_comunicacion', sucursalId: 'suc_central', monto: 0 }).expect(400);
      await http().post('/api/quotations').set(auth()).send({ titulo: 'x', categoriaId: 'computo_comunicacion', sucursalId: 'suc_central' }).expect(400);
    });

    it('returns the allowed transitions and asks a reason to reject', async () => {
      const q = await create();
      expect(q.transicionesValidas).toEqual(['enviado']);
      await attachPdf(q.id);
      const sent = await http().post(`/api/quotations/${q.id}/status`).set(auth()).send({ estado: 'enviado' }).expect(201);
      expect(sent.body.transicionesValidas).toEqual(['aprobado', 'rechazado', 'borrador']);
      expect(sent.body.venceEl).toBeTruthy();
      await http().post(`/api/quotations/${q.id}/status`).set(auth()).send({ estado: 'rechazado' }).expect(400);
      const rejected = await http().post(`/api/quotations/${q.id}/status`).set(auth()).send({ estado: 'rechazado', motivoRechazo: 'Precio' }).expect(201);
      expect(rejected.body.motivoRechazo).toBe('Precio');
      expect(await ids('cerradas')).toContain(q.id);
      expect(await ids('abiertas')).not.toContain(q.id);
      const reopened = await http().post(`/api/quotations/${q.id}/status`).set(auth()).send({ estado: 'borrador' }).expect(201);
      expect(reopened.body.motivoRechazo).toBeNull();
    });

    it('expires a quotation sent more than 15 days ago', async () => {
      const q = await create();
      await attachPdf(q.id);
      const old = new Date(Date.now() - 20 * 24 * 3600 * 1000).toISOString();
      await http().post(`/api/quotations/${q.id}/status`).set(auth()).send({ estado: 'enviado', fechaEnvio: old }).expect(201);
      expect(await ids('cerradas')).toContain(q.id);
      const row = (await http().get(`/api/quotations/${q.id}`).set(auth()).expect(200)).body;
      expect(row.estado).toBe('vencido');
      expect(row.transicionesValidas).toEqual(['aprobado', 'borrador']);
    });

    it('deletes with a reason (kept in cerradas, read-only) and restores', async () => {
      const q = await create();
      await http().post(`/api/quotations/${q.id}/eliminar`).set(auth()).send({}).expect(400);
      const del = await http().post(`/api/quotations/${q.id}/eliminar`).set(auth()).send({ motivo: 'Duplicada' }).expect(201);
      expect(del.body.eliminadaAt).toBeTruthy();
      expect(del.body.motivoEliminacion).toBe('Duplicada');
      expect(del.body.transicionesValidas).toEqual([]);
      expect(await ids('abiertas')).not.toContain(q.id);
      expect(await ids('cerradas')).toContain(q.id);
      await http().patch(`/api/quotations/${q.id}`).set(auth()).send({ titulo: 'No' }).expect(400);
      await http().post(`/api/quotations/${q.id}/restaurar`).set(auth()).expect(201);
      expect(await ids('abiertas')).toContain(q.id);
    });

    it('keeps an approved quotation final: no delete, no reject, fixed amount', async () => {
      const q = await create();
      await attachPdf(q.id);
      await http().post(`/api/quotations/${q.id}/status`).set(auth()).send({ estado: 'enviado' }).expect(201);
      const ok = await http().post(`/api/quotations/${q.id}/status`).set(auth()).send({ estado: 'aprobado' }).expect(201);
      expect(ok.body.proyectoId).toBeTruthy();
      expect(ok.body.puedeEliminar).toBe(false);
      await http().post(`/api/quotations/${q.id}/eliminar`).set(auth()).send({ motivo: 'x' }).expect(400);
      await http().post(`/api/quotations/${q.id}/status`).set(auth()).send({ estado: 'rechazado', motivoRechazo: 'x' }).expect(400);
      await http().patch(`/api/quotations/${q.id}`).set(auth()).send({ monto: 900 }).expect(400);
      await http().patch(`/api/quotations/${q.id}`).set(auth()).send({ titulo: 'Título nuevo' }).expect(200);
    });
  });

  describe('minimal tasks and conversion to a quotation (TSK-01)', () => {
    const auth = () => ({ Authorization: `Bearer ${ventasToken}` });
    const http = () => request(app.getHttpServer());

    it('counts my pending tasks and validates the state', async () => {
      const before = (await http().get('/api/tasks/resumen').set(auth()).expect(200)).body;
      const task = (await http().post('/api/tasks').set(auth()).send({ titulo: 'Llamar a la clínica', clienteId: 'cli_hospital', plazo: '2020-01-01' }).expect(201)).body;
      expect(task.cliente).toEqual({ id: 'cli_hospital', nombre: 'Clínica Horizonte' });
      const after = (await http().get('/api/tasks/resumen').set(auth()).expect(200)).body;
      expect(after.mias).toBe(before.mias + 1);
      expect(after.vencidas).toBe(before.vencidas + 1);
      await http().patch(`/api/tasks/${task.id}`).set(auth()).send({ estado: 'hecha' }).expect(400);
      await http().post('/api/tasks').set(auth()).send({ titulo: 'x', clienteId: 'no-existe' }).expect(400);
    });

    it('converts a pending task into a quotation once', async () => {
      const task = (await http().post('/api/tasks').set(auth()).send({ titulo: 'Cotizar CCTV', clienteId: 'cli_mall' }).expect(201)).body;
      const quote = { titulo: 'CCTV desde tarea', categoriaId: 'seguridad_electronica', clienteId: 'cli_mall', sucursalId: 'suc_central', monto: 1200, tareaId: task.id };
      const created = (await http().post('/api/quotations').set(auth()).send(quote).expect(201)).body;
      const linked = (await http().get(`/api/tasks/${task.id}`).set(auth()).expect(200)).body;
      expect(linked.estado).toBe('completada');
      expect(linked.quotation.id).toBe(created.id);
      const again = await http().post('/api/quotations').set(auth()).send(quote).expect(400);
      expect(again.body.message).toMatch(/ya tiene una cotización/);
    });
  });

  describe('projects from approved quotations (PRO-01)', () => {
    const ventas = () => ({ Authorization: `Bearer ${ventasToken}` });
    const admin = () => ({ Authorization: `Bearer ${adminToken}` });
    const http = () => request(app.getHttpServer());
    let projectId = '';

    beforeAll(async () => {
      const q = (await http().post('/api/quotations').set(ventas())
        .send({ titulo: `E2E PRO-01 ${Date.now()}`, categoriaId: 'cableado_estructurado', clienteId: 'cli_hospital', sucursalId: 'suc_central', monto: 3000 })
        .expect(201)).body;
      await http().post(`/api/quotations/${q.id}/files`).set(ventas()).attach('file', Buffer.from('%PDF-1.4 e2e'), 'c.pdf').expect(201);
      await http().post(`/api/quotations/${q.id}/status`).set(ventas()).send({ estado: 'enviado' }).expect(201);
      projectId = (await http().post(`/api/quotations/${q.id}/status`).set(ventas()).send({ estado: 'aprobado' }).expect(201)).body.proyectoId;
    });

    it('approving creates one planned project with the quotation amount and its first job', async () => {
      const p = (await http().get(`/api/projects/${projectId}`).set(ventas()).expect(200)).body;
      expect(p.codigo).toMatch(/^PRY-/);
      expect(p).toMatchObject({ estado: 'planificado', cobrado: 0, saldo: 3000, pctCobrado: 0, garantiaMeses: 12, garantiaVigente: false });
      expect(Number(p.montoOficial)).toBe(3000);
      expect(p.trabajos).toHaveLength(1);
      expect(p.transicionesValidas).toEqual(['en_ejecucion', 'anulado']);
      expect((await http().get('/api/projects').set(ventas()).expect(200)).body.some((r: { id: string }) => r.id === projectId)).toBe(true);
    });

    it('collects payments on the project and adds jobs to the cronograma', async () => {
      const paid = (await http().post(`/api/projects/${projectId}/cobros`).set(ventas()).send({ tipo: 'adelanto', monto: 1000, metodo: 'efectivo' }).expect(201)).body;
      expect(paid).toMatchObject({ cobrado: 1000, saldo: 2000, pctCobrado: 33 });
      expect(paid.cobros).toHaveLength(1);
      const withJob = (await http().post(`/api/projects/${projectId}/trabajos`).set(ventas()).send({ descripcionTrabajo: 'Certificación Fluke', fechaProgramada: '2026-11-10' }).expect(201)).body;
      expect(withJob.trabajos).toHaveLength(2);
      const jobs = (await http().get('/api/schedules').set(ventas()).expect(200)).body.filter((s: { projectId: string }) => s.projectId === projectId);
      expect(jobs).toHaveLength(2);
      expect(jobs.every((s: { categoriaId: string }) => s.categoriaId === 'cableado_estructurado')).toBe(true);
    });

    it('delivers (warranty starts) and closes only without debt', async () => {
      await http().post(`/api/projects/${projectId}/estado`).set(ventas()).send({ estado: 'en_ejecucion' }).expect(201);
      const delivered = (await http().post(`/api/projects/${projectId}/estado`).set(ventas()).send({ estado: 'entregado' }).expect(201)).body;
      expect(delivered.garantiaVigente).toBe(true);
      expect(delivered.garantiaHasta).toBeTruthy();
      const blocked = await http().post(`/api/projects/${projectId}/estado`).set(ventas()).send({ estado: 'cerrado' }).expect(400);
      expect(blocked.body.message).toMatch(/saldo pendiente/);
      await http().post(`/api/projects/${projectId}/cobros`).set(ventas()).send({ tipo: 'cobro', monto: 2000 }).expect(201);
      const closed = (await http().post(`/api/projects/${projectId}/estado`).set(ventas()).send({ estado: 'cerrado' }).expect(201)).body;
      expect(closed).toMatchObject({ estado: 'cerrado', saldo: 0, transicionesValidas: [] });
    });

    it('is cancelled only by Gerencia with a reason, cancelling its open jobs', async () => {
      const q = (await http().post('/api/quotations').set(ventas())
        .send({ titulo: `E2E anular ${Date.now()}`, categoriaId: 'seguridad_electronica', clienteId: 'cli_mall', sucursalId: 'suc_central', monto: 500 })
        .expect(201)).body;
      await http().post(`/api/quotations/${q.id}/files`).set(ventas()).attach('file', Buffer.from('%PDF-1.4 e2e'), 'c.pdf').expect(201);
      await http().post(`/api/quotations/${q.id}/status`).set(ventas()).send({ estado: 'enviado' }).expect(201);
      const id = (await http().post(`/api/quotations/${q.id}/status`).set(ventas()).send({ estado: 'aprobado' }).expect(201)).body.proyectoId;
      await http().post(`/api/projects/${id}/estado`).set(ventas()).send({ estado: 'anulado', motivo: 'x' }).expect(400);
      await http().post(`/api/projects/${id}/estado`).set(admin()).send({ estado: 'anulado' }).expect(400);
      const cancelled = (await http().post(`/api/projects/${id}/estado`).set(admin()).send({ estado: 'anulado', motivo: 'Cliente desistió' }).expect(201)).body;
      expect(cancelled).toMatchObject({ estado: 'anulado', saldo: 0, motivoAnulacion: 'Cliente desistió' });
      expect(cancelled.trabajos.every((t: { estado: string }) => t.estado === 'cancelado')).toBe(true);
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
        .send({ titulo: `E2E proyecto ${Date.now()}`, categoriaId: 'cableado_estructurado', clienteId: 'cli_andina', sucursalId: 'suc_central', monto: 1000 })
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
      const res = await request(app.getHttpServer()).post(`/api/quotations/${quoteId}/status`).set(auth()).send({ estado: 'aprobado' }).expect(201);
      expect(res.body.estado).toBe('aprobado');
      const again = await request(app.getHttpServer()).post(`/api/quotations/${quoteId}/accept`).set(auth()).send({}).expect(201);
      expect(again.body.alreadyConverted).toBe(true);
      const list = await request(app.getHttpServer()).get('/api/schedules').query({ quotationId: quoteId }).set(auth()).expect(200);
      expect(list.body).toHaveLength(1);
      expect(Number(list.body[0].monto)).toBe(1000);
      expect(Number(list.body[0].saldo)).toBe(1000);
      expect(again.body.schedule.id).toBe(list.body[0].id);
      expect(list.body[0].categoria).toEqual({ id: 'cableado_estructurado', label: 'Cableado estructurado' });
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

    it('records who changed which field, with the value before (ARCH-01)', async () => {
      await request(app.getHttpServer()).patch(`/api/quotations/${quoteId}`).set(auth()).send({ titulo: 'Título auditado' }).expect(200);
      const log = await request(app.getHttpServer())
        .get('/api/activity')
        .query({ action: 'quotation.update' })
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);
      const row = log.body.find((r: { entityId: string }) => r.entityId === quoteId);
      expect(row.detalle.titulo).toEqual({ antes: expect.any(String), despues: 'Título auditado' });
      expect(row.user.id).toBeTruthy();
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
