// Access policy: pure business rules (no Nest, no Prisma). `roles.ts` next to it adapts them to HTTP errors.

export const ROLES = {
  ADMIN: 'ADMINISTRADOR',
  VENTAS: 'VENTAS / ADMINISTRACIÓN',
  TEC: 'SEGURIDAD ELECTRÓNICA',
  NONE: 'SIN ACCESO',
} as const;

/** The part of a user the policy needs. */
export type Actor = { id: string; role: string };

/** Query filter that matches no row. */
const NO_ROWS = { id: '__none__' };

export const isAdmin = (actor?: Actor | null) => actor?.role === ROLES.ADMIN;
export const isVentas = (actor?: Actor | null) => actor?.role === ROLES.VENTAS;
export const isTec = (actor?: Actor | null) => actor?.role === ROLES.TEC;
const isNone = (actor?: Actor | null) => actor?.role === ROLES.NONE;
const isCommercial = (actor?: Actor | null) => isAdmin(actor) || isVentas(actor);

export const canMutateQuotes = isCommercial;
export const canMutateClients = isCommercial;
/** Web contact-form requests (WEB-01). */
export const canManageWebLeads = isCommercial;
export const canSeeQuotations = isCommercial;
/** Rendición: validate, observe, reverse movements and manage cash boxes. Gerencia until a CONTABILIDAD role exists. */
export const canValidateMovements = isAdmin;
/** Everyone with access registers money (a técnico only on his own jobs, checked by the service); commercial roles see the whole ledger. */
export const canRegisterMovements = (actor: Actor) => isCommercial(actor) || isTec(actor);
export const canSeeLedger = isCommercial;
/** Projects (approved quotations, with money): commercial roles. */
export const canManageProjects = isCommercial;
export const canCreateSchedules = isCommercial;
export const canMutateSchedules = (actor: Actor) => isCommercial(actor) || isTec(actor);
/** Surveys and visits (relevamientos): commercial roles and técnico. */
export const canMutateRelevamientos = (actor: Actor) => isCommercial(actor) || isTec(actor);
/** Internal orders (pedidos internos): requested and managed by admin and ventas. */
export const canManagePedidos = isCommercial;
/** Full user list (email, phone, goal): admin and ventas. */
export const canListUsers = isCommercial;
/** Id, name and role of active users, to show names (e.g. in the schedule): every role with access. */
export const canListUserDirectory = (actor: Actor) => isCommercial(actor) || isTec(actor);
/** One user's profile: self, or admin and ventas. */
export const canViewUser = (actor: Actor, targetId: string) => (!isNone(actor) && actor.id === targetId) || isCommercial(actor);

export function scheduleWhere(actor: Actor) {
  if (isCommercial(actor)) return {};
  if (isTec(actor)) return { tecnicoId: actor.id };
  return NO_ROWS;
}

export function quotationWhere(actor: Actor): { id?: string } {
  return isCommercial(actor) ? {} : NO_ROWS;
}

export function clientWhere(actor: Actor) {
  return isCommercial(actor) || isTec(actor) ? {} : NO_ROWS;
}

export function saleWhere(actor: Actor) {
  if (isAdmin(actor)) return {};
  if (isVentas(actor)) {
    return { quotation: { OR: [{ vendedorId: actor.id }, { sellers: { some: { userId: actor.id } } }] } };
  }
  return NO_ROWS;
}

export function relevamientoWhere(actor: Actor, cotizacionId?: string) {
  const base = cotizacionId ? { cotizacionId } : {};
  if (isCommercial(actor)) return base;
  if (isTec(actor)) return { ...base, OR: [{ usuarioId: actor.id }, { tecnicoId: actor.id }] };
  return NO_ROWS;
}

export function taskWhere(actor: Actor, tipo?: string) {
  if (isCommercial(actor)) return tipo ? { tipo } : {};
  if (isTec(actor)) {
    if (tipo === 'cotizacion') return NO_ROWS;
    const own = { OR: [{ asignadoId: actor.id }, { creadorId: actor.id }] };
    return tipo ? { AND: [own, { tipo }] } : own;
  }
  return NO_ROWS;
}

/** Seller goals: admin sees all, ventas only their own, other roles none. */
export function goalWhere(actor: Actor) {
  if (isAdmin(actor)) return {};
  if (isVentas(actor)) return { usuarioId: actor.id };
  return NO_ROWS;
}

/** Whose sales metrics an actor may read: admin any (or all), everyone else only their own. */
export function metricsUserId(actor: Actor, requested?: string) {
  return isAdmin(actor) ? requested : actor.id;
}
