import { ForbiddenException } from '@nestjs/common';
import type { User } from '@prisma/client';

export const ROLES = {
  ADMIN: 'ADMINISTRADOR',
  VENTAS: 'VENTAS / ADMINISTRACIÓN',
  TEC: 'SEGURIDAD ELECTRÓNICA',
  CONT: 'Contadora',
  NONE: 'SIN ACCESO',
} as const;

export function isAdmin(user?: User | null) {
  return user?.role === ROLES.ADMIN;
}

export function isVentas(user?: User | null) {
  return user?.role === ROLES.VENTAS;
}

export function isTec(user?: User | null) {
  return user?.role === ROLES.TEC;
}

export function isCont(user?: User | null) {
  return user?.role === ROLES.CONT;
}

export function isNone(user?: User | null) {
  return user?.role === ROLES.NONE;
}

export function assertAdmin(user: User) {
  if (!isAdmin(user)) throw new ForbiddenException('Solo administrador');
}

export function assertCanMutateQuotes(user: User) {
  if (!isAdmin(user) && !isVentas(user)) {
    throw new ForbiddenException('No puedes modificar cotizaciones');
  }
}

export function assertCanMutateClients(user: User) {
  if (!isAdmin(user) && !isVentas(user)) {
    throw new ForbiddenException('No puedes modificar clientes');
  }
}

export function assertCanMutateSchedules(user: User) {
  if (!isAdmin(user) && !isVentas(user) && !isTec(user)) {
    throw new ForbiddenException('No puedes modificar el cronograma');
  }
}

export function assertCanCreateSchedules(user: User) {
  if (!isAdmin(user) && !isVentas(user)) {
    throw new ForbiddenException('Solo ventas o admin pueden crear trabajos');
  }
}

/** Lectura: Admin/Contadora/Ventas ven todas las sucursales. sucursalId del usuario es solo default al crear. */
export function scheduleWhere(user: User) {
  if (isNone(user)) return { id: '__none__' };
  if (isAdmin(user) || isCont(user) || isVentas(user)) return {};
  if (isTec(user)) return { tecnicoId: user.id };
  return { id: '__none__' };
}

export function quotationWhere(user: User) {
  if (isNone(user)) return { id: '__none__' };
  if (isAdmin(user) || isVentas(user)) return {};
  return { id: '__none__' };
}

export function clientWhere(user: User) {
  if (isNone(user)) return { id: '__none__' };
  if (isAdmin(user) || isCont(user) || isVentas(user)) return {};
  if (isTec(user)) return {};
  return { id: '__none__' };
}

export function saleWhere(user: User) {
  if (isNone(user)) return { id: '__none__' };
  if (isAdmin(user) || isCont(user)) return {};
  if (isVentas(user)) {
    return {
      quotation: { OR: [{ vendedorId: user.id }, { sellers: { some: { userId: user.id } } }] },
    };
  }
  return { id: '__none__' };
}

export function relevamientoWhere(user: User, cotizacionId?: string) {
  const base = cotizacionId ? { cotizacionId } : {};
  if (isNone(user)) return { id: '__none__' };
  if (isAdmin(user) || isVentas(user)) return base;
  if (isTec(user)) return { ...base, usuarioId: user.id };
  return { id: '__none__' };
}

export function taskWhere(user: User, tipo?: string) {
  if (isNone(user)) return { id: '__none__' };
  if (isAdmin(user)) return tipo ? { tipo } : {};
  if (isVentas(user)) return tipo ? { tipo } : {};
  if (isTec(user)) {
    if (tipo === 'cotizacion') return { id: '__none__' };
    const own = { OR: [{ asignadoId: user.id }, { creadorId: user.id }] };
    return tipo ? { AND: [own, { tipo }] } : own;
  }
  return { id: '__none__' };
}

export function metricsUserId(user: User, requested?: string) {
  if (isNone(user)) return user.id;
  if (isAdmin(user)) return requested;
  if (isVentas(user)) return user.id;
  if (isCont(user)) return requested;
  return user.id;
}
