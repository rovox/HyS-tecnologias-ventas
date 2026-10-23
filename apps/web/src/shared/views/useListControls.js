import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';

const normalize = (text) =>
  String(text ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

/**
 * State of a ControlPanel kept in the URL (shareable, survives reloads): search text, active filters and group-by.
 * filters: [{ key, label, section?, test(row) }] — filters of the same section are OR-ed, sections are AND-ed.
 * groupOptions: [{ key, label, of(row) → group label }]. searchText(row) → the text the search box looks into.
 */
export function useListControls(rows, { filters = [], groupOptions = [], searchText }) {
  const [params, setParams] = useSearchParams();
  const search = params.get('q') || '';
  const activeFilters = (params.get('f') || '').split(',').filter(Boolean);
  const groupBy = params.get('g') || null;

  const update = (patch) =>
    setParams((prev) => {
      const next = new URLSearchParams(prev);
      for (const [key, value] of Object.entries(patch)) {
        if (value) next.set(key, value);
        else next.delete(key);
      }
      return next;
    }, { replace: true });

  const visible = useMemo(() => {
    const term = normalize(search.trim());
    const active = filters.filter((f) => activeFilters.includes(f.key));
    const sections = [...new Set(active.map((f) => f.section || ''))];
    return rows.filter(
      (row) =>
        (!term || normalize(searchText(row)).includes(term)) &&
        sections.every((s) => active.filter((f) => (f.section || '') === s).some((f) => f.test(row))),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rows, search, activeFilters.join(','), filters]);

  const groups = useMemo(() => {
    const option = groupOptions.find((g) => g.key === groupBy);
    if (!option) return null;
    const map = new Map();
    for (const row of visible) {
      const label = option.of(row) || 'Sin definir';
      if (!map.has(label)) map.set(label, []);
      map.get(label).push(row);
    }
    return [...map.entries()].map(([label, list]) => ({ key: label, label, rows: list }));
  }, [visible, groupBy, groupOptions]);

  return {
    rows: visible,
    groups,
    panel: {
      search,
      onSearch: (q) => update({ q }),
      filters,
      activeFilters,
      onToggleFilter: (key) =>
        update({ f: (activeFilters.includes(key) ? activeFilters.filter((k) => k !== key) : [...activeFilters, key]).join(',') }),
      groupOptions,
      groupBy,
      onGroupBy: (g) => update({ g }),
    },
  };
}
