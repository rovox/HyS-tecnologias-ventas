import { NavLink } from 'react-router-dom';
import { cn } from '@/lib/utils';

/** Views of the commercial module: open and closed quotations, and the projects of the approved ones. */
const TABS = [
  { key: 'abiertas', label: 'Cotizaciones', to: '/quotations?vista=abiertas' },
  { key: 'cerradas', label: 'Cerradas', to: '/quotations?vista=cerradas' },
  { key: 'proyectos', label: 'Proyectos', to: '/projects' },
];

export function QuotationTabs({ current }) {
  return (
    <nav className="flex gap-1 border-b border-border bg-card px-4 sm:px-6" aria-label="Vistas de cotizaciones">
      {TABS.map((tab) => (
        <NavLink
          key={tab.key}
          to={tab.to}
          className={cn(
            '-mb-px border-b-2 px-3 py-2 text-sm font-medium',
            current === tab.key ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
          )}
        >
          {tab.label}
        </NavLink>
      ))}
    </nav>
  );
}
