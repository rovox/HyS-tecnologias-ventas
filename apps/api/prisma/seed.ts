import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/** Contraseña simple = primer nombre en minúsculas */
const PASSWORDS: Record<string, string> = {
  'julio.admin@demo.hs.local': 'julio',
  'dennis.ventas@demo.hs.local': 'dennis',
  'wilson.ventas@demo.hs.local': 'wilson',
  'vanesa.ventas@demo.hs.local': 'vanesa',
  'elias.ops@demo.hs.local': 'elias',
  'elena.conta@demo.hs.local': 'elena',
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
    { id: 'usr_tec', email: 'elias.ops@demo.hs.local', name: 'Elias', role: 'SEGURIDAD ELECTRÓNICA', monthlyGoalBs: 0, phone: '70000003', sucursalId: 'suc_central' },
    { id: 'usr_conta', email: 'elena.conta@demo.hs.local', name: 'Elena Rojas', role: 'Contadora', monthlyGoalBs: 0, phone: '70000004', sucursalId: 'suc_central' },
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
      tecnicoId: 'usr_tec',
      quotationId: 'quo_andina',
      observaciones: 'Seed: desde cotización aceptada',
    },
  });

  await prisma.schedule.upsert({
    where: { id: 'sch_mall' },
    update: { estado: 'programado' },
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
      tecnicoId: 'usr_tec',
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

  console.log('Seed OK — passwords: julio / dennis / wilson / vanesa / elias / elena');
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
