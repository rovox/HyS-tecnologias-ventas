// Projects: the only file of this feature that talks HTTP. Keys start with 'project'; job and payment events carry
// 'project' in `affects`, so totals refresh in every open session.
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/api/client.js';
import { authToken } from '@/api/http.js';

const opts = (extra) => ({ token: authToken(), ...extra });

/** `enabled: false` for roles without access to projects (técnico). */
export function useProjects(enabled = true) {
  return useQuery({ queryKey: ['project', 'list'], queryFn: () => apiClient.get('projects', opts()), enabled });
}

export function useProject(id, enabled = true) {
  return useQuery({ queryKey: ['project', 'detail', id], queryFn: () => apiClient.get(`projects/${id}`, opts()), enabled: Boolean(id) && enabled });
}

function useProjectMutation(fn) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: fn,
    onSuccess: (project) => {
      queryClient.setQueryData(['project', 'detail', project.id], project);
      queryClient.invalidateQueries({ queryKey: ['project'] });
      queryClient.invalidateQueries({ queryKey: ['schedule'] });
    },
  });
}

/** estado: en_ejecucion | entregado | cerrado | anulado (motivo). */
export function useChangeProjectStatus() {
  return useProjectMutation(({ id, estado, motivo }) => apiClient.post(`projects/${id}/estado`, { estado, motivo }, opts()));
}

export function useUpdateProject() {
  return useProjectMutation(({ id, ...data }) => apiClient.patch(`projects/${id}`, data, opts()));
}

export function useAddProjectJob() {
  return useProjectMutation(({ id, ...job }) => apiClient.post(`projects/${id}/trabajos`, job, opts()));
}

/** tipo: adelanto | cobro | extra_asistencia (adicional: does not reduce the balance). */
export function useRegisterProjectPayment() {
  return useProjectMutation(({ id, ...payment }) => apiClient.post(`projects/${id}/cobros`, payment, opts()));
}
