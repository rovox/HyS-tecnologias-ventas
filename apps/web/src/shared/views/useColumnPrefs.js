import { useMemo, useState } from 'react';

const storageKey = (id) => `hs-columns:${id}`;
/** Row actions (a column without a header, or marked `fixed`) are not chosen: they stay last. */
const isFixed = (c) => c.fixed || !c.header;

function read(id) {
  if (!id) return null;
  try {
    const saved = JSON.parse(window.localStorage.getItem(storageKey(id)) || 'null');
    return saved && Array.isArray(saved.order) && Array.isArray(saved.hidden) ? saved : null;
  } catch {
    return null; // Private window or blocked storage: the default columns still work.
  }
}

function write(id, prefs) {
  try {
    if (prefs) window.localStorage.setItem(storageKey(id), JSON.stringify(prefs));
    else window.localStorage.removeItem(storageKey(id));
  } catch {
    /* Not saved in this browser; the change still applies until the page is closed. */
  }
}

/**
 * Which columns a list shows and in what order, remembered per list in this browser (LIST-01). `id` names the list;
 * without it the columns stay as declared. A column with `fixed: true` (row actions) cannot be hidden or moved and
 * stays last; so does a column without a header. Columns added later appear at the end of a saved order.
 */
export function useColumnPrefs(id, columns) {
  const [prefs, setPrefs] = useState(() => read(id));

  const ordered = useMemo(() => {
    const movable = columns.filter((c) => !isFixed(c));
    const fixed = columns.filter(isFixed);
    if (!prefs) return [...movable, ...fixed];
    const byKey = new Map(movable.map((c) => [c.key, c]));
    const known = prefs.order.filter((k) => byKey.has(k)).map((k) => byKey.get(k));
    const added = movable.filter((c) => !prefs.order.includes(c.key));
    return [...known, ...added, ...fixed];
  }, [columns, prefs]);

  const hidden = new Set(prefs?.hidden || []);
  const save = (next) => {
    setPrefs(next);
    write(id, next);
  };
  const keys = () => ordered.filter((c) => !isFixed(c)).map((c) => c.key);

  return {
    columns: ordered.filter((c) => isFixed(c) || !hidden.has(c.key)),
    menu: id
      ? {
          items: ordered.filter((c) => !isFixed(c)).map((c) => ({ key: c.key, label: c.menuLabel || c.header || c.key, visible: !hidden.has(c.key) })),
          toggle: (key) => {
            const next = hidden.has(key) ? [...hidden].filter((k) => k !== key) : [...hidden, key];
            // At least one column stays visible.
            if (next.length >= keys().length) return;
            save({ order: keys(), hidden: next });
          },
          move: (key, delta) => {
            const order = keys();
            const from = order.indexOf(key);
            const to = from + delta;
            if (from < 0 || to < 0 || to >= order.length) return;
            [order[from], order[to]] = [order[to], order[from]];
            save({ order, hidden: [...hidden] });
          },
          reset: () => save(null),
          customized: Boolean(prefs),
        }
      : null,
  };
}
