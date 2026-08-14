export const PEDIDOS_FLOW = {
  'solicitado': ['aprobado', 'rechazado', 'cancelado'],
  'aprobado': ['en_preparación', 'rechazado', 'cancelado'],
  'en_preparación': ['entregado', 'rechazado', 'cancelado'],
  'entregado': [],
  'rechazado': [],
  'cancelado': []
};

export const SCHEDULES_FLOW = {
  'programado': ['en_proceso', 'cancelado'],
  'en_proceso': ['terminado', 'cancelado'],
  'terminado': ['cancelado'],
  'cancelado': []
};

export const isValidTransition = (flowType, currentState, newState) => {
  console.log(`[StateFlowValidator] Validating transition for ${flowType}: ${currentState} -> ${newState}`);
  
  if (currentState === newState) {
    console.log(`[StateFlowValidator] Result: valid (Same state)`);
    return { valid: true, reason: 'Same state' };
  }

  if (newState === 'cancelado' || newState === 'rechazado') {
    console.log(`[StateFlowValidator] Result: valid (Cancelado/Rechazado allowed from any state)`);
    return { valid: true, reason: 'Cancelado/Rechazado allowed from any state' };
  }

  const flow = (flowType === 'pedidos' || flowType === 'pedidos_internos') ? PEDIDOS_FLOW : SCHEDULES_FLOW;
  const validNextStates = flow[currentState] || [];
  
  if (validNextStates.includes(newState)) {
    console.log(`[StateFlowValidator] Result: valid (Standard flow)`);
    return { valid: true, reason: 'Valid transition' };
  }

  console.log(`[StateFlowValidator] Result: invalid (Cannot skip states or move backwards)`);
  return { valid: false, reason: 'Cannot skip states or move backwards' };
};

export const getValidNextStates = (flowType, currentState) => {
  const flow = (flowType === 'pedidos' || flowType === 'pedidos_internos') ? PEDIDOS_FLOW : SCHEDULES_FLOW;
  return flow[currentState] || [];
};

export const canUserChangeState = (userRole) => {
  console.log(`[StateFlowValidator] Checking permissions for role: ${userRole}`);
  const allowedRoles = ['ADMINISTRADOR', 'VENTAS / ADMINISTRACIÓN', 'SEGURIDAD ELECTRÓNICA'];
  const hasPermission = allowedRoles.includes(userRole);
  console.log(`[StateFlowValidator] Permission result: ${hasPermission}`);
  return hasPermission;
};