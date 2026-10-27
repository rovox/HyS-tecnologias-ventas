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
import { useCustody, useMovements } from '../api.js';
import { CONCEPTO_LABEL, ESTADO, TIPO_LABEL } from '../constants.js';
import { CashBoxesView } from '../components/CashBoxesView.jsx';
import { CustodyView } from '../components/CustodyView.jsx';
import { MovementActions } from '../components/MovementActions.jsx';
import { MovementDialog } from '../components/MovementDialog.jsx';
import { MovementSheet } from '../components/MovementSheet.jsx';
import { MovementCard, movementColumns, movementCsv, movementSummary } from '../components/movementColumns.jsx';
import { ReceivablesView } from '../components/ReceivablesView.jsx';
import { ValidateDialog } from '../components/ValidateDialog.jsx';
import { useMovementActions } from '../components/useMovementActions.js';

const waiting = (m) => ['por_validar', 'observado'].includes(m.estado);

/**
 * Views of the one ledger (business-design §4.4). "Gastos operativos" is a filter of the Libro; the inbox is where
 * Gerencia and Contabilidad validate (✓) or observe (✗) in one click.
 */
const VIEWS = [
  { key: 'movimientos', label: 'Libro', test: () => true },
  { key: 'por_validar', label: 'Bandeja de rendición', test: waiting, manager: true, count: true },
  { key: 'por_rendir', label: 'Por rendir', reader: true },
  { key: 'cajas', label: 'Cajas' },
  { key: 'por_cobrar', label: 'Por cobrar', reader: true },
  { key: 'reembolsos', label: 'Reembolsos', test: (m) => m.reembolsoPendiente },
];

const TONE_OF_STATE = { por_validar: 'warning', observado: 'danger', validado: 'success', anulado: 'neutral' };

const GROUPS = [
  { key: 'concepto', label: 'Concepto', of: (m) => CONCEPTO_LABEL[m.concepto] || m.concepto },
  { key: 'caja', label: 'Caja', of: (m) => m.caja?.nombre },
  { key: 'proyecto', label: 'Proyecto', of: (m) => m.project?.codigo },
  { key: 'registro', label: 'Registró', of: (m) => m.registradoPor?.name },
  { key: 'tiene', label: 'Tiene el dinero', of: (m) => (m.tipo === 'ingreso' && m.estado === 'por_validar' ? m.recibidoPor?.name : null) },
];

export default function FinancePage() {
  const { canManageMoney, readsAll } = useAuth();
  const [params, setParams] = useSearchParams();
  const views = VIEWS.filter((v) => (!v.manager || canManageMoney()) && (!v.reader || readsAll()));
  const view = views.find((v) => v.key === params.get('vista')) || views[0];
  const { data: movements = [], isLoading } = useMovements();
  const { data: custody = [] } = useCustody(readsAll());
  const [dialog, setDialog] = useState(null);
  const [validating, setValidating] = useState(null);
  const openId = params.get('mov');
  const openMovement = (id) => setParams((p) => { const n = new URLSearchParams(p); n.set('mov', id); return n; });
  const closeMovement = () => setParams((p) => { const n = new URLSearchParams(p); n.delete('mov'); return n; });
  const actions = useMovementActions({ onEdit: (m) => setDialog({ movement: m }), onChooseBox: setValidating });
  useDocumentTitle('Finanzas');

  const inView = useMemo(() => (view.test ? movements.filter(view.test) : []), [movements, view]);
  const filters = useMemo(
    () => [
      ...Object.entries(ESTADO).map(([key, s]) => ({
        key,
        label: s.label,
        section: 'Estado',
        tone: TONE_OF_STATE[key],
        count: inView.filter((m) => m.estado === key).length,
        test: (m) => m.estado === key,
      })),
      ...Object.entries(TIPO_LABEL).map(([key, label]) => ({ key, label, section: 'Tipo', test: (m) => m.tipo === key })),
      { key: 'gastos', label: 'Gastos operativos (sin proyecto)', section: 'Origen', test: (m) => m.tipo === 'egreso' && !m.project },
      { key: 'con_proyecto', label: 'De un proyecto', section: 'Origen', test: (m) => Boolean(m.project) },
    ],
    [inView],
  );
  const { rows, groups, panel } = useListControls(inView, {
    filters,
    groupOptions: GROUPS,
    searchText: (m) => `${CONCEPTO_LABEL[m.concepto] || ''} ${m.nota} ${m.project?.codigo || ''} ${m.cliente?.nombre || ''} ${m.registradoPor?.name || ''} ${m.recibidoPor?.name || ''}`,
  });
  const quick = view.key === 'por_validar';
  const rowActions = (m) => <MovementActions movement={m} actions={actions} quick={quick} />;
  const columns = useMemo(() => movementColumns(rowActions), [quick, actions]); // eslint-disable-line react-hooks/exhaustive-deps
  const countOf = (v) => (v.key === 'por_rendir' ? custody.reduce((s, p) => s + p.cantidad, 0) : v.count ? movements.filter(v.test).length : 0);

  return (
    <Layout>
      <nav className="flex gap-1 overflow-x-auto border-b border-border bg-card px-4 sm:px-6" aria-label="Vistas de finanzas">
        {views.map((v) => {
          const n = countOf(v);
          return (
            <NavLink
              key={v.key}
              to={`/finanzas?vista=${v.key}`}
              className={cn('-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm font-medium', view.key === v.key ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground')}
            >
              {v.label}
              {n > 0 && <span className="ml-1.5 rounded-full bg-warning px-1.5 py-0.5 text-xs font-bold text-warning-foreground">{n}</span>}
            </NavLink>
          );
        })}
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
        {quick && rows.length > 0 && (
          <ul className="mb-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
            <li><span className="font-bold text-success-fg">✓</span> Valida en la caja de su sucursal</li>
            <li><span className="font-bold text-danger-fg">✗</span> Lo observa: vuelve a quien lo registró</li>
            <li>Clic en la fila: detalle e historial</li>
          </ul>
        )}
        {view.key === 'cajas' && <CashBoxesView />}
        {view.key === 'por_cobrar' && <ReceivablesView />}
        {view.key === 'por_rendir' && <CustodyView actions={actions} onOpen={openMovement} />}
        {view.test && (
          <ListView
            id="finanzas-movimientos"
            columns={columns}
            rows={rows}
            summary={movementSummary}
            groups={groups}
            loading={isLoading}
            tone={(m) => (m.estado === 'observado' ? 'danger' : m.estado === 'por_validar' ? 'warning' : undefined)}
            onRowClick={(m) => openMovement(m.id)}
            empty={quick ? 'Nada por validar' : 'No hay movimientos con estos filtros'}
            renderCard={(m) => <MovementCard movement={m} actions={rowActions(m)} />}
          />
        )}
      </div>
      <MovementSheet movementId={openId} actions={actions} onClose={closeMovement} />
      <MovementDialog tipo={dialog?.tipo || 'egreso'} movement={dialog?.movement} open={Boolean(dialog)} onOpenChange={(o) => !o && setDialog(null)} />
      <ValidateDialog movement={validating} onClose={() => setValidating(null)} />
    </Layout>
  );
}
