// Finance: the only file of this feature that talks HTTP. Keys start with 'movement' (the realtime entity of the
// ledger); validating or reversing also moves boxes, projects and jobs.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client.js';
import { authToken } from '@/api/http.js';

const opts = (extra) => ({ token: authToken(), ...extra });

export function useMovements() {
  return useQuery({ queryKey: ['movement', 'list'], queryFn: () => apiClient.get('finance/movements', opts()) });
}

export function useCashBoxes() {
  return useQuery({ queryKey: ['movement', 'boxes'], queryFn: () => apiClient.get('finance/cajas', opts()) });
}

function useLedgerMutation(fn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      for (const key of ['movement', 'project', 'schedule']) queryClient.invalidateQueries({ queryKey: [key] });
    },
  });
}

/** Expense, other income or transfer. */
export function useCreateMovement() {
  return useLedgerMutation((data) => apiClient.post('finance/movements', data, opts()));
}

/** Correct a movement not yet validated (an observed one returns to validation). */
export function useUpdateMovement() {
  return useLedgerMutation(({ id, ...data }) => apiClient.patch(`finance/movements/${id}`, data, opts()));
}

/** action: validar ({ cajaId }) | observar | anular | revertir ({ motivo }) | reembolsar. */
export function useMovementAction() {
  return useLedgerMutation(({ id, action, ...body }) => apiClient.post(`finance/movements/${id}/${action}`, body, opts()));
}
