import { useEffect } from 'react';

/** Page title (replaces react-helmet, docs/rules/frontend.md). */
export function useDocumentTitle(title) {
  useEffect(() => {
    document.title = title ? `${title} · H&S Tecnologías` : 'H&S Tecnologías';
  }, [title]);
}
