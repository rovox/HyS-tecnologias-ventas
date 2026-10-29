// Quotations: the only file of this feature that talks HTTP. Query keys start with the API entity ('quotation'),
// so the realtime provider refreshes every open screen when any session changes a quotation.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient, fetchFile } from '@/api/client.js';
import { authToken } from '@/api/http.js';

const opts = (extra) => ({ token: authToken(), ...extra });

const quotationKeys = {
  all: ['quotation'],
  list: (vista) => ['quotation', 'list', vista],
  detail: (id) => ['quotation', 'detail', id],
};

/** vista: 'abiertas' (borrador, enviado) | 'cerradas' (aprobado, rechazado, vencido, eliminadas). */
export function useQuotations(vista) {
  return useQuery({
    queryKey: quotationKeys.list(vista),
    queryFn: () => apiClient.get('quotations', opts({ query: { vista } })),
  });
}

export function useQuotation(id) {
  return useQuery({
    queryKey: quotationKeys.detail(id),
    queryFn: () => apiClient.get(`quotations/${id}`, opts()),
    enabled: Boolean(id),
  });
}

function attach(id, file, kind) {
  const body = new FormData();
  body.append('file', file);
  return apiClient.post(`quotations/${id}/files`, body, opts({ query: kind === 'pdf' ? undefined : { kind } }));
}

/** Uploads the PDF and the licitación documents of a quotation, in order. */
async function attachAll(id, { pdf, licitacion = [] }) {
  let quote = null;
  if (pdf) quote = await attach(id, pdf, 'pdf');
  for (const file of licitacion) quote = await attach(id, file, 'licitacion');
  return quote;
}

function useQuotationMutation(fn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (quote) => {
      if (quote?.id) queryClient.setQueryData(quotationKeys.detail(quote.id), quote);
      queryClient.invalidateQueries({ queryKey: quotationKeys.all });
    },
  });
}

/** Creates the quotation, uploads its files and, when `send`, sends it (the API requires the PDF). */
export function useCreateQuotation() {
  return useQuotationMutation(async ({ data, files = {}, send = false }) => {
    let quote = await apiClient.post('quotations', data, opts());
    quote = (await attachAll(quote.id, files)) || quote;
    if (send) quote = await apiClient.post(`quotations/${quote.id}/status`, { estado: 'enviado' }, opts());
    return quote;
  });
}

export function useUpdateQuotation() {
  return useQuotationMutation(async ({ id, data, files = {} }) => {
    const quote = await apiClient.patch(`quotations/${id}`, data, opts());
    return (await attachAll(id, files)) || quote;
  });
}

export function useAttachQuotationFile() {
  return useQuotationMutation(({ id, file, kind = 'pdf' }) => attach(id, file, kind));
}

/** estado: enviado | aprobado (creates the project) | rechazado (motivoRechazo) | borrador (reopen). */
export function useChangeQuotationStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, estado, motivoRechazo }) =>
      apiClient.post(`quotations/${id}/status`, { estado, motivoRechazo }, opts()),
    onSuccess: (quote) => {
      queryClient.setQueryData(quotationKeys.detail(quote.id), quote);
      queryClient.invalidateQueries({ queryKey: quotationKeys.all });
      if (quote.estado === 'aprobado') {
        queryClient.invalidateQueries({ queryKey: ['schedule'] });
        queryClient.invalidateQueries({ queryKey: ['client'] });
      }
    },
  });
}

export function useDeleteQuotation() {
  return useQuotationMutation(({ id, motivo }) => apiClient.post(`quotations/${id}/eliminar`, { motivo }, opts()));
}

export function useRestoreQuotation() {
  return useQuotationMutation((id) => apiClient.post(`quotations/${id}/restaurar`, {}, opts()));
}

/** Opens a stored quotation file (PDF or licitación document) in a new tab; files need the session token. */
export async function openQuotationFile(url) {
  const path = String(url).replace(/^\/api\//, '').replace(/^\//, '');
  const response = await fetchFile(path);
  if (!response.ok) throw new Error('No se pudo abrir el archivo');
  window.open(URL.createObjectURL(await response.blob()), '_blank', 'noopener');
}
