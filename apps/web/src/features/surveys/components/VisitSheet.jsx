import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Camera, HandCoins, Pencil, ShieldAlert, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { Chatter } from '@/features/activity';
import { useUserDirectory } from '@/features/catalogs';
import { IncomeDialog } from '@/features/finance';
import { Field, FieldGrid, LocationLink, Money, StatusBadge, ToneTag } from '@/shared/views';
import { cn } from '@/lib/utils';
import { formatBs, formatDay } from '@/shared/lib/format.js';
import { notify } from '@/shared/lib/notify.js';
import { STATUS } from '@/shared/lib/status.js';
import { usePhoto, useUploadVisitPhoto, useVisit } from '../api.js';
import { PRIORIDAD, TIPO, VISIT_FIELDS, VISIT_STATE, VISIT_TRANSITION } from '../constants.js';
import { VisitFormDialog } from './VisitFormDialog.jsx';
import { useVisitActions } from './useVisitActions.js';

function Photo({ url }) {
  const { data: src, isLoading, isError } = usePhoto(url);
  if (isLoading) return <Skeleton className="aspect-square w-full" />;
  if (isError) return <div className="grid aspect-square place-content-center rounded-md border border-danger-border bg-danger-soft p-2 text-center text-xs text-danger-fg">No se pudo cargar</div>;
  return (
    <a href={src} target="_blank" rel="noreferrer" title="Abrir foto">
      <img src={src} alt="Foto de la visita" className="aspect-square w-full rounded-md border border-border object-cover" />
    </a>
  );
}

/** Text fields shown only when filled, under their label. */
function Texts({ visit, fields }) {
  const filled = fields.filter(([key]) => visit[key]);
  if (!filled.length) return <p className="text-sm text-muted-foreground">Sin datos todavía: usa Editar para completarlos.</p>;
  return (
    <dl className="space-y-2 text-sm">
      {filled.map(([key, label]) => (
        <div key={key}>
          <dt className="text-xs text-muted-foreground">{label}</dt>
          <dd className="whitespace-pre-wrap">{visit[key]}</dd>
        </div>
      ))}
    </dl>
  );
}

const ASISTENCIA = [['motivo', 'Motivo'], ['equipoAfectado', 'Equipo afectado'], ['problemaReportado', 'Problema reportado'], ['causaProbable', 'Causa probable'], ['diagnostico', 'Diagnóstico'], ['solucion', 'Solución']];
const RELEVAMIENTO = [['necesidadCliente', 'Necesidad del cliente'], ['areaRevisar', 'Área a revisar'], ['cantidadEstimada', 'Cámaras o puntos'], ['medidasPuntos', 'Medidas / puntos'], ['observacionTecnica', 'Observación técnica']];

