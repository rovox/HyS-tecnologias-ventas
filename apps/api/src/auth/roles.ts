import { ForbiddenException } from '@nestjs/common';
import type { User } from '@prisma/client';

export const ROLES = {
  ADMIN: 'ADMINISTRADOR',
  VENTAS: 'VENTAS / ADMINISTRACIÓN',
  TEC: 'SEGURIDAD ELECTRÓNICA',
  CONT: 'Contadora',
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

export function scheduleWhere(user: User) {
  if (isAdmin(user) || isCont(user)) return {};
  if (isVentas(user) && user.sucursalId) return { sucursalId: user.sucursalId };
  if (isTec(user)) return { tecnicoId: user.id };
  return { id: '__none__' };
}

export function quotationWhere(user: User) {
  if (isAdmin(user) || isCont(user)) return {};
  if (isVentas(user)) {
    return { OR: [{ vendedorId: user.id }, { sellers: { some: { userId: user.id } } }] };
  }
  return { id: '__none__' };
}

export function clientWhere(user: User) {
  if (isAdmin(user) || isCont(user)) return {};
  if (user.sucursalId) return { sucursalId: user.sucursalId };
  return {};
}

export function saleWhere(user: User) {
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
  if (isAdmin(user)) return base;
  if (isVentas(user)) {
    return { ...base, ...(user.sucursalId ? { sucursalId: user.sucursalId } : {}) };
  }
  if (isTec(user)) return { ...base, usuarioId: user.id };
  return { id: '__none__' };
}

export function taskWhere(user: User) {
  if (isAdmin(user)) return {};
  if (isVentas(user) && user.sucursalId) return { sucursalId: user.sucursalId };
  if (isTec(user)) {
    return { OR: [{ asignadoId: user.id }, { creadorId: user.id }] };
  }
  return { id: '__none__' };
}

export function metricsUserId(user: User, requested?: string) {
  if (isAdmin(user)) return requested;
  if (isVentas(user)) return user.id;
  if (isCont(user)) return requested;
  return user.id;
}
