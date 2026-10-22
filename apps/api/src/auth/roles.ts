import { ForbiddenException } from '@nestjs/common';
import type { User } from '@prisma/client';
import {
  canCreateSchedules,
  canManageWebLeads,
  canMutateClients,
  canMutateQuotes,
  canMutateRelevamientos,
  canMutateSchedules,
  isAdmin,
} from '../domain/policy';

// Nest adapter over the pure policy in `domain/policy.ts`: same names for existing callers,
// and the assert* helpers turn a denied rule into 403.
export {
  ROLES,
  clientWhere,
  goalWhere,
  isAdmin,
  isTec,
  isVentas,
  metricsUserId,
  quotationWhere,
  relevamientoWhere,
  saleWhere,
  scheduleWhere,
  taskWhere,
} from '../domain/policy';

export function assertAdmin(user: User) {
  if (!isAdmin(user)) throw new ForbiddenException('Solo administrador');
}

export function assertCanMutateQuotes(user: User) {
  if (!canMutateQuotes(user)) throw new ForbiddenException('No puedes modificar cotizaciones');
}

export function assertCanMutateClients(user: User) {
  if (!canMutateClients(user)) throw new ForbiddenException('No puedes modificar clientes');
}

/** Web contact-form requests (WEB-01): commercial roles only. */
export function assertCanManageWebLeads(user: User) {
  if (!canManageWebLeads(user)) throw new ForbiddenException('No puedes ver ni gestionar solicitudes web');
}

export function assertCanMutateSchedules(user: User) {
  if (!canMutateSchedules(user)) throw new ForbiddenException('No puedes modificar el cronograma');
}

export function assertCanMutateRelevamientos(user: User) {
  if (!canMutateRelevamientos(user)) throw new ForbiddenException('No puedes registrar relevamientos');
}

export function assertCanCreateSchedules(user: User) {
  if (!canCreateSchedules(user)) throw new ForbiddenException('Solo ventas o admin pueden crear trabajos');
}
