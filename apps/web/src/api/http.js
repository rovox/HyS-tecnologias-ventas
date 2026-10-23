import apiClient from '@/api/client.js';
import { authStore } from '@/lib/authStore.js';

export const authToken = () => authStore.token;

export function mapClient(row) {
  if (!row) return row;
  return {
    ...row,
    sucursal_id: row.sucursal_id || row.sucursalId || '',
    created: row.created || row.createdAt,
    updated: row.updated || row.updatedAt,
  };
}

export { apiClient };
