import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Camera, Plus, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Layout from '@/components/Layout.jsx';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { ControlPanel, ListView, Money, RowQuickActions, StatusBadge, ToneTag, useListControls } from '@/shared/views';
import { cn } from '@/lib/utils';
import { downloadCsv } from '@/shared/lib/csv.js';
import { formatDay } from '@/shared/lib/format.js';
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle.js';
import { useVisits } from '../api.js';
import { PRIORIDAD, TIPO, VISIT_STATE, VISIT_TRANSITION } from '../constants.js';
import { VisitFormDialog } from '../components/VisitFormDialog.jsx';
import { VisitSheet } from '../components/VisitSheet.jsx';
import { useVisitActions } from '../components/useVisitActions.js';

const OPEN = ['programado', 'en_camino', 'en_atencion', 'pendiente'];
const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/La_Paz' });
const dayOf = (v) => String(v.fecha).slice(0, 10);
const isOpen = (v) => OPEN.includes(v.estado);
const late = (v) => isOpen(v) && dayOf(v) < today();
const urgent = (v) => isOpen(v) && ['urgente', 'alta'].includes(v.prioridad);
const unassigned = (v) => isOpen(v) && !v.tecnicoId;
const goBack = (v) => v.requiereVolver && v.estado !== 'cancelado';
/** The headline of a visit: what failed (asistencia) or what the client needs (relevamiento). */
const subject = (v) => v.motivo || v.problemaReportado || v.necesidadCliente || v.notas || '';

/**
 * Relevamientos y asistencias: who goes where and why, what was found and what was done. The next step is a button in
 * the row (Salir, Atender, Resolver…); the side panel has the whole visit, its photos, money and history.
 */
