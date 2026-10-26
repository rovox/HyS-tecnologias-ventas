// Inventory: the only file of this feature that talks HTTP. Keys start with 'product' and 'stock' (realtime entities):
// delivering an internal order carries both in `affects`, so stock refreshes everywhere.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client.js';
import { authToken } from '@/api/http.js';

const opts = (extra) => ({ token: authToken(), ...extra });

/** Catalog with stock per branch (`stock[sucursalId]`), `stockTotal` and `stockBajo`. */
export function useProducts(enabled = true) {
  return useQuery({ queryKey: ['product', 'list'], queryFn: () => apiClient.get('inventory/products', opts()), enabled });
}

export function useStockMovements() {
  return useQuery({ queryKey: ['stock', 'list'], queryFn: () => apiClient.get('inventory/movements', opts()) });
}

function useInventoryMutation(fn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      for (const key of ['product', 'stock', 'project', 'client']) queryClient.invalidateQueries({ queryKey: [key] });
    },
  });
}

/** Create (no id) or update a product; `active: false` archives it. */
export function useSaveProduct() {
  return useInventoryMutation(({ id, ...data }) => (id ? apiClient.patch(`inventory/products/${id}`, data, opts()) : apiClient.post('inventory/products', data, opts())));
}

/** tipo: entrada | transferencia | salida_proyecto | ajuste (Gerencia). */
export function useRegisterStockMovement() {
  return useInventoryMutation((data) => apiClient.post('inventory/movements', data, opts()));
}
