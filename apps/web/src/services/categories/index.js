import * as store from '@/mocks/store.js';
import { apiClient, authToken, isMockMode } from '@/api/http.js';
import { QUOTATION_MAIN_CATEGORIES } from '@/mocks/quotations.js';

function mapCategory(row) {
  if (!row) return row;
  return {
    id: row.id,
    label: row.label || row.nombre || '',
    nombre: row.label || row.nombre || '',
    sortOrder: row.sortOrder ?? row.orden ?? 0,
    active: row.active !== false,
  };
}

function slugify(label) {
  return String(label)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 64);
}

/** Categorías principales: API Nest o defaults + custom en mock store */
export const categoriesService = {
  async getAll() {
    if (!isMockMode) {
      const rows = await apiClient.get('categories', { token: authToken() });
      return (rows || []).map(mapCategory);
    }
    const custom = store.list('quotation_categories', { sort: 'orden,nombre' }).map(mapCategory);
    const defaults = QUOTATION_MAIN_CATEGORIES.map((row, i) => ({
      id: row.id,
      label: row.label,
      nombre: row.label,
      sortOrder: i + 1,
      active: true,
    }));
    const byId = new Map();
    for (const row of [...defaults, ...custom]) byId.set(row.id, row);
    return [...byId.values()].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || a.label.localeCompare(b.label));
  },

  async create(label) {
    const name = String(label || '').trim();
    if (name.length < 2) throw new Error('Escribe un nombre de categoría');
    if (!isMockMode) {
      return mapCategory(await apiClient.post('categories', { label: name }, { token: authToken() }));
    }
    const id = slugify(name) || `cat_${Date.now()}`;
    const exists = store.list('quotation_categories').some(
      (row) => row.id === id || (row.nombre || row.label || '').toLowerCase() === name.toLowerCase(),
    );
    if (exists || QUOTATION_MAIN_CATEGORIES.some((row) => row.id === id || row.label.toLowerCase() === name.toLowerCase())) {
      throw new Error('Ya existe una categoría con ese nombre');
    }
    const maxOrden = Math.max(0, ...store.list('quotation_categories').map((row) => Number(row.orden) || 0));
    return mapCategory(store.insert('quotation_categories', {
      id,
      nombre: name,
      label: name,
      orden: maxOrden + 1,
    }));
  },
};

export default categoriesService;
