/** Helpers de estado de cliente (sin componentes React). */

/**
 * Cliente "real" / contratado: cotización aceptada o trabajo no cancelado.
 */
export function isClienteContratado(clientId, quotes, schedules) {
  const qOk = (quotes || []).some(
    (row) =>
      (row.cliente_id === clientId || row.clienteId === clientId)
      && row.estado === 'aceptado',
  );
  if (qOk) return true;
  return (schedules || []).some(
    (job) =>
      (job.cliente_id === clientId || job.clienteId === clientId)
      && job.estado !== 'cancelado',
  );
}