export default function SurveysPage() {
  const { currentUser, isSeguridad, isVentasLevel } = useAuth();
  const canEdit = isVentasLevel() || isSeguridad();
  const { data: visits = [], isLoading } = useVisits();
  const actions = useVisitActions();
  const [params, setParams] = useSearchParams();
  const [creating, setCreating] = useState(false);
  const openId = params.get('visita');
  const cotizacion = params.get('cotizacion');
  const cliente = params.get('cliente');
  useDocumentTitle('Relevamientos y asistencias');

  const setOpen = (id) =>
    setParams((p) => {
      const n = new URLSearchParams(p);
      if (id) n.set('visita', id);
      else n.delete('visita');
      return n;
    });

  // Opened from a quotation or a client: only their visits.
  const scoped = useMemo(
    () => visits.filter((v) => (!cotizacion || v.cotizacionId === cotizacion) && (!cliente || v.clienteId === cliente)),
    [visits, cotizacion, cliente],
  );

  const filters = useMemo(() => {
    const count = (test) => scoped.filter(test).length;
    return [
      { key: 'abiertas', label: 'Abiertas', section: 'Estado', tone: 'info', count: count(isOpen), test: isOpen },
      ...Object.entries(VISIT_STATE).map(([key, s]) => ({ key, label: s.label, section: 'Estado', count: count((v) => v.estado === key), test: (v) => v.estado === key })),
      { key: 'atrasadas', label: 'Atrasadas', section: 'Atención', tone: 'danger', count: count(late), test: late },
      { key: 'volver', label: 'Hay que volver', section: 'Atención', tone: 'danger', count: count(goBack), test: goBack },
      { key: 'sin_tecnico', label: 'Sin técnico', section: 'Atención', tone: 'danger', count: count(unassigned), test: unassigned },
      { key: 'urgentes', label: 'Urgentes o altas', section: 'Atención', tone: 'warning', count: count(urgent), test: urgent },
      { key: 'por_rendir', label: 'Cobro por rendir', section: 'Atención', tone: 'warning', count: count((v) => v.porRendir > 0), test: (v) => v.porRendir > 0 },
      ...Object.entries(TIPO).map(([key, t]) => ({ key, label: t.label, section: 'Tipo', test: (v) => v.tipoVisita === key })),
      { key: 'garantia', label: 'En garantía', section: 'Garantía', test: (v) => v.enGarantia === true },
      { key: 'mias', label: 'Mis visitas', section: 'Responsable', test: (v) => v.tecnicoId === currentUser?.id || v.vendedorId === currentUser?.id || v.usuarioId === currentUser?.id },
    ];
  }, [scoped, currentUser]);

  const { rows, groups, panel } = useListControls(scoped, {
    filters,
    groupOptions: [
      { key: 'estado', label: 'Estado', of: (v) => VISIT_STATE[v.estado]?.label },
      { key: 'tecnico', label: 'Técnico', of: (v) => v.tecnico?.name || 'Sin asignar' },
      { key: 'tipo', label: 'Tipo', of: (v) => TIPO[v.tipoVisita]?.label },
      { key: 'cliente', label: 'Cliente', of: (v) => v.cliente?.nombre },
    ],
    searchText: (v) => `${v.cliente?.nombre} ${v.lugar} ${v.tecnico?.name || ''} ${subject(v)} ${v.equipoAfectado} ${v.diagnostico || ''} ${v.cotizacion?.numero || ''}`,
  });

  // Default view: what is still open (a fresh visit to the page, without filters in the URL).
  useEffect(() => {
    if (!params.has('f') && !params.has('q') && !openId) panel.onToggleFilter('abiertas');
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const quick = (v) =>
    canEdit && (
      <RowQuickActions
        actions={v.transicionesValidas
          .filter((e) => e !== 'cancelado' && e !== 'programado')
          .map((estado) => {
            const t = VISIT_TRANSITION[estado];
            const needsPhoto = estado === 'resuelto' && v.fotos.length === 0;
            return {
              key: estado,
              icon: needsPhoto ? Camera : t.icon,
              label: needsPhoto ? 'Resolver: falta una foto (abrir la visita)' : t.label,
              tone: t.tone,
              disabled: actions.busy,
              onClick: () => (needsPhoto ? setOpen(v.id) : actions.change(v, estado)),
            };
          })}
      />
    );

  const columns = [
    {
      key: 'fecha',
      header: 'Fecha',
      cell: (v) => (
        <div className="whitespace-nowrap">
          <p className={cn(late(v) && 'font-semibold text-danger-fg')}>{formatDay(v.fecha)}</p>
          <p className="text-xs text-muted-foreground">{late(v) ? 'Atrasada' : v.hora || 'Sin hora'}</p>
        </div>
      ),
    },
    { key: 'tipo', header: 'Tipo', cell: (v) => <ToneTag tone="neutral" icon={TIPO[v.tipoVisita]?.icon}>{TIPO[v.tipoVisita]?.label}</ToneTag> },
    {
      key: 'cliente',
      header: 'Cliente y motivo',
      cell: (v) => (
        <div className="min-w-0">
          <p className="font-medium">{v.cliente?.nombre}</p>
          <p className="line-clamp-1 text-xs text-muted-foreground">{subject(v) || v.lugar}</p>
        </div>
      ),
    },
    { key: 'tecnico', header: 'Técnico', cell: (v) => (v.tecnico?.name || <span className={cn(unassigned(v) && 'font-semibold text-danger-fg')}>Sin asignar</span>) },
    { key: 'estado', header: 'Estado', cell: (v) => <StatusBadge entity="visit" state={v.estado} /> },
    {
      key: 'avisos',
      header: 'Avisos',
      cell: (v) => (
        <div className="flex flex-wrap gap-1">
          {urgent(v) && <ToneTag tone={PRIORIDAD[v.prioridad].tone}>{PRIORIDAD[v.prioridad].label}</ToneTag>}
          {goBack(v) && <ToneTag tone="danger">Volver</ToneTag>}
          {v.enGarantia && <ToneTag tone="success" icon={ShieldCheck}>Garantía</ToneTag>}
          {v.fotos.length > 0 && <ToneTag tone="neutral" icon={Camera}>{v.fotos.length}</ToneTag>}
        </div>
      ),
    },
    { key: 'cobrado', header: 'Cobrado', align: 'right', cell: (v) => (v.cobrado > 0 ? <Money value={v.cobrado} kind="in" /> : '—') },
    { key: 'acciones', header: '', cell: quick },
  ];

  const csv = [
    { header: 'Fecha', value: dayOf },
    { header: 'Hora', value: (v) => v.hora },
    { header: 'Tipo', value: (v) => TIPO[v.tipoVisita]?.label },
    { header: 'Cliente', value: (v) => v.cliente?.nombre },
    { header: 'Lugar', value: (v) => v.lugar },
    { header: 'Técnico', value: (v) => v.tecnico?.name },
    { header: 'Estado', value: (v) => VISIT_STATE[v.estado]?.label },
    { header: 'Motivo / necesidad', value: subject },
    { header: 'Diagnóstico', value: (v) => v.diagnostico },
    { header: 'Solución', value: (v) => v.solucion },
    { header: 'Cobrado Bs', value: (v) => Number(v.cobrado).toFixed(2) },
  ];

  const scopeLabel = cotizacion ? `de la cotización ${scoped[0]?.cotizacion?.numero || ''}` : cliente ? `de ${scoped[0]?.cliente?.nombre || 'un cliente'}` : null;

  return (
    <Layout>
      <ControlPanel
        breadcrumbs={[{ label: 'Relevamientos y asistencias', to: scopeLabel ? '/surveys' : undefined }, ...(scopeLabel ? [{ label: `Visitas ${scopeLabel}` }] : [])]}
        actions={canEdit && <Button onClick={() => setCreating(true)}><Plus /> Nueva visita</Button>}
        searchPlaceholder="Buscar cliente, lugar, técnico, motivo…"
        {...panel}
        onExport={() => downloadCsv('visitas.csv', csv, rows)}
        meta={`${rows.length} visitas`}
      />
      <div className="px-4 py-4 sm:px-6">
        <ListView
          columns={columns}
          rows={rows}
          groups={groups}
          loading={isLoading}
          tone={(v) => (late(v) || goBack(v) || unassigned(v) ? 'danger' : urgent(v) ? 'warning' : undefined)}
          onRowClick={(v) => setOpen(v.id)}
          empty="No hay visitas con estos filtros"
          renderCard={(v) => (
            <div className="space-y-1 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="font-semibold">{v.cliente?.nombre}</span>
                <StatusBadge entity="visit" state={v.estado} />
              </div>
              <p className="line-clamp-2 text-muted-foreground">{subject(v) || v.lugar}</p>
              <div className="flex items-center justify-between gap-2">
                <span className={cn('text-xs', late(v) && 'font-semibold text-danger-fg')}>
                  {formatDay(v.fecha)}{v.hora ? `, ${v.hora}` : ''}, {TIPO[v.tipoVisita]?.label}
                </span>
                {quick(v)}
              </div>
            </div>
          )}
        />
      </div>
      <VisitSheet visitId={openId} onClose={() => setOpen(null)} />
      <VisitFormDialog
        open={creating}
        onOpenChange={setCreating}
        defaults={cotizacion ? { cotizacionId: cotizacion } : cliente ? { clienteId: cliente } : undefined}
        onSaved={(v) => v?.id && setOpen(v.id)}
      />
    </Layout>
  );
}
