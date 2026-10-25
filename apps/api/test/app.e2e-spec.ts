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

  it('Contabilidad reads every module, validates money and adjusts stock, but does not sell (AUTH-01)', async () => {
    const http = () => request(app.getHttpServer());
    const conta = (await http().post('/api/auth/login').send(credentialsFor(ROLE_ACCOUNTS.contabilidad)).expect(201)).body.accessToken;
    const as = { Authorization: `Bearer ${conta}` };
    for (const path of ['/api/projects', '/api/quotations', '/api/pedidos-internos', '/api/finance/movements', '/api/finance/cajas', '/api/inventory/products', '/api/schedules', '/api/users/directory', '/api/activity']) {
      await http().get(path).set(as).expect(200);
    }
    await http().post('/api/quotations').set(as).send({ titulo: 'No vende', categoriaId: 'seguridad_electronica', clienteId: 'cli_andina', sucursalId: 'suc_central', monto: 100 }).expect(403);
    await http().post('/api/pedidos-internos').set(as).send({ sucursalOrigenId: 'suc_central', sucursalDestinoId: 'suc_punata', items: [{ materialNombre: 'x', cantidad: 1 }] }).expect(403);
    const gasto = (await http().post('/api/finance/movements').set({ Authorization: `Bearer ${ventasToken}` }).send({ tipo: 'egreso', concepto: 'viaticos', monto: 25, pagadoPor: 'empresa', nota: 'Viáticos Punata' }).expect(201)).body;
    const ok = (await http().post(`/api/finance/movements/${gasto.id}/validar`).set(as).send({ cajaId: 'caja_central' }).expect(201)).body;
    expect(ok.estado).toBe('validado');
    await http().post('/api/inventory/movements').set(as).send({ productoId: 'prd_dvr_8', tipo: 'ajuste', cantidad: 1, sucursalDestinoId: 'suc_central', motivo: 'Sobrante en conteo' }).expect(201);
    await http().post('/api/inventory/movements').set(as).send({ productoId: 'prd_dvr_8', tipo: 'entrada', cantidad: 1, costoUnitario: 1, sucursalDestinoId: 'suc_central' }).expect(403);
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
      const paid = (await http().post(`/api/projects/${projectId}/cobros`).set(ventas()).send({ concepto: 'adelanto', monto: 1000, metodo: 'efectivo' }).expect(201)).body;
      expect(paid).toMatchObject({ cobrado: 1000, saldo: 2000, pctCobrado: 33 });
      expect(paid.cobros).toHaveLength(1);
      const withJob = (await http().post(`/api/projects/${projectId}/trabajos`).set(ventas()).send({ descripcionTrabajo: 'Certificación Fluke', fechaProgramada: '2026-11-10' }).expect(201)).body;
      expect(withJob.trabajos).toHaveLength(2);
      const jobs = (await http().get('/api/schedules').set(ventas()).expect(200)).body.filter((s: { projectId: string }) => s.projectId === projectId);
      expect(jobs).toHaveLength(2);
      expect(jobs.every((s: { categoriaId: string }) => s.categoriaId === 'cableado_estructurado')).toBe(true);
    });

    it('delivers only with its jobs done (warranty starts) and closes only without debt', async () => {
      await http().post(`/api/projects/${projectId}/estado`).set(ventas()).send({ estado: 'en_ejecucion' }).expect(201);
      const pending = await http().post(`/api/projects/${projectId}/estado`).set(ventas()).send({ estado: 'entregado' }).expect(400);
      expect(pending.body.message).toMatch(/trabajos pendientes/);
      const { trabajos } = (await http().get(`/api/projects/${projectId}`).set(ventas()).expect(200)).body;
      for (const t of trabajos) {
        await http().patch(`/api/schedules/${t.id}`).set(ventas()).send({ estado: 'en_proceso' }).expect(200);
        await http().patch(`/api/schedules/${t.id}`).set(ventas()).send({ estado: 'terminado' }).expect(200);
      }
      const delivered = (await http().post(`/api/projects/${projectId}/estado`).set(ventas()).send({ estado: 'entregado' }).expect(201)).body;
      expect(delivered.garantiaVigente).toBe(true);
      expect(delivered.garantiaHasta).toBeTruthy();
      const blocked = await http().post(`/api/projects/${projectId}/estado`).set(ventas()).send({ estado: 'cerrado' }).expect(400);
      expect(blocked.body.message).toMatch(/saldo pendiente/);
      await http().post(`/api/projects/${projectId}/cobros`).set(ventas()).send({ concepto: 'cobro', monto: 2000 }).expect(201);
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

  describe('money ledger and rendición (FIN-01)', () => {
    const ventas = () => ({ Authorization: `Bearer ${ventasToken}` });
    const admin = () => ({ Authorization: `Bearer ${adminToken}` });
    let tecToken = '';
    let tecId = '';
    const tec = () => ({ Authorization: `Bearer ${tecToken}` });
    const http = () => request(app.getHttpServer());
    const box = async (id: string) => (await http().get('/api/finance/cajas').set(admin()).expect(200)).body.find((b: { id: string }) => b.id === id).saldo;

    beforeAll(async () => {
      const res = await http().post('/api/auth/login').send(credentialsFor(ROLE_ACCOUNTS.tecnico));
      tecToken = res.body.accessToken;
      tecId = res.body.user.id;
    });

    it('a stand-alone job owes its amount; payments wait for validation; a cancelled job owes nothing', async () => {
      const job = (await http().post('/api/schedules').set(ventas())
        .send({ categoriaId: 'seguridad_electronica', clienteId: 'cli_andina', sucursalId: 'suc_central', descripcionTrabajo: 'Asistencia E2E', fechaProgramada: '2026-11-03', monto: 1000, adelanto: 200, tecnicoId: tecId })
        .expect(201)).body;
      expect(Number(job.saldo)).toBe(800);
      await http().post(`/api/schedules/${job.id}/payments`).set(ventas()).send({ tipo: 'cobro', monto: 900 }).expect(400);
      const paid = (await http().post(`/api/schedules/${job.id}/payments`).set(tec()).send({ tipo: 'cobro', monto: 300 }).expect(201)).body;
      expect(Number(paid.saldo)).toBe(500);
      const history = (await http().get(`/api/schedules/${job.id}/payments`).set(ventas()).expect(200)).body;
      expect(history.map((p: { estado: string }) => p.estado)).toEqual(['por_validar', 'por_validar']);
      await http().patch(`/api/schedules/${job.id}`).set(ventas()).send({ estado: 'cancelado' }).expect(200);
      expect(Number((await http().get(`/api/schedules/${job.id}`).set(ventas()).expect(200)).body.saldo)).toBe(0);
    });

    it('validates into a box (Gerencia only); a validated movement is edited with history or annulled, never reversed (FIN-03)', async () => {
      const pending = (await http().get('/api/finance/movements').query({ estado: 'por_validar', tipo: 'ingreso' }).set(ventas()).expect(200)).body;
      const m = pending[0];
      expect(m.transicionesValidas).toEqual(['validado', 'observado', 'anulado']);
      expect(m.recibidoPor?.id).toBeTruthy();
      await http().post(`/api/finance/movements/${m.id}/validar`).set(ventas()).send({ cajaId: 'caja_central' }).expect(403);
      await http().post(`/api/finance/movements/${m.id}/validar`).set(admin()).send({}).expect(400);
      const impact = (await http().get(`/api/finance/movements/${m.id}/impacto`).query({ accion: 'validar', cajaId: 'caja_central' }).set(admin()).expect(200)).body;
      const before = await box('caja_central');
      expect(impact.efectos[0]).toMatchObject({ tipo: 'caja', caja: 'Caja central Cochabamba', antes: before });
      const ok = (await http().post(`/api/finance/movements/${m.id}/validar`).set(admin()).send({ cajaId: 'caja_central' }).expect(201)).body;
      expect(ok).toMatchObject({ estado: 'validado', caja: { id: 'caja_central' }, transicionesValidas: ['anulado'] });
      expect(await box('caja_central')).toBeCloseTo(before + Number(m.monto), 2);
      // Gerencia corrects a validated movement: another box and a note; the history keeps before/after.
      await http().patch(`/api/finance/movements/${m.id}`).set(ventas()).send({ nota: 'x' }).expect(403);
      const moved = (await http().patch(`/api/finance/movements/${m.id}`).set(admin()).send({ cajaId: 'caja_chica_punata', nota: 'Estaba en Punata' }).expect(200)).body;
      expect(moved).toMatchObject({ estado: 'validado', caja: { id: 'caja_chica_punata' } });
      expect(await box('caja_central')).toBeCloseTo(before, 2);
      const history = (await http().get(`/api/activity/movement/${m.id}`).set(admin()).expect(200)).body;
      expect(history.some((h: { action: string; detalle?: Record<string, unknown> }) => h.action === 'movement.update' && h.detalle?.cajaId)).toBe(true);
      // Annulling a validated one shows its effect first and takes it out of its box; there is no "revertir" anymore.
      const punata = await box('caja_chica_punata');
      const effect = (await http().get(`/api/finance/movements/${m.id}/impacto`).query({ accion: 'anular' }).set(admin()).expect(200)).body;
      expect(effect.efectos.find((e: { tipo: string }) => e.tipo === 'caja')).toMatchObject({ antes: punata, despues: punata - Number(m.monto) });
      await http().post(`/api/finance/movements/${m.id}/anular`).set(admin()).send({}).expect(400);
      await http().post(`/api/finance/movements/${m.id}/anular`).set(admin()).send({ motivo: 'Cobro duplicado' }).expect(201);
      expect(await box('caja_chica_punata')).toBeCloseTo(punata - Number(m.monto), 2);
      await http().post(`/api/finance/movements/${m.id}/revertir`).set(admin()).send({ motivo: 'x' }).expect(404);
      await http().patch(`/api/finance/movements/${m.id}`).set(admin()).send({ nota: 'y' }).expect(400);
    });

    it('records who received a payment and lists the money each person holds (por rendir)', async () => {
      const job = (await http().post('/api/schedules').set(ventas())
        .send({ clienteId: 'cli_andina', categoriaId: 'seguridad_electronica', descripcionTrabajo: 'Revisión de cámaras', fechaProgramada: '2026-11-03', sucursalId: 'suc_central', tecnicoId: tecId, monto: 400 })
        .expect(201)).body;
      await http().post(`/api/schedules/${job.id}/payments`).set(ventas()).send({ tipo: 'cobro', monto: 150, recibidoPorId: tecId }).expect(201);
      await http().post(`/api/schedules/${job.id}/payments`).set(tec()).send({ tipo: 'cobro', monto: 50, recibidoPorId: 'usr_ventas' }).expect(403);
      const custody = (await http().get('/api/finance/por-rendir').set(ventas()).expect(200)).body;
      const marcos = custody.find((c: { userId: string }) => c.userId === tecId);
      expect(marcos.persona.id).toBe(tecId);
      expect(marcos.movimientos.some((x: { scheduleId: string }) => x.scheduleId === job.id)).toBe(true);
      await http().get('/api/finance/por-rendir').set(tec()).expect(403);
    });

    it('an employee expense: observed, corrected, validated and refunded; the técnico sees only his movements', async () => {
      await http().post('/api/finance/movements').set(tec()).send({ tipo: 'egreso', concepto: 'combustible', monto: 80 }).expect(400);
      const e = (await http().post('/api/finance/movements').set(tec()).send({ tipo: 'egreso', concepto: 'combustible', monto: 80, pagadoPor: 'empleado', nota: 'Viaje E2E' }).expect(201)).body;
      expect(e).toMatchObject({ estado: 'por_validar', reembolsoPendiente: true });
      const mine = (await http().get('/api/finance/movements').set(tec()).expect(200)).body;
      expect(mine.every((r: { registradoPor: { id: string }; recibidoPor?: { id: string } }) => r.registradoPor.id === tecId || r.recibidoPor?.id === tecId)).toBe(true);
      await http().post(`/api/finance/movements/${e.id}/observar`).set(admin()).send({}).expect(400);
      await http().post(`/api/finance/movements/${e.id}/observar`).set(admin()).send({ motivo: 'Falta factura' }).expect(201);
      const fixed = (await http().patch(`/api/finance/movements/${e.id}`).set(tec()).send({ monto: 85, nota: 'Con factura' }).expect(200)).body;
      expect(fixed).toMatchObject({ estado: 'por_validar', motivo: null });
      await http().post(`/api/finance/movements/${e.id}/validar`).set(admin()).send({ cajaId: 'caja_central' }).expect(201);
      const refunded = (await http().post(`/api/finance/movements/${e.id}/reembolsar`).set(admin()).expect(201)).body;
      expect(refunded.reembolsoPendiente).toBe(false);
      await http().post(`/api/finance/movements`).set(tec()).send({ tipo: 'ingreso', concepto: 'otro', monto: 10 }).expect(403);
      await http().post(`/api/finance/movements`).set(ventas()).send({ tipo: 'ingreso', concepto: 'cobro', monto: 10 }).expect(400);
    });

    it('transfers between boxes are Gerencia only and move both balances', async () => {
      const body = { tipo: 'transferencia', concepto: 'deposito', monto: 50, cajaId: 'caja_central', cajaDestinoId: 'caja_chica_punata', sucursalId: 'suc_central' };
      await http().post('/api/finance/movements').set(ventas()).send(body).expect(403);
      const [central, punata] = [await box('caja_central'), await box('caja_chica_punata')];
      await http().post('/api/finance/movements').set(admin()).send(body).expect(201);
      expect(await box('caja_central')).toBeCloseTo(central - 50, 2);
      expect(await box('caja_chica_punata')).toBeCloseTo(punata + 50, 2);
    });

    it('project expenses are its cost; only Gerencia changes the official amount; a técnico pays only on his projects', async () => {
      const q = (await http().post('/api/quotations').set(ventas())
        .send({ titulo: `E2E FIN ${Date.now()}`, categoriaId: 'computo_comunicacion', clienteId: 'cli_mall', sucursalId: 'suc_central', monto: 2000 }).expect(201)).body;
      await http().post(`/api/quotations/${q.id}/files`).set(ventas()).attach('file', Buffer.from('%PDF-1.4 e2e'), 'c.pdf').expect(201);
      await http().post(`/api/quotations/${q.id}/status`).set(ventas()).send({ estado: 'enviado' }).expect(201);
      const id = (await http().post(`/api/quotations/${q.id}/status`).set(ventas()).send({ estado: 'aprobado' }).expect(201)).body.proyectoId;
      await http().post('/api/finance/movements').set(ventas()).send({ tipo: 'egreso', concepto: 'material', monto: 600, pagadoPor: 'empresa', projectId: id }).expect(201);
      const p = (await http().get(`/api/projects/${id}`).set(ventas()).expect(200)).body;
      expect(p).toMatchObject({ costo: 600, margen: 1400, saldo: 2000 });
      expect(p.gastos).toHaveLength(1);
      await http().patch(`/api/projects/${id}/monto`).set(ventas()).send({ montoOficial: 2500, motivo: 'Ampliación' }).expect(400);
      await http().patch(`/api/projects/${id}/monto`).set(admin()).send({ montoOficial: 2500 }).expect(400);
      const bigger = (await http().patch(`/api/projects/${id}/monto`).set(admin()).send({ montoOficial: 2500, motivo: 'Ampliación de puntos' }).expect(200)).body;
      expect(bigger).toMatchObject({ saldo: 2500, margen: 1900 });
      await http().post(`/api/projects/${id}/cobros`).set(tec()).send({ concepto: 'cobro', monto: 100 }).expect(403);
      const job = bigger.trabajos[0];
      await http().patch(`/api/schedules/${job.id}`).set(ventas()).send({ tecnicoId: tecId }).expect(200);
      const paid = (await http().post(`/api/projects/${id}/cobros`).set(tec()).send({ concepto: 'cobro', monto: 100 }).expect(201)).body;
      expect(paid).toMatchObject({ cobrado: 100, porValidar: 100, saldo: 2400 });
    });
  });

  describe('client read model (CLI-01)', () => {
    const ventas = () => ({ Authorization: `Bearer ${ventasToken}` });
    const http = () => request(app.getHttpServer());

    it('lists every client with what it owes and whether a service is in course (no Activo/Contratado tags)', async () => {
      const rows = (await http().get('/api/reporting/clients').set(ventas()).expect(200)).body;
      const hospital = rows.find((c: { id: string }) => c.id === 'cli_hospital');
      expect(hospital).toMatchObject({ servicioEnCurso: true });
      expect(hospital.saldoPendiente).toBeGreaterThan(0);
      expect(hospital).not.toHaveProperty('esActivo');
      const plain = (await http().get('/api/clients').set(ventas()).expect(200)).body[0];
      expect(plain).not.toHaveProperty('esClienteContratado');
    });

    it('builds the client page from projects (warranty), jobs, quotations, payments and visits', async () => {
      const c = (await http().get('/api/reporting/clients/cli_hospital').set(ventas()).expect(200)).body;
      expect(c.proyectos.length).toBeGreaterThan(0);
      expect(c.proyectos[0]).toHaveProperty('garantiaVigente');
      expect(c.proyectos[0]).toHaveProperty('saldo');
      expect(Array.isArray(c.trabajos)).toBe(true);
      expect(c.cotizaciones.length).toBeGreaterThan(0);
      expect(Array.isArray(c.cobros)).toBe(true);
      expect(Array.isArray(c.relevamientos)).toBe(true);
      const owed = [...c.proyectos, ...c.trabajos].reduce((sum: number, x: { saldo: number }) => sum + x.saldo, 0);
      expect(c.saldoPendiente).toBeCloseTo(owed, 2);
      await http().get('/api/reporting/clients/no-existe').set(ventas()).expect(404);
    });
  });

  describe('inventory and internal orders (INV-01)', () => {
    const ventas = () => ({ Authorization: `Bearer ${ventasToken}` });
    const admin = () => ({ Authorization: `Bearer ${adminToken}` });
    let tecToken = '';
    const http = () => request(app.getHttpServer());
    const stock = async (id: string) => (await http().get('/api/inventory/products').set(ventas()).expect(200)).body.find((p: { id: string }) => p.id === id);
    const deliver = async (id: string) => {
      for (const estado of ['aprobado', 'en_preparación', 'listo_para_entrega']) {
        await http().patch(`/api/pedidos-internos/${id}/status`).set(admin()).send({ estado }).expect(200);
      }
      return http().patch(`/api/pedidos-internos/${id}/status`).set(admin()).send({ estado: 'entregado' });
    };

    beforeAll(async () => {
      tecToken = (await http().post('/api/auth/login').send(credentialsFor(ROLE_ACCOUNTS.tecnico))).body.accessToken;
    });

    it('lists products with stock per branch; técnico reads but does not manage the catalog', async () => {
      const utp = await stock('prd_utp6');
      expect(utp.stock.suc_punata).toBeGreaterThanOrEqual(200);
      expect(utp).toHaveProperty('stockBajo');
      await http().get('/api/inventory/products').set({ Authorization: `Bearer ${tecToken}` }).expect(200);
      const body = { codigo: `E2E-${Date.now()}`, nombre: 'Producto E2E', categoriaId: 'computo_comunicacion', tipo: 'equipo', costo: 100 };
      await http().post('/api/inventory/products').set({ Authorization: `Bearer ${tecToken}` }).send(body).expect(403);
      await http().post('/api/inventory/products').set(ventas()).send(body).expect(201);
      await http().post('/api/inventory/products').set(ventas()).send(body).expect(409);
    });

    it('moves stock: purchase (updates cost), transfer, never below zero, adjustments only by Gerencia', async () => {
      const before = await stock('prd_dvr_8');
      await http().post('/api/inventory/movements').set(ventas()).send({ productoId: 'prd_dvr_8', tipo: 'entrada', cantidad: 3, costoUnitario: 950, sucursalDestinoId: 'suc_central' }).expect(201);
      const bought = await stock('prd_dvr_8');
      expect(bought.stock.suc_central).toBe((before.stock.suc_central || 0) + 3);
      expect(Number(bought.costo)).toBe(950);
      await http().post('/api/inventory/movements').set(ventas()).send({ productoId: 'prd_dvr_8', tipo: 'transferencia', cantidad: 1, sucursalOrigenId: 'suc_central', sucursalDestinoId: 'suc_quillacollo' }).expect(201);
      const too = await http().post('/api/inventory/movements').set(ventas()).send({ productoId: 'prd_dvr_8', tipo: 'transferencia', cantidad: 999, sucursalOrigenId: 'suc_central', sucursalDestinoId: 'suc_punata' }).expect(400);
      expect(too.body.message).toMatch(/Stock insuficiente/);
      await http().post('/api/inventory/movements').set(ventas()).send({ productoId: 'prd_dvr_8', tipo: 'ajuste', cantidad: 1, sucursalOrigenId: 'suc_quillacollo', motivo: 'Dañado' }).expect(403);
      await http().post('/api/inventory/movements').set(admin()).send({ productoId: 'prd_dvr_8', tipo: 'ajuste', cantidad: 1, sucursalOrigenId: 'suc_quillacollo', motivo: 'Dañado en traslado' }).expect(201);
      expect((await stock('prd_dvr_8')).stock.suc_quillacollo).toBe((before.stock.suc_quillacollo || 0));
    });

    it('a delivered order for a project job takes stock out to the project (material cost, client equipment)', async () => {
      const q = (await http().post('/api/quotations').set(ventas())
        .send({ titulo: `E2E INV ${Date.now()}`, categoriaId: 'seguridad_electronica', clienteId: 'cli_mall', sucursalId: 'suc_central', monto: 3000 }).expect(201)).body;
      await http().post(`/api/quotations/${q.id}/files`).set(ventas()).attach('file', Buffer.from('%PDF-1.4 e2e'), 'c.pdf').expect(201);
      await http().post(`/api/quotations/${q.id}/status`).set(ventas()).send({ estado: 'enviado' }).expect(201);
      const projectId = (await http().post(`/api/quotations/${q.id}/status`).set(ventas()).send({ estado: 'aprobado' }).expect(201)).body.proyectoId;
      const job = (await http().get(`/api/projects/${projectId}`).set(ventas()).expect(200)).body.trabajos[0];
      const before = (await stock('prd_cam_ip')).stock.suc_central;
      const pedido = (await http().post('/api/pedidos-internos').set(ventas())
        .send({ sucursalOrigenId: 'suc_central', cronogramaId: job.id, items: [{ productoId: 'prd_cam_ip', materialNombre: 'Cámara IP 4MP domo', cantidad: 2 }, { materialNombre: 'Tornillos', cantidad: 10 }] })
        .expect(201)).body;
      await deliver(pedido.id).then((r) => expect(r.status).toBe(200));
      expect((await stock('prd_cam_ip')).stock.suc_central).toBe(before - 2);
      const project = (await http().get(`/api/projects/${projectId}`).set(ventas()).expect(200)).body;
      expect(project.costoMaterial).toBe(900);
      expect(project.material).toHaveLength(1);
      const client = (await http().get('/api/reporting/clients/cli_mall').set(ventas()).expect(200)).body;
      expect(client.equipos.some((e: { proyecto: { id: string } }) => e.proyecto?.id === projectId)).toBe(true);
      await http().delete(`/api/pedidos-internos/${pedido.id}`).set(ventas()).expect(400);
    });

    it('a delivered branch order moves stock between branches; without stock the delivery is refused', async () => {
      // Its own product, so the test does not depend on seed products someone archived or moved by hand.
      const cable = (await http().post('/api/inventory/products').set(ventas())
        .send({ codigo: `E2E-UTP-${Date.now()}`, nombre: 'Cable UTP Cat6 e2e', categoriaId: 'cableado_estructurado', tipo: 'material', unidad: 'm', costo: 3 }).expect(201)).body;
      await http().post('/api/inventory/movements').set(ventas()).send({ productoId: cable.id, tipo: 'entrada', cantidad: 80, costoUnitario: 3, sucursalDestinoId: 'suc_central' }).expect(201);
      const ok = (await http().post('/api/pedidos-internos').set(ventas())
        .send({ sucursalOrigenId: 'suc_central', sucursalDestinoId: 'suc_punata', items: [{ productoId: cable.id, materialNombre: cable.nombre, cantidad: 50 }] }).expect(201)).body;
      await deliver(ok.id).then((r) => expect(r.status).toBe(200));
      const after = await stock(cable.id);
      expect(after.stock.suc_central).toBe(30);
      expect(after.stock.suc_punata).toBe(50);
      const big = (await http().post('/api/pedidos-internos').set(ventas())
        .send({ sucursalOrigenId: 'suc_quillacollo', sucursalDestinoId: 'suc_central', items: [{ productoId: 'prd_sw24', materialNombre: 'Switch', cantidad: 5 }] }).expect(201)).body;
      const refused = await deliver(big.id);
      expect(refused.status).toBe(400);
      expect(refused.body.message).toMatch(/Switch 24 puertos PoE: Stock insuficiente/);
      const still = (await http().get(`/api/pedidos-internos/${big.id}`).set(ventas()).expect(200)).body;
      expect(still.pedido.estado).toBe('listo_para_entrega');
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
      expect(Number(list.body[0].monto)).toBe(0); // the money lives in the project (FIN-01)
      expect(list.body[0].projectId).toBeTruthy();
      expect(again.body.schedule.id).toBe(list.body[0].id);
      expect(list.body[0].categoria).toEqual({ id: 'cableado_estructurado', label: 'Cableado estructurado' });
      scheduleId = list.body[0].id;
    });

    it('books a payment taken on a project job in the project ledger (FIN-01)', async () => {
      const pay = (body: object, status = 201) =>
        request(app.getHttpServer()).post(`/api/schedules/${scheduleId}/payments`).set(auth()).send(body).expect(status);
      const job = (await pay({ tipo: 'adelanto', monto: 400 })).body;
      expect(Number(job.saldo)).toBe(0); // a project job owes nothing itself
      const project = (await request(app.getHttpServer()).get(`/api/projects/${job.projectId}`).set(auth()).expect(200)).body;
      expect(project).toMatchObject({ cobrado: 400, porValidar: 400, saldo: 600 });
      const over = await pay({ tipo: 'cobro', monto: 700 }, 400);
      expect(over.body.message).toContain('supera el saldo pendiente (600)');
      await pay({ tipo: 'extra_asistencia', monto: 50, nota: 'Material extra' });
      await pay({ tipo: 'descuento', monto: 600 }, 400);
      const after = (await request(app.getHttpServer()).get(`/api/projects/${job.projectId}`).set(auth()).expect(200)).body;
      expect(after).toMatchObject({ cobrado: 400, adicionales: 50, saldo: 600 });
      expect(after.cobros).toHaveLength(2);
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
      expect(res.body.message).toContain('El monto es del proyecto');
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
