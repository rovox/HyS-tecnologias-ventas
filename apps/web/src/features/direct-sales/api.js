// Direct sales (VD-02): the only file of this feature that talks HTTP. Keys start with 'directSale' (realtime entity);
// a sale also moves stock, boxes and the ledger, so those lists refresh too.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client.js';
import { API_URL } from '@/api/config.js';
import { authToken } from '@/api/http.js';

const opts = (extra) => ({ token: authToken(), ...extra });

/** { sucursalId, desde, hasta, estado } — days are Bolivian days. */
export function useDirectSales(params) {
  return useQuery({ queryKey: ['directSale', 'list', params], queryFn: () => apiClient.get('direct-sales', opts({ query: params })) });
}

function useSaleMutation(fn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: () => {
      for (const key of ['directSale', 'product', 'stock', 'movement', 'client']) queryClient.invalidateQueries({ queryKey: [key] });
    },
  });
}

/** { sucursalId, clienteId?, clienteNombre?, clienteCelular?, clienteNit?, items, descuento?, pagos, reemplazaAId? }. */
export function useCreateDirectSale() {
  return useSaleMutation((data) => apiClient.post('direct-sales', data, opts()));
}

export function useAnnulDirectSale() {
  return useSaleMutation(({ id, motivo }) => apiClient.post(`direct-sales/${id}/anular`, { motivo }, opts()));
}

/** The stored sale note as a blob URL (the ANULADA copy of an annulled sale, unless `original`). */
export async function fetchSaleNote(id, original = false) {
  const response = await fetch(`${API_URL.replace(/\/$/, '')}/direct-sales/${id}/nota.pdf${original ? '?original=1' : ''}`, { headers: { Authorization: `Bearer ${authToken()}` } });
  if (!response.ok) throw new Error((await response.json().catch(() => ({}))).message || 'No se pudo abrir la nota');
  const name = /filename="([^"]+)"/.exec(response.headers.get('content-disposition') || '')?.[1] || 'nota.pdf';
  return { url: URL.createObjectURL(await response.blob()), name };
}
