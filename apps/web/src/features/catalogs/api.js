// Reference data shared by many screens: divisions/subcategory chips, branches, user directory, client options.
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/api/client.js';
import { authToken } from '@/api/http.js';

const get = (path, query) => apiClient.get(path, { token: authToken(), query });
const LONG = 5 * 60_000;

/** GET /categories: the 3 divisions (principal) first, then the subcategory chips. */
export function useCategories() {
  return useQuery({
    queryKey: ['category', 'list'],
    queryFn: () => get('categories'),
    staleTime: LONG,
    select: (rows) => ({
      divisions: rows.filter((c) => c.principal),
      chips: rows.filter((c) => !c.principal),
    }),
  });
}

export function useSucursales() {
  return useQuery({ queryKey: ['sucursal', 'list'], queryFn: () => get('sucursales'), staleTime: LONG });
}

/** Id, name and role of every active user (any role may read it). */
export function useUserDirectory() {
  return useQuery({ queryKey: ['user', 'directory'], queryFn: () => get('users/directory'), staleTime: LONG });
}

/** Clients for pickers (id, nombre). */
export function useClientOptions() {
  return useQuery({
    queryKey: ['client', 'options'],
    queryFn: () => get('clients'),
    select: (rows) => rows.map((c) => ({ id: c.id, nombre: c.nombre, direccion: c.direccion, mapsLink: c.mapsLink, contacto: c.contacto, telefono: c.telefono, sucursalId: c.sucursalId })),
  });
}
