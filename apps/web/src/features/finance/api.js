// Finance: the only file of this feature that talks HTTP. Keys start with 'movement' (the realtime entity of the
// ledger); every money change also moves boxes, projects, jobs and clients.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client.js';
import { authToken } from '@/api/http.js';

const opts = (extra) => ({ token: authToken(), ...extra });

export function useMovements() {
  return useQuery({ queryKey: ['movement', 'list'], queryFn: () => apiClient.get('finance/movements', opts()) });
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
      for (const key of ['movement', 'project', 'schedule', 'client']) queryClient.invalidateQueries({ queryKey: [key] });
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
  return useLedgerMutation(({ target, concepto, ...payment }) =>
    target.kind === 'project'
      ? apiClient.post(`projects/${target.id}/cobros`, { concepto, ...payment }, opts())
      : apiClient.post(`schedules/${target.id}/payments`, { tipo: concepto === 'adicional' ? 'extra_asistencia' : concepto, ...payment }, opts()),
  );
}