/** Everything about one visit in a side panel: next step, the form's data, photos, money taken and the history. */
export function VisitSheet({ visitId, onClose }) {
  const { isSeguridad, isVentasLevel, readsAll } = useAuth();
  const canEdit = isVentasLevel() || isSeguridad();
  const { data: visit, isLoading } = useVisit(visitId);
  const { data: users = [] } = useUserDirectory();
  const actions = useVisitActions();
  const upload = useUploadVisitPhoto();
  const fileInput = useRef(null);
  const [editing, setEditing] = useState(false);
  const [paying, setPaying] = useState(false);

  const nameOf = (id) => users.find((u) => u.id === id)?.name;
  const formatValue = (field, value) => {
    if (field === 'estado') return VISIT_STATE[value]?.label;
    if (field === 'tecnicoId' || field === 'vendedorId') return value ? nameOf(value) : 'Sin asignar';
    if (field === 'tipoVisita') return TIPO[value]?.label;
    if (field === 'prioridad') return PRIORIDAD[value]?.label;
    if (typeof value === 'boolean') return value ? 'Sí' : 'No';
    return undefined;
  };

  async function addPhoto(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      await upload.mutateAsync({ id: visit.id, file });
      notify.success('Foto agregada', { description: visit.estado === 'en_atencion' ? 'Ya puede marcar la visita como resuelta.' : undefined });
    } catch {
      /* shown by the query client */
    }
  }

  const closed = visit && ['resuelto', 'cancelado'].includes(visit.estado);
  const editable = visit && (isVentasLevel() || (isSeguridad() && !closed));
  const asistencia = visit?.tipoVisita === 'asistencia';
  const warranty = visit?.enGarantia;

  return (
    <Sheet open={Boolean(visitId)} onOpenChange={(o) => !o && onClose()}>
      <SheetContent className="w-full space-y-4 overflow-y-auto sm:max-w-lg">
        {isLoading || !visit ? (
          <Skeleton className="h-64 w-full" />
        ) : (
          <>
            <SheetHeader>
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <StatusBadge entity="visit" state={visit.estado} />
                <ToneTag tone="neutral" icon={TIPO[visit.tipoVisita]?.icon}>{TIPO[visit.tipoVisita]?.label}</ToneTag>
                {visit.prioridad !== 'media' && <ToneTag tone={PRIORIDAD[visit.prioridad]?.tone}>{`Prioridad ${PRIORIDAD[visit.prioridad]?.label.toLowerCase()}`}</ToneTag>}
                {visit.requiereVolver && !closed && <ToneTag tone="danger">Hay que volver</ToneTag>}
              </div>
              <SheetTitle>{visit.cliente?.nombre}</SheetTitle>
              <SheetDescription>{visit.motivo || visit.necesidadCliente || visit.lugar}</SheetDescription>
            </SheetHeader>

            {canEdit && (
              <div className="flex flex-wrap gap-2">
                {visit.transicionesValidas.map((estado) => {
                  const t = VISIT_TRANSITION[estado];
                  const blocked = estado === 'resuelto' && visit.fotos.length === 0;
                  return (
                    <Button
                      key={estado}
                      size="sm"
                      variant={t.tone === 'success' ? 'success' : t.tone === 'danger' ? 'ghost' : 'default'}
                      className={cn(t.tone === 'danger' && 'text-danger-fg')}
                      disabled={actions.busy || blocked}
                      title={blocked ? 'Sube una foto de evidencia para resolver' : undefined}
                      onClick={() => actions.change(visit, estado)}
                    >
                      <t.icon /> {t.label}
                    </Button>
                  );
                })}
                {editable && (
                  <Button size="sm" variant="outline" onClick={() => setEditing(true)}>
                    <Pencil /> Editar
                  </Button>
                )}
                {!closed && (
                  <Button size="sm" variant="outline" disabled={upload.isPending} onClick={() => fileInput.current?.click()}>
                    <Camera /> {upload.isPending ? 'Subiendo…' : 'Agregar foto'}
                  </Button>
                )}
                {asistencia && visit.estado !== 'cancelado' && (
                  <Button size="sm" variant="outline" onClick={() => setPaying(true)}>
                    <HandCoins /> Registrar cobro
                  </Button>
                )}
                <input ref={fileInput} type="file" accept="image/*" capture="environment" className="hidden" onChange={addPhoto} aria-label="Foto de evidencia" />
              </div>
            )}
            {visit.transicionesValidas.includes('resuelto') && visit.fotos.length === 0 && (
              <p className="rounded-md border border-warning-border bg-warning-soft px-3 py-2 text-xs font-medium text-warning-fg">Para resolver la visita, primero agrega una foto de evidencia.</p>
            )}
            {visit.estado === 'cancelado' && visit.motivoCancelacion && (
              <p className="rounded-md border border-border bg-muted px-3 py-2 text-sm">Cancelada: {visit.motivoCancelacion}</p>
            )}

            <FieldGrid className="sm:grid-cols-1">
              <Field label="Fecha">{formatDay(visit.fecha)}{visit.fechaFin && visit.fechaFin !== visit.fecha ? `, terminada el ${formatDay(visit.fechaFin)}` : ''}</Field>
              <Field label="Hora">{visit.hora || 'Sin hora'}</Field>
              <Field label="Técnico"><span className={cn(!visit.tecnico && 'font-semibold text-danger-fg')}>{visit.tecnico?.name || 'Sin asignar'}</span></Field>
              {visit.vendedor && <Field label="Vendedor">{visit.vendedor.name}</Field>}
              <Field label="Lugar"><LocationLink address={visit.lugar} link={visit.mapsLink} /></Field>
              {visit.cliente?.telefono && <Field label="Teléfono"><a className="text-primary hover:underline" href={`tel:${visit.cliente.telefono}`}>{visit.cliente.telefono}</a></Field>}
              {visit.cotizacion && (
                <Field label="Cotización">
                  {readsAll() ? <Link className="text-primary hover:underline" to={`/quotations/${visit.cotizacion.id}`}>{visit.cotizacion.numero}</Link> : visit.cotizacion.numero}
                </Field>
              )}
              {visit.trabajoRelacionado && (
                <Field label="Trabajo revisado">
                  {visit.trabajoRelacionado.descripcionTrabajo}
                  <span className="block text-xs text-muted-foreground">
                    {formatDay(visit.trabajoRelacionado.fechaProgramada)}, {STATUS.job[visit.trabajoRelacionado.estado]?.label}
                    {visit.trabajoRelacionado.project ? `, proyecto ${visit.trabajoRelacionado.project.codigo}` : ''}
                  </span>
                </Field>
              )}
              {visit.garantiaHasta && (
                <Field label="Garantía">
                  <ToneTag tone={warranty ? 'success' : 'danger'} icon={warranty ? ShieldCheck : ShieldAlert}>
                    {warranty ? `En garantía hasta ${formatDay(visit.garantiaHasta)}` : `Venció el ${formatDay(visit.garantiaHasta)}`}
                  </ToneTag>
                </Field>
              )}
              {asistencia && visit.cobrado > 0 && (
                <Field label="Cobrado">
                  <Money value={visit.cobrado} kind="in" />
                  {visit.porRendir > 0 && <span className="block text-xs font-medium text-warning-fg">{formatBs(visit.porRendir)} por rendir (falta validar en caja)</span>}
                </Field>
              )}
            </FieldGrid>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold">{asistencia ? 'Qué falló y qué se hizo' : 'Qué necesita el cliente'}</h3>
              <Texts visit={visit} fields={asistencia ? ASISTENCIA : RELEVAMIENTO} />
              <div className="flex flex-wrap gap-2">
                {visit.requiereMaterial && <ToneTag tone="warning">Requiere material</ToneTag>}
                {visit.requiereCotizacion && <ToneTag tone="info">Requiere cotización</ToneTag>}
              </div>
              {visit.observacionFinal && <Texts visit={visit} fields={[['observacionFinal', 'Observación final']]} />}
            </section>

            <section className="space-y-2">
              <h3 className="text-sm font-semibold">Fotos ({visit.fotos.length})</h3>
              {visit.fotos.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin fotos.</p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {visit.fotos.map((url) => <Photo key={url} url={url} />)}
                </div>
              )}
            </section>

            {visit.movements.length > 0 && (
              <section className="space-y-2">
                <h3 className="text-sm font-semibold">Cobros</h3>
                <ul className="space-y-1 text-sm">
                  {visit.movements.map((m) => (
                    <li key={m.id} className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
                      <span>
                        {formatDay(m.fecha)}, {m.metodo || 'sin método'}
                        <span className="block text-xs text-muted-foreground">Lo tiene {m.recibidoPor?.name}</span>
                      </span>
                      <span className="flex items-center gap-2">
                        <Money value={m.monto} kind="in" />
                        <StatusBadge entity="movement" state={m.estado} />
                      </span>
                    </li>
                  ))}
                </ul>
              </section>
            )}

            <Chatter entity="relevamiento" id={visit.id} fieldLabels={VISIT_FIELDS} formatValue={formatValue} />
            <VisitFormDialog open={editing} onOpenChange={setEditing} visit={visit} />
            <IncomeDialog target={{ kind: 'visit', id: visit.id, title: `la asistencia a ${visit.cliente?.nombre}` }} open={paying} onOpenChange={setPaying} />
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
