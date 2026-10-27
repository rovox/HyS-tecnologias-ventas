// Finance: the only file of this feature that talks HTTP. Keys start with 'movement' (the realtime entity of the
// ledger); every money change also moves boxes, projects, jobs and clients.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client.js';
import { authToken } from '@/api/http.js';
import { API_URL } from '@/api/config.js';

const opts = (extra) => ({ token: authToken(), ...extra });

export function useMovements() {
  return useQuery({ queryKey: ['movement', 'list'], queryFn: () => apiClient.get('finance/movements', opts()) });
}

/** The daily ledger: { desde, hasta } (Bolivian days) and optionally { sucursalId } (FIN-06). */
export function useLedger(params, enabled = true) {
  return useQuery({ queryKey: ['movement', 'list', 'ledger', params], queryFn: () => apiClient.get('finance/movements', opts({ query: params })), enabled });
}

/** Downloads the same ledger as CSV or Excel, built by the API (amounts as numbers, a summary sheet). */
export async function downloadLedger(params, formato) {
  const query = new URLSearchParams(Object.entries({ ...params, formato }).filter(([, v]) => v)).toString();
  const response = await fetch(`${API_URL.replace(/\/$/, '')}/finance/movements/export?${query}`, { headers: { Authorization: `Bearer ${authToken()}` } });
  if (!response.ok) throw new Error((await response.json().catch(() => ({}))).message || 'No se pudo descargar el libro');
  const name = /filename="([^"]+)"/.exec(response.headers.get('content-disposition') || '')?.[1] || `libro.${formato}`;
  const link = document.createElement('a');
  link.href = URL.createObjectURL(await response.blob());
  link.download = name;
  link.click();
  URL.revokeObjectURL(link.href);
}

export function useMovement(id) {
  return useQuery({ queryKey: ['movement', 'detail', id], queryFn: () => apiClient.get(`finance/movements/${id}`, opts()), enabled: Boolean(id) });
}

export function useCashBoxes() {
  return useQuery({ queryKey: ['movement', 'boxes'], queryFn: () => apiClient.get('finance/cajas', opts()) });
}

/** Money not yet validated, per person who holds it ("por rendir"). */
export function useCustody(enabled = true) {
  return useQuery({ queryKey: ['movement', 'custody'], queryFn: () => apiClient.get('finance/por-rendir', opts()), enabled });
}

/** What validating (into `cajaId`) or annulling a movement changes, asked right before confirming. */
export function useMovementImpact() {
  const queryClient = useQueryClient();
  return (id, accion, cajaId) =>
    queryClient.fetchQuery({
      queryKey: ['movement', 'impact', id, accion, cajaId || null],
      queryFn: () => apiClient.get(`finance/movements/${id}/impacto`, opts({ query: { accion, ...(cajaId ? { cajaId } : {}) } })),
      staleTime: 0,
    });
}

function useLedgerMutation(fn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      for (const key of ['movement', 'project', 'schedule', 'relevamiento', 'client']) queryClient.invalidateQueries({ queryKey: [key] });
    },
  });
}

/** Expense, other income or transfer. */
export function useCreateMovement() {
  return useLedgerMutation((data) => apiClient.post('finance/movements', data, opts()));
}

/** Correct a movement (an observed one returns to validation; Gerencia and Contabilidad also a validated one). */
export function useUpdateMovement() {
  return useLedgerMutation(({ id, ...data }) => apiClient.patch(`finance/movements/${id}`, data, opts()));
}

/** action: validar ({ cajaId }) | observar | anular ({ motivo }) | reembolsar. */
export function useMovementAction() {
  return useLedgerMutation(({ id, action, ...body }) => apiClient.post(`finance/movements/${id}/${action}`, body, opts()));
}

/** A payment of a project or of a job: the API checks it against what is still owed. */
export function useRegisterIncome() {
  return useLedgerMutation(({ target, concepto, ...payment }) => {
    if (target.kind === 'project') return apiClient.post(`projects/${target.id}/cobros`, { concepto, ...payment }, opts());
    if (target.kind === 'visit') return apiClient.post(`relevamientos/${target.id}/cobros`, payment, opts());
    return apiClient.post(`schedules/${target.id}/payments`, { tipo: concepto === 'adicional' ? 'extra_asistencia' : concepto, ...payment }, opts());
  });
}

/** The day of a branch before counting (FIN-04). Under 'movement': a sale or an expense refreshes it. */
export function useCashClosePreview(sucursalId, dia) {
  return useQuery({
    queryKey: ['movement', 'cierre-preview', sucursalId, dia],
    queryFn: () => apiClient.get('finance/cierres/preview', opts({ query: { sucursalId, dia } })),
    enabled: Boolean(sucursalId && dia),
  });
}

export function useCashCloses(params, enabled = true) {
  return useQuery({ queryKey: ['cashClose', 'list', params], queryFn: () => apiClient.get('finance/cierres', opts({ query: params })), enabled });
}

/** { sucursalId, dia, conteo, saldoInicial?, motivoDiferencia?, observaciones? }. */
export function useCloseCash() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data) => apiClient.post('finance/cierres', data, opts()),
    onSuccess: () => {
      for (const key of ['cashClose', 'movement']) queryClient.invalidateQueries({ queryKey: [key] });
    },
  });
}

export function useReviewClose() {
  const queryClient = useQueryClient();
  return useMutation({ mutationFn: (id) => apiClient.post(`finance/cierres/${id}/revisar`, {}, opts()), onSuccess: () => queryClient.invalidateQueries({ queryKey: ['cashClose'] }) });
}

/** Advances still to be accounted for, with days late (FIN-04). */
export function useAdvances(enabled = true) {
  return useQuery({ queryKey: ['movement', 'anticipos'], queryFn: () => apiClient.get('finance/anticipos', opts()), enabled });
}

export function useSettleAdvance() {
  return useLedgerMutation(({ id, nota }) => apiClient.post(`finance/movements/${id}/rendido`, { nota }, opts()));
}

/** The dashboard's money (DASH-01): month cobrado / en caja / expenses, box balances, today per branch. */
export function useFinanceSummary(mes) {
  return useQuery({ queryKey: ['movement', 'resumen', mes], queryFn: () => apiClient.get('finance/resumen', opts(mes ? { query: { mes } } : undefined)) });
}
