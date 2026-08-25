import { QUOTATION_MAIN_CATEGORIES } from '@/mocks/quotations.js';
import { apiClient, authToken, isMockMode } from '@/api/http.js';

/** Filtros de búsqueda en Cotizaciones. Mock: localStorage; API: servidor. */
const STORAGE_KEY = 'hs_quotation_filter_categories';

function defaults() {
  return QUOTATION_MAIN_CATEGORIES.map((row, i) => ({
    id: row.id,
    label: row.label,
    sortOrder: i + 1,
    builtin: true,
    active: true,
  }));
}

/** Solo las 3 principales (fijas). */
export function getMainCategories() {
  return defaults();
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

function readCustom() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((row) => row && row.id && row.label)
      .map((row, i) => ({
        id: String(row.id),
        label: String(row.label),
        sortOrder: Number(row.sortOrder) || i + 100,
        builtin: false,
        active: true,
      }));
  } catch {
    return [];
  }
}

function writeCustom(rows) {
  const custom = rows.filter((row) => !row.builtin);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(custom));
}

function mergeList() {
  const byId = new Map();
  for (const row of [...defaults(), ...readCustom()]) byId.set(row.id, row);
  return [...byId.values()].sort(
    (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0) || a.label.localeCompare(b.label),
  );
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
  /** Principales fijas + pseudo activas (API/mock). */
  async getAll() {
    if (!isMockMode) {
      const rows = await apiClient.get('categories', { token: authToken() });
      const custom = (rows || []).map(mapApiRow).filter((row) => row.active);
      return [...defaults(), ...custom.filter((c) => !defaults().some((d) => d.id === c.id))];
    }
    return mergeList();
  },

  /** Solo pseudo-categorías (no las 3 principales). */
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

    if (!isMockMode) {
      const row = await apiClient.post('categories', { label: name }, { token: authToken() });
      return mapApiRow(row);
    }

    const id = slugify(name) || `cat_${Date.now()}`;
    const current = mergeList();
    if (current.some((row) => row.id === id || row.label.toLowerCase() === name.toLowerCase())) {
      throw new Error('Ya existe una categoría con ese nombre');
    }
    const maxOrden = Math.max(0, ...current.map((row) => Number(row.sortOrder) || 0));
    const created = { id, label: name, sortOrder: maxOrden + 1, builtin: false, active: true };
    writeCustom([...readCustom(), created]);
    return created;
  },

  async remove(id) {
    const target = String(id || '');
    if (!target) throw new Error('Categoría no válida');
    if (QUOTATION_MAIN_CATEGORIES.some((m) => m.id === target) || defaults().some((row) => row.id === target)) {
      throw new Error('Las categorías principales no se pueden eliminar');
    }

    if (!isMockMode) {
      await apiClient.patch(`categories/${target}`, { active: false }, { token: authToken() });
      return true;
    }

    const prev = readCustom();
    const next = prev.filter((row) => row.id !== target);
    if (next.length === prev.length) {
      throw new Error('Categoría no encontrada');
    }
    writeCustom(next);
    return true;
  },
};

export default categoriesService;
