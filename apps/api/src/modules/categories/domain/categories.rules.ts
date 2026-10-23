// Categories: the 3 divisions are the mandatory category of quotations, jobs, projects and products (owner,
// 2026-10-22). Other categories are subcategory chips created by users. Pure TS, no Nest, no Prisma.

export const DIVISIONS = [
  { id: 'computo_comunicacion', label: 'Cómputo y comunicación', sortOrder: 1 },
  { id: 'seguridad_electronica', label: 'Seguridad electrónica', sortOrder: 2 },
  { id: 'cableado_estructurado', label: 'Cableado estructurado', sortOrder: 3 },
] as const;

type CategoryRow = { principal: boolean; active: boolean } | null | undefined;

const DIVISION_NAMES = DIVISIONS.map((d) => d.label).join(', ');

/** Why a category cannot classify a record, or null when it is one of the active divisions. */
export function divisionError(row: CategoryRow): string | null {
  if (!row) return `Selecciona la categoría: ${DIVISION_NAMES}`;
  if (!row.principal || !row.active) return `La categoría debe ser una de las principales: ${DIVISION_NAMES}`;
  return null;
}

/** Divisions are fixed: they cannot be created, renamed or deactivated from the app. */
export function chipChangeError(row: CategoryRow): string | null {
  return row?.principal ? 'Las categorías principales no se pueden modificar' : null;
}
