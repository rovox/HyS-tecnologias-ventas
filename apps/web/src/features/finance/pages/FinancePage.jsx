import { useMemo, useState } from 'react';
import { NavLink, useSearchParams } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { ControlPanel, ListView, useListControls } from '@/shared/views';
import { downloadCsv } from '@/shared/lib/csv.js';
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle.js';
import { cn } from '@/lib/utils';
import { useMovements } from '../api.js';
import { CONCEPTO_LABEL, ESTADO, TIPO_LABEL } from '../constants.js';
import { CashBoxesView } from '../components/CashBoxesView.jsx';
import { MovementActions } from '../components/MovementActions.jsx';
import { MovementDialog } from '../components/MovementDialog.jsx';
import { MovementCard, movementColumns, movementCsv } from '../components/movementColumns.jsx';
import { ReceivablesView } from '../components/ReceivablesView.jsx';
import { ValidateDialog } from '../components/ValidateDialog.jsx';

/** Views of the one ledger (business-design §4.4): what the owner asked for are filters of the same movements. */
const VIEWS = [
  { key: 'movimientos', label: 'Movimientos', test: () => true },
  { key: 'por_validar', label: 'Por validar', test: (m) => ['por_validar', 'observado'].includes(m.estado), admin: true },
  { key: 'cajas', label: 'Cajas' },
  { key: 'por_cobrar', label: 'Por cobrar', commercial: true },
  { key: 'gastos', label: 'Gastos operativos', test: (m) => m.tipo === 'egreso' && !m.project },
  { key: 'reembolsos', label: 'Reembolsos', test: (m) => m.reembolsoPendiente },
];

const FILTERS = [
  ...Object.entries(TIPO_LABEL).map(([key, label]) => ({ key, label, section: 'Tipo', test: (m) => m.tipo === key })),
  ...Object.entries(ESTADO).map(([key, s]) => ({ key, label: s.label, section: 'Estado', test: (m) => m.estado === key })),
  { key: 'con_proyecto', label: 'De un proyecto', section: 'Origen', test: (m) => Boolean(m.project) },
];

const GROUPS = [
  { key: 'concepto', label: 'Concepto', of: (m) => CONCEPTO_LABEL[m.concepto] || m.concepto },
  { key: 'caja', label: 'Caja', of: (m) => m.caja?.nombre },
  { key: 'proyecto', label: 'Proyecto', of: (m) => m.project?.codigo },
  { key: 'registro', label: 'Registró', of: (m) => m.registradoPor?.name },
];

export default function FinancePage() {
  const { canManageMoney, readsAll } = useAuth();
  const [params] = useSearchParams();
  const views = VIEWS.filter((v) => (!v.admin || canManageMoney()) && (!v.commercial || readsAll()));
  const view = views.find((v) => v.key === params.get('vista')) || views[0];
  const { data: movements = [], isLoading } = useMovements();
  const [dialog, setDialog] = useState(null);
  const [validating, setValidating] = useState(null);
  useDocumentTitle('Finanzas');

  const inView = useMemo(() => (view.test ? movements.filter(view.test) : []), [movements, view]);
  const { rows, groups, panel } = useListControls(inView, {
    filters: FILTERS,
    groupOptions: GROUPS,
    searchText: (m) => `${CONCEPTO_LABEL[m.concepto] || ''} ${m.nota} ${m.project?.codigo || ''} ${m.cliente?.nombre || ''} ${m.registradoPor?.name || ''}`,
  });
  const actions = (m) => <MovementActions movement={m} onValidate={setValidating} onEdit={(mv) => setDialog({ movement: mv })} />;
  const columns = useMemo(() => movementColumns(actions), []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Layout>
      <nav className="flex gap-1 overflow-x-auto border-b border-border bg-card px-4 sm:px-6" aria-label="Vistas de finanzas">
        {views.map((v) => (
          <NavLink
            key={v.key}
            to={`/finanzas?vista=${v.key}`}
            className={cn('-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium', view.key === v.key ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')}
          >
            {v.label}
            {v.key === 'por_validar' && <span className="ml-1 text-xs text-muted-foreground">({movements.filter(v.test).length})</span>}
          </NavLink>
        ))}
      </nav>
      <ControlPanel
        breadcrumbs={[{ label: 'Finanzas' }, { label: view.label }]}
        actions={
          <>
            <Button onClick={() => setDialog({ tipo: 'egreso' })}>
              <Plus /> Registrar gasto
            </Button>
            {readsAll() && (
              <Button variant="outline" onClick={() => setDialog({ tipo: 'ingreso' })}>
                Otro ingreso
              </Button>
            )}
            {canManageMoney() && (
              <Button variant="outline" onClick={() => setDialog({ tipo: 'transferencia' })}>
                Transferencia
              </Button>
            )}
          </>
        }
        {...(view.test ? panel : {})}
        onExport={view.test ? () => downloadCsv(`finanzas-${view.key}.csv`, movementCsv, rows) : undefined}
        meta={view.test ? `${rows.length} movimientos` : undefined}
      />
      <div className="px-4 py-4 sm:px-6">
        {view.key === 'cajas' && <CashBoxesView />}
        {view.key === 'por_cobrar' && <ReceivablesView />}
        {view.test && (
          <ListView
            columns={columns}
            rows={rows}
            groups={groups}
            loading={isLoading}
            empty="No hay movimientos con estos filtros"
            renderCard={(m) => <MovementCard movement={m} actions={actions(m)} />}
          />
        )}
      </div>
      <MovementDialog tipo={dialog?.tipo || 'egreso'} movement={dialog?.movement} open={Boolean(dialog)} onOpenChange={(o) => !o && setDialog(null)} />
      <ValidateDialog movement={validating} onClose={() => setValidating(null)} />
    </Layout>
  );
}
