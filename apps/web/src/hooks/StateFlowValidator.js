import { ROLES } from '@/constants/roles.js';

const PEDIDOS_FLOW = {
  solicitado: ['aprobado', 'rechazado', 'cancelado'],
  aprobado: ['en_preparación', 'cancelado'],
  en_preparación: ['listo_para_entrega', 'cancelado'],
  listo_para_entrega: ['entregado'],
  entregado: [],
  rechazado: [],
  cancelado: [],
};

export function isValidTransition(entityType, fromState, toState) {
  const flow = entityType === 'pedidos_internos' ? PEDIDOS_FLOW : {};
  const allowed = flow[fromState] || [];
  if (!allowed.includes(toState)) {
    return { valid: false, reason: `Transición no permitida: ${fromState} → ${toState}` };
  }
  return { valid: true };
}

export function canUserChangeState(role) {
  return [ROLES.ADMIN, ROLES.VENTAS].includes(role);
}

export function getValidNextStates(entityType, currentState) {
  const flow = entityType === 'pedidos_internos' ? PEDIDOS_FLOW : {};
  return flow[currentState] || [];
}
