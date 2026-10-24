import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { USERS, passwordFor } from '../../../config/users';
import { DIVISIONS } from '../src/modules/categories/domain/categories.rules';

const prisma = new PrismaClient();

const BRANCHES = [
  { id: 'suc_central', nombre: 'Central' },
  { id: 'suc_punata', nombre: 'Punata' },
  { id: 'suc_quillacollo', nombre: 'Quillacollo' },
];

async function main() {
  const now = new Date();
  const mes = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));

  for (const row of BRANCHES) {
    await prisma.sucursal.upsert({
      where: { id: row.id },
      update: { nombre: row.nombre },
      create: row,
    });
  }

  // Cash boxes (FIN-01): central box in Cochabamba, petty cash per branch.
  for (const b of BRANCHES) {
    const central = b.id === 'suc_central';
    const id = central ? 'caja_central' : `caja_chica_${b.id.replace('suc_', '')}`;
    const box = { nombre: central ? 'Caja central Cochabamba' : `Caja chica ${b.nombre}`, tipo: central ? 'caja' : 'caja_chica', sucursalId: b.id };
    await prisma.cashBox.upsert({ where: { id }, update: box, create: { id, ...box } });
  }
  const boxOf = (sucursalId: string) => (sucursalId === 'suc_central' ? 'caja_central' : `caja_chica_${sucursalId.replace('suc_', '')}`);

  for (const row of USERS) {
    const passwordHash = await bcrypt.hash(passwordFor(row.email), 10);
    const { id, localOnly: _localOnly, ...rest } = row;
    await prisma.user.upsert({
      where: { email: row.email },
      update: { ...rest, passwordHash, active: true },
      create: { id, ...rest, passwordHash, active: true },
    });
  }

  // The 3 divisions (CAT-01): every quotation, job, project and product has one.
  for (const row of DIVISIONS) {
    await prisma.quotationCategory.upsert({
      where: { id: row.id },
      update: { label: row.label, sortOrder: row.sortOrder, active: true, principal: true },
      create: { ...row, active: true, principal: true },
    });
  }

  const clients = [
    { id: 'cli_andina', nombre: 'Comercial Andina SRL', tipo: 'Seguridad Electrónica', contacto: 'Patricia Nieto', direccion: 'Av. Arce 2450, La Paz', sucursalId: 'suc_central' },
    { id: 'cli_hospital', nombre: 'Clínica Horizonte', tipo: 'Proyectos', contacto: 'Dr. Iván Paz', direccion: 'Punata centro', sucursalId: 'suc_punata' },
    { id: 'cli_mall', nombre: 'Plaza Norte Retail', tipo: 'Equipos y tecnología', contacto: 'Carla Benítez', direccion: 'Av. Juan Pablo II, El Alto', sucursalId: 'suc_quillacollo' },
  ];
  for (const row of clients) {
    await prisma.client.upsert({
      where: { id: row.id },
      update: row,
      create: row,
    });
  }

  await prisma.quotation.upsert({
    where: { numero: 'COT-080426' },
    update: { estado: 'aprobado', sucursalId: 'suc_central', sucursalNombre: 'Central' },
    create: {
      id: 'quo_andina',
      numero: 'COT-080426',
      titulo: 'CCTV 16 canales — Comercial Andina',
      categoriaId: 'seguridad_electronica',
      subcategoria: 'Instalaciones',
      sucursalId: 'suc_central',
      sucursalNombre: 'Central',
      clienteId: 'cli_andina',
      estado: 'aprobado',
      monto: 18500,
      vendedorId: 'usr_ventas',
      sellers: { create: [{ userId: 'usr_ventas', nombre: 'Dennis', commissionPct: 100 }] },
      sale: {
        create: {
          id: 'sale_andina',
          total: 18500,
          jobs: { create: [{ titulo: 'CCTV 16 canales — Comercial Andina', estado: 'programado', monto: 18500 }] },
        },
      },
    },
  });

  await prisma.schedule.upsert({
    where: { id: 'sch_andina' },
    update: {
      tecnicoId: 'usr_tecnico',
      estado: 'en_proceso',
      monto: 18500,
      adelanto: 5000,
      saldo: 13500,
      horario: '09:00–12:00',
    },
    create: {
      id: 'sch_andina',
      categoriaId: 'seguridad_electronica',
      clienteId: 'cli_andina',
      lugar: 'Av. Arce 2450, La Paz',
      descripcionTrabajo: 'Instalación CCTV 16 canales según COT-080426',
      monto: 18500,
      adelanto: 5000,
      saldo: 13500,
      fechaProgramada: new Date('2026-08-20T09:00:00'),
      horario: '09:00–12:00',
      estado: 'en_proceso',
      sucursalId: 'suc_central',
      vendedorId: 'usr_ventas',
      tecnicoId: 'usr_tecnico',
      quotationId: 'quo_andina',
      observaciones: 'Seed: desde cotización aceptada',
    },
  });

  await prisma.schedule.upsert({
    where: { id: 'sch_mall' },
    update: { estado: 'programado', tecnicoId: 'usr_tecnico' },
    create: {
      id: 'sch_mall',
      categoriaId: 'seguridad_electronica',
      clienteId: 'cli_mall',
      lugar: 'Av. Juan Pablo II, El Alto',
      descripcionTrabajo: 'Mantenimiento DVR y recambio de 4 cámaras',
      monto: 4200,
      adelanto: 0,
      saldo: 4200,
      fechaProgramada: new Date('2026-08-21T14:00:00'),
      horario: '14:00–17:00',
      estado: 'programado',
      sucursalId: 'suc_quillacollo',
      vendedorId: 'usr_wilson',
      tecnicoId: 'usr_tecnico',
      observaciones: '',
    },
  });

  await prisma.task.upsert({
    where: { id: 'task_seed_1' },
    update: {},
    create: {
      id: 'task_seed_1',
      titulo: 'Confirmar materiales CCTV Andina',
      descripcion: 'Revisar stock antes de la instalación',
      sucursalId: 'suc_central',
      creadorId: 'usr_ventas',
      asignadoId: 'usr_tec',
      estado: 'pendiente',
      prioridad: 'alta',
      plazo: new Date('2026-08-22'),
      horario: '08:30',
      cotizacionId: 'quo_andina',
      scheduleId: 'sch_andina',
    },
  });

  const salesUsers = USERS.filter((row) => row.role === 'VENTAS / ADMINISTRACIÓN' || row.role === 'ADMINISTRADOR');
  for (const row of salesUsers) {
    await prisma.sellerGoal.upsert({
      where: { usuarioId_mes: { usuarioId: row.id, mes } },
      update: { metaMonto: row.monthlyGoalBs, metaCotiz: 8 },
      create: { usuarioId: row.id, mes, metaMonto: row.monthlyGoalBs, metaCotiz: 8 },
    });
  }

  // ── Cobertura de estados (ENV-04): cotizaciones, trabajos, cobros, visitas ──
  const day = 24 * 60 * 60 * 1000;
  const at = (offsetDays: number, hour = 9) => {
    const d = new Date(now.getTime() + offsetDays * day);
    d.setHours(hour, 0, 0, 0);
    return d;
  };

  const quoteBase = {
    categoriaId: 'seguridad_electronica',
    subcategoria: 'Instalaciones',
    sucursalId: 'suc_central',
    sucursalNombre: 'Central',
    vendedorId: 'usr_ventas',
  };
  const quotes = [
    { id: 'quo_borrador', numero: 'COT-SEED-001', titulo: 'Alarma perimetral — borrador', clienteId: 'cli_andina', estado: 'borrador', monto: 6200 },
    { id: 'quo_enviado', numero: 'COT-SEED-002', titulo: 'Control de acceso biométrico — enviado', categoriaId: 'computo_comunicacion', subcategoria: 'Equipos', clienteId: 'cli_hospital', estado: 'enviado', monto: 9800, fechaEnvio: at(-3), archivoPdfUrl: 'seed/cotizacion-enviada.pdf' },
    { id: 'quo_rechazado', numero: 'COT-SEED-003', titulo: 'Cableado estructurado — rechazado', categoriaId: 'cableado_estructurado', subcategoria: 'Redes/Datos', clienteId: 'cli_mall', estado: 'rechazado', monto: 15400, motivoRechazo: 'Presupuesto fuera de rango (seed)' },
    { id: 'quo_aceptado_2', numero: 'COT-SEED-004', titulo: 'Cableado y cámaras IP en depósito — aprobado', categoriaId: 'cableado_estructurado', subcategoria: 'Redes/Datos', clienteId: 'cli_hospital', estado: 'aprobado', monto: 7300 },
    { id: 'quo_vencido', numero: 'COT-SEED-005', titulo: 'Red WiFi oficinas — vencida', categoriaId: 'computo_comunicacion', subcategoria: 'Redes', clienteId: 'cli_mall', estado: 'vencido', monto: 4300, fechaEnvio: at(-20), archivoPdfUrl: 'seed/cotizacion-vencida.pdf' },
    { id: 'quo_eliminado', numero: 'COT-SEED-006', titulo: 'Duplicado de alarma perimetral — eliminada', clienteId: 'cli_andina', estado: 'borrador', monto: 6200, eliminadaAt: at(-1), eliminadaPorId: 'usr_ventas', motivoEliminacion: 'Duplicada (seed)' },
  ];
  for (const q of quotes) {
    await prisma.quotation.upsert({
      where: { numero: q.numero },
      update: { estado: q.estado, eliminadaAt: q.eliminadaAt ?? null },
      create: {
        ...quoteBase,
        ...q,
        sellers: { create: [{ userId: 'usr_ventas', nombre: 'Dennis', commissionPct: 100 }] },
      },
    });
  }

  // Trabajos en todos los estados + cobros de cada tipo. adelanto/saldo coinciden con la suma de sus pagos.
  type SeedJob = {
    id: string;
    categoriaId: 'computo_comunicacion' | 'seguridad_electronica' | 'cableado_estructurado';
    clienteId: string;
    sucursalId: string;
    estado: 'programado' | 'en_proceso' | 'terminado' | 'cancelado';
    descripcionTrabajo: string;
    monto: number;
    day: number;
    quotationId?: string;
    payments: { id: string; tipo: 'adelanto' | 'cobro' | 'extra_asistencia'; monto: number; metodo: string }[];
  };
  const jobs: SeedJob[] = [
    { id: 'sch_terminado_pagado', categoriaId: 'seguridad_electronica', clienteId: 'cli_andina', sucursalId: 'suc_central', estado: 'terminado', descripcionTrabajo: 'Instalación DVR 8 canales (pagado completo)', monto: 3200, day: -10, payments: [
      { id: 'pay_tp_1', tipo: 'adelanto', monto: 1000, metodo: 'efectivo' },
      { id: 'pay_tp_2', tipo: 'cobro', monto: 2200, metodo: 'transferencia' },
    ] },
    { id: 'sch_terminado_deuda', categoriaId: 'seguridad_electronica', clienteId: 'cli_mall', sucursalId: 'suc_quillacollo', estado: 'terminado', descripcionTrabajo: 'Reubicación de cámaras (saldo pendiente)', monto: 2800, day: -6, payments: [
      { id: 'pay_td_1', tipo: 'adelanto', monto: 800, metodo: 'efectivo' },
    ] },
    { id: 'sch_terminado_extra', categoriaId: 'seguridad_electronica', clienteId: 'cli_hospital', sucursalId: 'suc_punata', estado: 'terminado', descripcionTrabajo: 'Asistencia técnica con visita adicional', monto: 1500, day: -4, payments: [
      { id: 'pay_te_1', tipo: 'cobro', monto: 1500, metodo: 'efectivo' },
      { id: 'pay_te_2', tipo: 'extra_asistencia', monto: 300, metodo: 'efectivo' },
    ] },
    { id: 'sch_cancelado', categoriaId: 'seguridad_electronica', clienteId: 'cli_andina', sucursalId: 'suc_central', estado: 'cancelado', descripcionTrabajo: 'Instalación cancelada por el cliente', monto: 2100, day: -2, payments: [
      { id: 'pay_ca_1', tipo: 'adelanto', monto: 500, metodo: 'efectivo' },
    ] },
    { id: 'sch_proyecto', categoriaId: 'cableado_estructurado', clienteId: 'cli_hospital', sucursalId: 'suc_punata', estado: 'programado', descripcionTrabajo: 'Proyecto cableado estructurado clínica', monto: 7300, day: 5, quotationId: 'quo_aceptado_2', payments: [
      { id: 'pay_pr_1', tipo: 'adelanto', monto: 2000, metodo: 'transferencia' },
    ] },
  ];
  for (const job of jobs) {
    const data = {
      categoriaId: job.categoriaId,
      clienteId: job.clienteId,
      lugar: 'Dirección demo',
      descripcionTrabajo: job.descripcionTrabajo,
      monto: job.monto,
      fechaProgramada: at(job.day),
      horario: '09:00–12:00',
      estado: job.estado,
      sucursalId: job.sucursalId,
      vendedorId: 'usr_ventas',
      tecnicoId: 'usr_tecnico',
      quotationId: job.quotationId ?? null,
      observaciones: 'Seed ENV-04',
      ...(job.estado === 'terminado' ? { fechaFinalizacion: at(job.day, 17) } : {}),
    };
    await prisma.schedule.upsert({ where: { id: job.id }, update: data, create: { id: job.id, ...data } });
    // Payments are validated incomes of the ledger, in the branch's box.
    for (const p of job.payments) {
      const row = {
        tipo: 'ingreso',
        concepto: p.tipo === 'extra_asistencia' ? 'adicional' : p.tipo,
        monto: p.monto,
        metodo: p.metodo,
        fecha: at(job.day),
        estado: 'validado',
        scheduleId: job.id,
        clienteId: job.clienteId,
        sucursalId: job.sucursalId,
        cajaId: boxOf(job.sucursalId),
        registradoPorId: 'usr_ventas',
        validadoPorId: 'usr_admin',
        validadoAt: at(job.day),
      };
      await prisma.cashMovement.upsert({ where: { id: p.id }, update: row, create: { id: p.id, ...row } });
    }
  }
  // Pago del trabajo sembrado originalmente (sch_andina: adelanto 5000).
  const andina = { tipo: 'ingreso', concepto: 'adelanto', monto: 5000, metodo: 'transferencia', estado: 'validado', scheduleId: 'sch_andina', clienteId: 'cli_andina', sucursalId: 'suc_central', cajaId: 'caja_central', registradoPorId: 'usr_ventas', validadoPorId: 'usr_admin', validadoAt: new Date() };
  await prisma.cashMovement.upsert({ where: { id: 'pay_an_1' }, update: andina, create: { id: 'pay_an_1', ...andina } });
  // Pending validation and an employee's expense, so the rendición inbox and refunds have rows.
  const pending = { tipo: 'ingreso', concepto: 'cobro', monto: 300, metodo: 'efectivo', estado: 'por_validar', scheduleId: 'sch_terminado_deuda', clienteId: 'cli_mall', sucursalId: 'suc_quillacollo', registradoPorId: 'usr_tecnico' };
  await prisma.cashMovement.upsert({ where: { id: 'mov_por_validar' }, update: pending, create: { id: 'mov_por_validar', ...pending } });
  const fuel = { tipo: 'egreso', concepto: 'combustible', monto: 120, metodo: 'efectivo', estado: 'por_validar', pagadoPor: 'empleado', sucursalId: 'suc_central', registradoPorId: 'usr_tecnico', nota: 'Viaje a Punata' };
  await prisma.cashMovement.upsert({ where: { id: 'mov_combustible' }, update: fuel, create: { id: 'mov_combustible', ...fuel } });

  // Inventory (INV-01): a small catalog and its first purchases; stock is always computed from these movements.
  const products = [
    { id: 'prd_cam_ip', codigo: 'CAM-IP-4MP', nombre: 'Cámara IP 4MP domo', marca: 'Hikvision', categoriaId: 'seguridad_electronica', tipo: 'equipo', unidad: 'unidad', costo: 450, precio: 650, stockMinimo: 5 },
    { id: 'prd_dvr_8', codigo: 'DVR-8CH', nombre: 'DVR 8 canales', marca: 'Dahua', categoriaId: 'seguridad_electronica', tipo: 'equipo', unidad: 'unidad', costo: 900, precio: 1300, stockMinimo: 2 },
    { id: 'prd_utp6', codigo: 'UTP-CAT6', nombre: 'Cable UTP Cat6', marca: 'Nexxt', categoriaId: 'cableado_estructurado', tipo: 'material', unidad: 'metro', costo: 4.5, precio: 7, stockMinimo: 300 },
    { id: 'prd_sw24', codigo: 'SW-24P-POE', nombre: 'Switch 24 puertos PoE', marca: 'TP-Link', categoriaId: 'computo_comunicacion', tipo: 'equipo', unidad: 'unidad', costo: 1800, precio: 2500, stockMinimo: 1 },
    { id: 'prd_inst_punto', codigo: 'INST-PUNTO', nombre: 'Instalación por punto de red', marca: '', categoriaId: 'cableado_estructurado', tipo: 'servicio', unidad: 'punto', costo: 0, precio: 80, stockMinimo: 0 },
  ];
  for (const { id, ...row } of products) await prisma.product.upsert({ where: { id }, update: row, create: { id, ...row } });
  const purchases = [
    { id: 'stk_cam_central', productoId: 'prd_cam_ip', cantidad: 20, costoUnitario: 450, sucursalDestinoId: 'suc_central' },
    { id: 'stk_dvr_central', productoId: 'prd_dvr_8', cantidad: 4, costoUnitario: 900, sucursalDestinoId: 'suc_central' },
    { id: 'stk_utp_central', productoId: 'prd_utp6', cantidad: 1000, costoUnitario: 4.5, sucursalDestinoId: 'suc_central' },
    { id: 'stk_utp_punata', productoId: 'prd_utp6', cantidad: 200, costoUnitario: 4.5, sucursalDestinoId: 'suc_punata' },
    { id: 'stk_sw_central', productoId: 'prd_sw24', cantidad: 2, costoUnitario: 1800, sucursalDestinoId: 'suc_central' },
  ];
  for (const { id, ...row } of purchases) {
    const data = { ...row, tipo: 'entrada', registradoPorId: 'usr_admin', nota: 'Compra inicial (seed)' };
    await prisma.stockMovement.upsert({ where: { id }, update: data, create: { id, ...data } });
  }

  // Visitas/relevamientos en cada estado.
  const visitas = ['programado', 'en_camino', 'en_atencion', 'resuelto', 'pendiente', 'cancelado'];
  for (const [i, estado] of visitas.entries()) {
    const data = {
      usuarioId: 'usr_tecnico',
      clienteId: 'cli_andina',
      sucursalId: 'suc_central',
      fecha: at(i - 2),
      tipoVisita: 'relevamiento',
      estado,
      prioridad: 'media',
      vendedorId: 'usr_ventas',
      tecnicoId: 'usr_tecnico',
      lugar: 'Av. Arce 2450, La Paz',
      notas: `Seed ENV-04 (${estado})`,
      cotizacionId: 'quo_andina',
    };
    await prisma.relevamiento.upsert({ where: { id: `rel_seed_${estado}` }, update: data, create: { id: `rel_seed_${estado}`, ...data } });
  }

  // Pedidos internos en cada estado (el último sin cronograma).
  const pedidoEstados = ['solicitado', 'aprobado', 'en_preparación', 'entregado', 'cancelado'];
  for (const [i, estado] of pedidoEstados.entries()) {
    const id = `ped_seed_${i + 1}`;
    const data = {
      responsableId: 'usr_tecnico',
      sucursalOrigenId: 'suc_central',
      sucursalDestinoId: 'suc_central',
      cronogramaId: estado === 'cancelado' ? null : 'sch_andina',
      prioridad: ['Baja', 'Normal', 'Alta', 'Urgente', 'Normal'][i],
      estado,
      observaciones: `Seed ENV-04 (${estado})`,
      ...(estado === 'entregado' ? { fechaEntregaReal: at(-1), entregadoPorId: 'usr_admin' } : {}),
    };
    await prisma.pedidoInterno.upsert({ where: { id }, update: data, create: { id, ...data } });
    await prisma.pedidoInternoItem.upsert({
      where: { id: `${id}_item` },
      update: {},
      create: { id: `${id}_item`, pedidoId: id, productoId: 'prd_utp6', materialNombre: 'Cable UTP Cat6 (m)', cantidad: 50 + i * 10, unidad: 'metros', costoUnitario: 4.5 },
    });
  }

  // Projects (PRO-01): one per approved quotation, linked to its jobs. sch_andina is in progress; the rest is planned.
  const approved = await prisma.quotation.findMany({ where: { estado: 'aprobado', clienteId: { not: null } } });
  for (const q of approved) {
    const inProgress = await prisma.schedule.count({ where: { quotationId: q.id, estado: 'en_proceso' } });
    const project = await prisma.project.upsert({
      where: { quotationId: q.id },
      update: {},
      create: {
        codigo: q.numero.replace(/^COT-/, 'PRY-'),
        quotationId: q.id,
        clienteId: q.clienteId as string,
        categoriaId: q.categoriaId,
        sucursalId: q.sucursalId,
        titulo: q.titulo.slice(0, 300),
        montoOficial: q.monto,
        estado: inProgress ? 'en_ejecucion' : 'planificado',
        responsableId: q.vendedorId,
      },
    });
    await prisma.schedule.updateMany({ where: { quotationId: q.id }, data: { projectId: project.id, monto: 0, adelanto: 0, saldo: 0 } });
    const jobs = await prisma.schedule.findMany({ where: { projectId: project.id }, select: { id: true } });
    await prisma.cashMovement.updateMany({ where: { scheduleId: { in: jobs.map((j) => j.id) } }, data: { projectId: project.id } });
  }

  console.log('Seed OK — users from config/users.json (password: config/users.passwords.local.json, else lowercase first name)');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
