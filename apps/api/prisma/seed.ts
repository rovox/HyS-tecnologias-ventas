import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/** Contraseña simple = primer nombre en minúsculas */
const PASSWORDS: Record<string, string> = {
  'julio.admin@demo.hs.local': 'julio',
  'dennis.ventas@demo.hs.local': 'dennis',
  'wilson.ventas@demo.hs.local': 'wilson',
  'vanesa.ventas@demo.hs.local': 'vanesa',
  'giovanni.ventas@demo.hs.local': 'giovanni',
  'elias.ops@demo.hs.local': 'elias',
  'estefany.admin@demo.hs.local': 'estefany',
  'mabel.admin@demo.hs.local': 'mabel',
  'marcos.tec@demo.hs.local': 'marcos',
};

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

  const users = [
    { id: 'usr_admin', email: 'julio.admin@demo.hs.local', name: 'Julio', role: 'ADMINISTRADOR', monthlyGoalBs: 12000, phone: '70000001', sucursalId: 'suc_central' },
    { id: 'usr_ventas', email: 'dennis.ventas@demo.hs.local', name: 'Dennis', role: 'VENTAS / ADMINISTRACIÓN', monthlyGoalBs: 18000, phone: '70000002', sucursalId: 'suc_central' },
    { id: 'usr_wilson', email: 'wilson.ventas@demo.hs.local', name: 'Wilson', role: 'VENTAS / ADMINISTRACIÓN', monthlyGoalBs: 14000, phone: '70000005', sucursalId: 'suc_punata' },
    { id: 'usr_vanesa', email: 'vanesa.ventas@demo.hs.local', name: 'Vanesa', role: 'VENTAS / ADMINISTRACIÓN', monthlyGoalBs: 14000, phone: '70000006', sucursalId: 'suc_quillacollo' },
    { id: 'usr_giovanni', email: 'giovanni.ventas@demo.hs.local', name: 'Giovanni', role: 'VENTAS / ADMINISTRACIÓN', monthlyGoalBs: 14000, phone: '70000007', sucursalId: 'suc_central' },
    { id: 'usr_tec', email: 'elias.ops@demo.hs.local', name: 'Elias', role: 'ADMINISTRADOR', monthlyGoalBs: 0, phone: '70000003', sucursalId: 'suc_central' },
    { id: 'usr_conta', email: 'estefany.admin@demo.hs.local', name: 'Estefany', role: 'ADMINISTRADOR', monthlyGoalBs: 0, phone: '70000004', sucursalId: 'suc_central' },
    { id: 'usr_mabel', email: 'mabel.admin@demo.hs.local', name: 'Mabel', role: 'ADMINISTRADOR', monthlyGoalBs: 0, phone: '70000008', sucursalId: 'suc_central' },
    { id: 'usr_tecnico', email: 'marcos.tec@demo.hs.local', name: 'Marcos', role: 'SEGURIDAD ELECTRÓNICA', monthlyGoalBs: 0, phone: '70000009', sucursalId: 'suc_central' },
  ];

  for (const row of users) {
    const passwordHash = await bcrypt.hash(PASSWORDS[row.email], 10);
    const { id, ...rest } = row;
    await prisma.user.upsert({
      where: { email: row.email },
      update: { ...rest, passwordHash, active: true },
      create: { id, ...rest, passwordHash, active: true },
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
    update: { estado: 'aceptado', sucursalId: 'suc_central', sucursalNombre: 'Central' },
    create: {
      id: 'quo_andina',
      numero: 'COT-080426',
      titulo: 'CCTV 16 canales — Comercial Andina',
      categoria: 'Seguridad Electrónica',
      categoriaId: 'seguridad_electronica',
      subcategoria: 'Instalaciones',
      sucursalId: 'suc_central',
      sucursalNombre: 'Central',
      clienteId: 'cli_andina',
      estado: 'aceptado',
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
      type: 'seguridad',
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
      type: 'seguridad',
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

  const salesUsers = users.filter((row) => row.role === 'VENTAS / ADMINISTRACIÓN' || row.role === 'ADMINISTRADOR');
  for (const row of salesUsers) {
    await prisma.sellerGoal.upsert({
      where: { usuarioId_mes: { usuarioId: row.id, mes } },
      update: { metaMonto: row.monthlyGoalBs, metaCotiz: 8 },
      create: { usuarioId: row.id, mes, metaMonto: row.monthlyGoalBs, metaCotiz: 8 },
    });
  }

  const categories = [
    { id: 'seguridad_electronica', label: 'Seguridad Electrónica', sortOrder: 1 },
    { id: 'insumos_tecnologicos', label: 'Equipos y tecnología', sortOrder: 2 },
    { id: 'proyectos', label: 'Proyectos', sortOrder: 3 },
  ];
  for (const row of categories) {
    await prisma.quotationCategory.upsert({
      where: { id: row.id },
      update: { label: row.label, sortOrder: row.sortOrder, active: true },
      create: { ...row, active: true },
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
    categoria: 'Seguridad Electrónica',
    categoriaId: 'seguridad_electronica',
    subcategoria: 'Instalaciones',
    sucursalId: 'suc_central',
    sucursalNombre: 'Central',
    vendedorId: 'usr_ventas',
  };
  const quotes = [
    { id: 'quo_borrador', numero: 'COT-SEED-001', titulo: 'Alarma perimetral — borrador', clienteId: 'cli_andina', estado: 'borrador', monto: 6200 },
    { id: 'quo_enviado', numero: 'COT-SEED-002', titulo: 'Control de acceso biométrico — enviado', clienteId: 'cli_hospital', estado: 'enviado', monto: 9800, fechaEnvio: at(-3), archivoPdfUrl: 'seed/cotizacion-enviada.pdf' },
    { id: 'quo_rechazado', numero: 'COT-SEED-003', titulo: 'Cableado estructurado — rechazado', clienteId: 'cli_mall', estado: 'rechazado', monto: 15400, motivoRechazo: 'Presupuesto fuera de rango (seed)' },
    { id: 'quo_aceptado_2', numero: 'COT-SEED-004', titulo: 'Cámaras IP en depósito — aceptado', clienteId: 'cli_hospital', estado: 'aceptado', monto: 7300 },
  ];
  for (const q of quotes) {
    await prisma.quotation.upsert({
      where: { numero: q.numero },
      update: { estado: q.estado },
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
    type: 'seguridad' | 'proyectos';
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
    { id: 'sch_terminado_pagado', type: 'seguridad', clienteId: 'cli_andina', sucursalId: 'suc_central', estado: 'terminado', descripcionTrabajo: 'Instalación DVR 8 canales (pagado completo)', monto: 3200, day: -10, payments: [
      { id: 'pay_tp_1', tipo: 'adelanto', monto: 1000, metodo: 'efectivo' },
      { id: 'pay_tp_2', tipo: 'cobro', monto: 2200, metodo: 'transferencia' },
    ] },
    { id: 'sch_terminado_deuda', type: 'seguridad', clienteId: 'cli_mall', sucursalId: 'suc_quillacollo', estado: 'terminado', descripcionTrabajo: 'Reubicación de cámaras (saldo pendiente)', monto: 2800, day: -6, payments: [
      { id: 'pay_td_1', tipo: 'adelanto', monto: 800, metodo: 'efectivo' },
    ] },
    { id: 'sch_terminado_extra', type: 'seguridad', clienteId: 'cli_hospital', sucursalId: 'suc_punata', estado: 'terminado', descripcionTrabajo: 'Asistencia técnica con visita adicional', monto: 1500, day: -4, payments: [
      { id: 'pay_te_1', tipo: 'cobro', monto: 1500, metodo: 'efectivo' },
      { id: 'pay_te_2', tipo: 'extra_asistencia', monto: 300, metodo: 'efectivo' },
    ] },
    { id: 'sch_cancelado', type: 'seguridad', clienteId: 'cli_andina', sucursalId: 'suc_central', estado: 'cancelado', descripcionTrabajo: 'Instalación cancelada por el cliente', monto: 2100, day: -2, payments: [
      { id: 'pay_ca_1', tipo: 'adelanto', monto: 500, metodo: 'efectivo' },
    ] },
    { id: 'sch_proyecto', type: 'proyectos', clienteId: 'cli_hospital', sucursalId: 'suc_punata', estado: 'programado', descripcionTrabajo: 'Proyecto cableado estructurado clínica', monto: 7300, day: 5, quotationId: 'quo_aceptado_2', payments: [
      { id: 'pay_pr_1', tipo: 'adelanto', monto: 2000, metodo: 'transferencia' },
    ] },
  ];
  for (const job of jobs) {
    const paid = job.payments.reduce((sum, p) => sum + p.monto, 0);
    const data = {
      type: job.type,
      clienteId: job.clienteId,
      lugar: 'Dirección demo',
      descripcionTrabajo: job.descripcionTrabajo,
      monto: job.monto,
      adelanto: Math.min(paid, job.monto),
      saldo: Math.max(job.monto - paid, 0),
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
    for (const p of job.payments) {
      const row = { scheduleId: job.id, tipo: p.tipo, monto: p.monto, metodo: p.metodo, cobradoPorId: 'usr_ventas', at: at(job.day) };
      await prisma.schedulePayment.upsert({ where: { id: p.id }, update: row, create: { id: p.id, ...row } });
    }
  }
  // Pago del trabajo sembrado originalmente (sch_andina: adelanto 5000).
  await prisma.schedulePayment.upsert({
    where: { id: 'pay_an_1' },
    update: {},
    create: { id: 'pay_an_1', scheduleId: 'sch_andina', tipo: 'adelanto', monto: 5000, metodo: 'transferencia', cobradoPorId: 'usr_ventas' },
  });

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
      create: { id: `${id}_item`, pedidoId: id, materialNombre: 'Cable UTP Cat6 (m)', cantidad: 50 + i * 10, unidad: 'metros', costoUnitario: 4.5 },
    });
  }

  console.log('Seed OK — passwords: julio / dennis / wilson / vanesa / giovanni / elias / estefany / mabel / marcos (técnico)');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
