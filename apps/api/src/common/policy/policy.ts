// Access policy: pure business rules (no Nest, no Prisma). `roles.ts` next to it adapts them to HTTP errors.

export const ROLES = {
  ADMIN: 'ADMINISTRADOR',
  VENTAS: 'VENTAS / ADMINISTRACIÓN',
  TEC: 'SEGURIDAD ELECTRÓNICA',
  /** Contabilidad: the same permissions as ADMINISTRADOR, a separate name for its users (ROLE-01, owner 2026-10-27). */
  CONTA: 'CONTABILIDAD',
  NONE: 'SIN ACCESO',
} as const;

/** The part of a user the policy needs. */
export type Actor = { id: string; role: string };

/** Query filter that matches no row. */
const NO_ROWS = { id: '__none__' };

/** The roles of Gerencia: ADMINISTRADOR and CONTABILIDAD have the same permissions (ROLE-01). */
export const MANAGER_ROLES: readonly string[] = [ROLES.ADMIN, ROLES.CONTA];
/** Gerencia: ADMINISTRADOR or CONTABILIDAD. */
export const isAdmin = (actor?: Actor | null) => Boolean(actor && MANAGER_ROLES.includes(actor.role));
export const isVentas = (actor?: Actor | null) => actor?.role === ROLES.VENTAS;
export const isTec = (actor?: Actor | null) => actor?.role === ROLES.TEC;
export const isConta = (actor?: Actor | null) => actor?.role === ROLES.CONTA;
const isNone = (actor?: Actor | null) => actor?.role === ROLES.NONE;
/** Roles that sell: Gerencia (Administración, Contabilidad) and Ventas. */
export const isCommercial = (actor?: Actor | null) => isAdmin(actor) || isVentas(actor);
/** Who reads every record (the commercial roles); writing is decided per action. */
const readsAll = isCommercial;
/** Gerencia: the money and stock controls. */
const isFinance = isAdmin;

export const canMutateQuotes = isCommercial;
export const canMutateClients = isCommercial;
/** Web contact-form requests (WEB-01). */
export const canManageWebLeads = isCommercial;
export const canSeeQuotations = readsAll;
/** Rendición: validate, observe, annul and edit any movement, transfers, refunds and cash boxes: Gerencia and Contabilidad. */
export const canValidateMovements = isFinance;
/** Everyone with access registers money (a técnico only on his own jobs, checked by the service); commercial roles and Contabilidad see the whole ledger. */
export const canRegisterMovements = (actor: Actor) => readsAll(actor) || isTec(actor);
export const canSeeLedger = readsAll;
/** Inventory: everyone reads stock; commercial roles keep the catalog and move stock; Gerencia and Contabilidad adjust it. */
export const canManageInventory = isCommercial;
export const canAdjustInventory = isFinance;
/** A técnico registers the material he uses on a project where he has a job (SCH-04); the service checks the job. */
export const usesMaterialOnOwnJobs = isTec;
/** Projects (approved quotations, with money): commercial roles. */
export const canManageProjects = isCommercial;
export const canSeeProjects = readsAll;
export const canCreateSchedules = isCommercial;
export const canMutateSchedules = (actor: Actor) => isCommercial(actor) || isTec(actor);
/** Surveys and visits (relevamientos): commercial roles and técnico. */
export const canMutateRelevamientos = (actor: Actor) => isCommercial(actor) || isTec(actor);
/** Internal orders (pedidos internos): requested and managed by admin and ventas; Contabilidad reads them. */
export const canManagePedidos = isCommercial;
export const canSeePedidos = readsAll;
/** Full user list (email, phone, goal): admin, ventas and Contabilidad. */
export const canListUsers = readsAll;
/** Id, name and role of active users, to show names (e.g. in the schedule): every role with access. */
export const canListUserDirectory = (actor: Actor) => readsAll(actor) || isTec(actor);
/** One user's profile: self, or a role that reads everything. */
export const canViewUser = (actor: Actor, targetId: string) => (!isNone(actor) && actor.id === targetId) || readsAll(actor);

export function scheduleWhere(actor: Actor) {
  if (readsAll(actor)) return {};
  if (isTec(actor)) return { tecnicoId: actor.id };
  return NO_ROWS;
}

export function quotationWhere(actor: Actor): { id?: string } {
  return readsAll(actor) ? {} : NO_ROWS;
}

export function clientWhere(actor: Actor) {
  return readsAll(actor) || isTec(actor) ? {} : NO_ROWS;
}


export function relevamientoWhere(actor: Actor, cotizacionId?: string) {
  const base = cotizacionId ? { cotizacionId } : {};
  if (readsAll(actor)) return base;
  if (isTec(actor)) return { ...base, OR: [{ usuarioId: actor.id }, { tecnicoId: actor.id }] };
  return NO_ROWS;
}

export function taskWhere(actor: Actor, tipo?: string) {
  if (readsAll(actor)) return tipo ? { tipo } : {};
  if (isTec(actor)) {
    if (tipo === 'cotizacion') return NO_ROWS;
    const own = { OR: [{ asignadoId: actor.id }, { creadorId: actor.id }] };
    return tipo ? { AND: [own, { tipo }] } : own;
  }
  return NO_ROWS;
}

/** Seller goals: Gerencia and Contabilidad see all, ventas only their own, other roles none. */
export function goalWhere(actor: Actor) {
  if (isFinance(actor)) return {};
  if (isVentas(actor)) return { usuarioId: actor.id };
  return NO_ROWS;
}

/** Whose sales metrics an actor may read: Gerencia and Contabilidad any (or all), everyone else only their own. */
export function metricsUserId(actor: Actor, requested?: string) {
  return isFinance(actor) ? requested : actor.id;
}
