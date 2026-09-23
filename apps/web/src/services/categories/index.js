import { QUOTATION_MAIN_CATEGORIES } from '@/constants/quotations.js';
import { apiClient, authToken } from '@/api/http.js';

function defaults() {
  return QUOTATION_MAIN_CATEGORIES.map((row, i) => ({
    id: row.id,
    label: row.label,
    sortOrder: i + 1,
    builtin: true,
    active: true,
  }));
}

function slugify(label) {
  return String(label)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .slice(0, 64);
}

function mapApiRow(row) {
  return {
    id: row.id,
    label: row.label,
    sortOrder: Number(row.sortOrder) || 0,
    builtin: false,
    active: row.active !== false,
  };
}

export const categoriesService = {
  async getAll() {
    const rows = await apiClient.get('categories', { token: authToken() });
    const custom = (rows || []).map(mapApiRow).filter((row) => row.active);
    return [...defaults(), ...custom.filter((c) => !defaults().some((d) => d.id === c.id))];
  },

  async getPseudo() {
    const all = await this.getAll();
    return all.filter((row) => !row.builtin && !QUOTATION_MAIN_CATEGORIES.some((m) => m.id === row.id));
  },

  async create(label) {
    const name = String(label || '').trim();
    if (name.length < 2) throw new Error('Escribe un nombre de categoría');
    if (QUOTATION_MAIN_CATEGORIES.some((m) => m.label.toLowerCase() === name.toLowerCase() || m.id === slugify(name))) {
      throw new Error('No se pueden crear categorías principales');
    }
    const row = await apiClient.post('categories', { label: name }, { token: authToken() });
    return mapApiRow(row);
  },

  async remove(id) {
    const target = String(id || '');
    if (!target) throw new Error('Categoría no válida');
    if (QUOTATION_MAIN_CATEGORIES.some((m) => m.id === target) || defaults().some((row) => row.id === target)) {
      throw new Error('Las categorías principales no se pueden eliminar');
    }
    await apiClient.patch(`categories/${target}`, { active: false }, { token: authToken() });
    return true;
  },
};

export default categoriesService;
