import { Link } from 'react-router-dom';
import { ChevronRight, Download, Filter, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { TONE } from '@/shared/lib/status.js';

/**
 * Odoo-style control panel on top of every list: breadcrumb, main actions, search with active filter facets,
 * filter menu (toggle filters + one "group by"), view switcher and CSV export.
 *
 * filters: [{ key, label, section?, count?, tone? }] · activeFilters: string[] · onToggleFilter(key)
 *   `count` shows how many records the filter matches; `tone` colours it (e.g. 'danger' for "Sin técnico").
 * groupOptions: [{ key, label }] · groupBy · onGroupBy(key | null)
 * views: [{ key, label, icon: Component }] · view · onViewChange(key)
 */
export function ControlPanel({
  breadcrumbs = [],
  actions,
  search,
  onSearch,
  searchPlaceholder = 'Buscar…',
  filters = [],
  activeFilters = [],
  onToggleFilter,
  groupOptions = [],
  groupBy = null,
  onGroupBy,
  views = [],
  view,
  onViewChange,
  onExport,
  meta,
}) {
  const facets = filters.filter((f) => activeFilters.includes(f.key));
  const groupLabel = groupOptions.find((g) => g.key === groupBy)?.label;
  const sections = [...new Set(filters.map((f) => f.section || ''))];

  return (
    <div className="border-b border-border bg-card px-4 py-3 sm:px-6 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <nav aria-label="Ruta" className="flex min-w-0 items-center gap-1 text-lg">
          {breadcrumbs.map((crumb, i) => {
            const last = i === breadcrumbs.length - 1;
            return (
              <span key={crumb.label} className="flex min-w-0 items-center gap-1">
                {i > 0 && <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
                {crumb.to && !last ? (
                  <Link to={crumb.to} className="truncate text-primary hover:underline">
                    {crumb.label}
                  </Link>
                ) : (
                  <span className={cn('truncate', last ? 'font-semibold text-foreground' : 'text-muted-foreground')}>
                    {crumb.label}
                  </span>
                )}
              </span>
            );
          })}
        </nav>
        {meta && <span className="text-sm text-muted-foreground">{meta}</span>}
      </div>

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <div className="flex flex-wrap gap-2">{actions}</div>

        {onSearch && (
          <div className="flex min-h-10 flex-1 flex-wrap items-center gap-1 rounded-md border border-input bg-background px-2 lg:mx-4">
            <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
            {facets.map((f) => (
              <span key={f.key} className="inline-flex items-center gap-1 rounded-md border border-info-border bg-info-soft px-2 py-0.5 text-xs font-semibold text-info-fg">
                <Filter className="h-3 w-3" />
                {f.label}
                {f.count != null && <span className="tabular-nums">({f.count})</span>}
                <button type="button" aria-label={`Quitar ${f.label}`} onClick={() => onToggleFilter(f.key)}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {groupLabel && (
              <span className="inline-flex items-center gap-1 rounded-md border border-progress-border bg-progress-soft px-2 py-0.5 text-xs font-semibold text-progress-fg">
                Agrupar: {groupLabel}
                <button type="button" aria-label="Quitar agrupación" onClick={() => onGroupBy(null)}>
                  <X className="h-3 w-3" />
                </button>
              </span>
            )}
            <input
              type="search"
              value={search}
              onChange={(e) => onSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Escape' && search && (e.preventDefault(), onSearch(''))}
              placeholder={searchPlaceholder}
              aria-label="Buscar"
              className="min-w-[8rem] flex-1 bg-transparent py-2 text-sm outline-none [&::-webkit-search-cancel-button]:hidden"
            />
            {search && (
              <button
                type="button"
                title="Borrar el texto (Esc)"
                onClick={() => onSearch('')}
                className="inline-flex h-7 shrink-0 items-center gap-1 rounded-md px-2 text-xs font-semibold text-muted-foreground hover:bg-danger-soft hover:text-danger-fg"
              >
                <X className="h-4 w-4" /> Borrar
              </button>
            )}
          </div>
        )}

        <div className="flex items-center gap-2">
          {(filters.length > 0 || groupOptions.length > 0) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter /> Filtros
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                {sections.map((section) => (
                  <div key={section || 'default'}>
                    {section && <DropdownMenuLabel>{section}</DropdownMenuLabel>}
                    {filters
                      .filter((f) => (f.section || '') === section)
                      .map((f) => (
                        <DropdownMenuCheckboxItem
                          key={f.key}
                          checked={activeFilters.includes(f.key)}
                          onCheckedChange={() => onToggleFilter(f.key)}
                          onSelect={(e) => e.preventDefault()}
                        >
                          <span className="flex-1">{f.label}</span>
                          {f.count != null && (
                            <span className={cn('ml-2 rounded px-1.5 text-xs font-semibold tabular-nums', f.count > 0 && f.tone ? TONE[f.tone].badge : 'text-muted-foreground')}>
                              {f.count}
                            </span>
                          )}
                        </DropdownMenuCheckboxItem>
                      ))}
                    <DropdownMenuSeparator />
                  </div>
                ))}
                {groupOptions.length > 0 && (
                  <>
                    <DropdownMenuLabel>Agrupar por</DropdownMenuLabel>
                    {groupOptions.map((g) => (
                      <DropdownMenuCheckboxItem
                        key={g.key}
                        checked={groupBy === g.key}
                        onCheckedChange={() => onGroupBy(groupBy === g.key ? null : g.key)}
                      >
                        {g.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
          {onExport && (
            <Button variant="outline" size="sm" onClick={onExport} title="Exportar CSV">
              <Download /> <span className="hidden sm:inline">Exportar</span>
            </Button>
          )}
          {views.length > 1 && (
            <div className="flex rounded-md border border-input" role="tablist" aria-label="Vista">
              {views.map(({ key, label, icon: Icon }) => (
                <button
                  key={key}
                  type="button"
                  role="tab"
                  aria-selected={view === key}
                  title={label}
                  onClick={() => onViewChange(key)}
                  className={cn(
                    'flex h-9 w-9 items-center justify-center first:rounded-l-md last:rounded-r-md',
                    view === key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted',
                  )}
                >
                  <Icon className="h-4 w-4" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
