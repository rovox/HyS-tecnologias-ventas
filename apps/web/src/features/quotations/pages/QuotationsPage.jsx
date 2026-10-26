import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Kanban, List, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { useCategories } from '@/features/catalogs';
import { ControlPanel, KanbanView, ListView, useListControls } from '@/shared/views';
import { downloadCsv } from '@/shared/lib/csv.js';
import { formatBs } from '@/shared/lib/format.js';
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle.js';
import { useQuotations } from '../api.js';
import { QUOTATION_STATE, displayState } from '../constants.js';
import { QuotationFormDialog } from '../components/QuotationFormDialog.jsx';
import { QuotationTabs } from '../components/QuotationTabs.jsx';
import { QuotationCard, daysLeft, quotationColumns, quotationCsv } from '../components/quotationColumns.jsx';

const VIEWS = [
  { key: 'list', label: 'Lista', icon: List },
  { key: 'kanban', label: 'Kanban', icon: Kanban },
];

function buildFilters(vista, divisions, userId) {
  const states = vista === 'abiertas' ? ['borrador', 'enviado'] : ['aprobado', 'rechazado', 'vencido', 'eliminada'];
  return [
    ...states.map((s) => ({ key: s, label: QUOTATION_STATE[s].label, section: 'Estado', test: (q) => displayState(q) === s })),
    ...divisions.map((d) => ({ key: d.id, label: d.label, section: 'Categoría', test: (q) => q.categoriaId === d.id })),
    { key: 'mias', label: 'Mis cotizaciones', section: 'Responsable', test: (q) => q.sellers?.some((s) => s.userId === userId) },
    ...(vista === 'abiertas'
      ? [{ key: 'por_vencer', label: 'Vencen en 3 días o menos', section: 'Plazo', test: (q) => (daysLeft(q) ?? 99) <= 3 }]
      : []),
  ];
}

const GROUPS = [
  { key: 'estado', label: 'Estado', of: (q) => QUOTATION_STATE[displayState(q)].label },
  { key: 'categoria', label: 'Categoría', of: (q) => q.categoria?.label },
  { key: 'vendedor', label: 'Vendedor', of: (q) => q.vendedor?.name },
  { key: 'cliente', label: 'Cliente', of: (q) => q.cliente?.nombre },
];

export default function QuotationsPage() {
  const [params, setParams] = useSearchParams();
  const vista = params.get('vista') === 'cerradas' ? 'cerradas' : 'abiertas';
  const view = vista === 'abiertas' && params.get('view') === 'kanban' ? 'kanban' : 'list';
  const navigate = useNavigate();
  const { currentUser, isVentasLevel } = useAuth();
  const { data: categories } = useCategories();
  const { data: quotes = [], isLoading } = useQuotations(vista);
  const [creating, setCreating] = useState(false);
  useDocumentTitle(vista === 'abiertas' ? 'Cotizaciones' : 'Cotizaciones cerradas');

  const filters = useMemo(() => buildFilters(vista, categories?.divisions || [], currentUser?.id), [vista, categories, currentUser]);
  const { rows, groups, panel } = useListControls(quotes, {
    filters,
    groupOptions: GROUPS,
    searchText: (q) => `${q.numero} ${q.titulo} ${q.cliente?.nombre || ''} ${q.subcategoria}`,
  });
  const open = (q) => navigate(`/quotations/${q.id}`);
  const total = rows.reduce((sum, q) => sum + Number(q.monto), 0);

  return (
    <Layout>
      <QuotationTabs current={vista} />
      <ControlPanel
        breadcrumbs={[{ label: vista === 'abiertas' ? 'Cotizaciones' : 'Cotizaciones cerradas' }]}
        actions={
          vista === 'abiertas' && isVentasLevel() && (
            <Button onClick={() => setCreating(true)}>
              <Plus /> Nueva
            </Button>
          )
        }
        searchPlaceholder="Buscar por número, título, cliente…"
        {...panel}
        views={vista === 'abiertas' ? VIEWS : []}
        view={view}
        onViewChange={(v) => setParams((p) => { const n = new URLSearchParams(p); n.set('view', v); return n; }, { replace: true })}
        onExport={() => downloadCsv(`cotizaciones-${vista}.csv`, quotationCsv, rows)}
        meta={`${rows.length} cotizaciones — total ${formatBs(total)}`}
      />
      <div className="px-4 py-4 sm:px-6">
        {view === 'list' ? (
          <ListView
            columns={quotationColumns}
            rows={rows}
            groups={groups}
            loading={isLoading}
            onRowClick={open}
            empty="No hay cotizaciones con estos filtros"
            renderCard={(q) => <QuotationCard quote={q} />}
          />
        ) : (
          <KanbanView
            columns={['borrador', 'enviado'].map((estado) => {
              const items = rows.filter((q) => q.estado === estado);
              return { key: estado, label: QUOTATION_STATE[estado].label, items, footer: formatBs(items.reduce((s, q) => s + Number(q.monto), 0)) };
            })}
            onCardClick={open}
            renderCard={(q) => <QuotationCard quote={q} />}
          />
        )}
      </div>
      <QuotationFormDialog open={creating} onOpenChange={setCreating} onSaved={(q) => q?.id && navigate(`/quotations/${q.id}`)} />
    </Layout>
  );
}
