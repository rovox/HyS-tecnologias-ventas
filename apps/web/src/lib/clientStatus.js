/** Helpers de estado de cliente (sin componentes React). */

/**
 * Cliente con actividad reciente o trabajo/cotización abierta (filtro "Solo activos").
 */
export function isActiveClient(client, quotes, jobs) {
  const hace90 = Date.now() - 90 * 24 * 60 * 60 * 1000;
  if (client?.lastActivityAt && new Date(client.lastActivityAt).getTime() >= hace90) return true;
  const mine = (quotes || []).filter((row) => row.cliente_id === client.id || row.clienteId === client.id);
  if (mine.some((row) => row.estado === 'borrador' || row.estado === 'enviado')) return true;
  return (jobs || []).some((job) =>
    (job.cliente_id === client.id || job.clienteId === client.id)
    && job.estado !== 'terminado'
    && job.estado !== 'cancelado',
  );
}

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
