import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { COMMERCIAL_ROLES, ROLES } from '@/constants/roles.js';
import { useClientOptions, useUserDirectory } from '@/features/catalogs';
import { ClientPicker } from '@/features/clients';
import { LocationField, SearchSelect } from '@/shared/views';
import { cn } from '@/lib/utils';
import { formatDay } from '@/shared/lib/format.js';
import { notify } from '@/shared/lib/notify.js';
import { STATUS } from '@/shared/lib/status.js';
import { useClientJobs, useSaveVisit } from '../api.js';
import { PRIORIDAD, TIPO } from '../constants.js';

const today = () => new Date().toLocaleDateString('en-CA', { timeZone: 'America/La_Paz' });
const dayOf = (value) => (value ? String(value).slice(0, 10) : '');

const TEXTS = ['hora', 'lugar', 'mapsLink', 'motivo', 'problemaReportado', 'equipoAfectado', 'causaProbable', 'diagnostico', 'solucion',
  'necesidadCliente', 'areaRevisar', 'medidasPuntos', 'observacionTecnica', 'observacionFinal', 'notas'];
const FLAGS = ['requiereMaterial', 'requiereVolver', 'requiereCotizacion'];

const empty = (tipo, defaults = {}) => ({
  tipoVisita: tipo,
  clienteId: '',
  fecha: today(),
  prioridad: 'media',
  tecnicoId: '',
  vendedorId: '',
  trabajoRelacionadoId: '',
  garantiaHasta: '',
  cantidadEstimada: '',
  ...Object.fromEntries(TEXTS.map((k) => [k, ''])),
  ...Object.fromEntries(FLAGS.map((k) => [k, false])),
  ...defaults,
});

const fromVisit = (v) => ({
  ...empty(v.tipoVisita),
  ...Object.fromEntries(TEXTS.map((k) => [k, v[k] ?? ''])),
  ...Object.fromEntries(FLAGS.map((k) => [k, Boolean(v[k])])),
  tipoVisita: v.tipoVisita,
  clienteId: v.clienteId,
  fecha: dayOf(v.fecha),
  prioridad: v.prioridad,
  tecnicoId: v.tecnicoId || '',
  vendedorId: v.vendedorId || '',
  trabajoRelacionadoId: v.trabajoRelacionadoId || '',
  garantiaHasta: dayOf(v.garantiaHasta),
  cantidadEstimada: v.cantidadEstimada ?? '',
});

function Section({ title, children }) {
  return (
    <fieldset className="space-y-3 rounded-md border border-border p-3">
      <legend className="px-1 text-sm font-semibold">{title}</legend>
      {children}
    </fieldset>
  );
}

function Text({ id, label, value, onChange, area, placeholder }) {
  const Field = area ? Textarea : Input;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id}>{label}</Label>
      <Field id={id} rows={area ? 2 : undefined} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

function Flag({ id, label, checked, onChange }) {
  return (
    <label htmlFor={id} className="flex min-h-9 items-center gap-2 text-sm">
      <Checkbox id={id} checked={checked} onCheckedChange={(v) => onChange(Boolean(v))} />
      {label}
    </label>
  );
}

/**
 * New or edit visit. Asistencia (fix something: what failed, what was found, what was done, the job under warranty) and
 * relevamiento (see what the client needs before quoting) show their own part; the closing note is common. The money
 * taken on an asistencia is registered from the visit panel ("Registrar cobro"), in the ledger.
 */
export function VisitFormDialog({ open, onOpenChange, visit, defaults, onSaved }) {
  const { isSeguridad, isVentasLevel } = useAuth();
  const tecnico = isSeguridad();
  const { data: users = [] } = useUserDirectory();
  const { data: clients = [] } = useClientOptions();
  const save = useSaveVisit();
  const editing = Boolean(visit);
  const [form, setForm] = useState(() => (visit ? fromVisit(visit) : empty(tecnico ? 'asistencia' : 'relevamiento', defaults)));
  const { data: jobs = [] } = useClientJobs(form.tipoVisita === 'asistencia' ? form.clienteId : null);
  useEffect(() => {
    if (open) setForm(visit ? fromVisit(visit) : empty(tecnico ? 'asistencia' : 'relevamiento', defaults));
  }, [open, visit]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (patch) => setForm((f) => ({ ...f, ...patch }));
  const asistencia = form.tipoVisita === 'asistencia';
  // Opened from a quotation: the API takes the client (and branch) from it.
  const fromQuote = !editing && Boolean(form.cotizacionId);

  function pickClient(clienteId) {
    const client = clients.find((c) => c.id === clienteId);
    set({ clienteId, trabajoRelacionadoId: '', garantiaHasta: '', ...(client && !form.lugar ? { lugar: client.direccion || '', mapsLink: client.mapsLink || '' } : {}) });
  }

  async function submit(e) {
    e.preventDefault();
    if (!editing && !form.clienteId && !fromQuote) return notify.error('Selecciona el cliente');
    if (!form.lugar.trim()) return notify.error('Indica el lugar de la visita');
    const { clienteId, cantidadEstimada, ...rest } = form;
    const body = { ...rest, cantidadEstimada: cantidadEstimada === '' ? null : Number(cantidadEstimada) };
    if (tecnico) {
      delete body.tecnicoId;
      delete body.vendedorId;
    }
    if (!editing) {
      for (const k of Object.keys(body)) if (body[k] === '' || body[k] === null) delete body[k];
      body.clienteId = clienteId;
    }
    try {
      const saved = await save.mutateAsync({ id: visit?.id, ...body });
      notify.success(editing ? 'Visita actualizada' : asistencia ? 'Asistencia registrada' : 'Relevamiento registrado', {
        description: !form.tecnicoId && !tecnico ? 'Todavía no tiene técnico asignado' : undefined,
      });
      onOpenChange(false);
      onSaved?.(saved);
    } catch {
      /* shown by the query client */
    }
  }

  const people = (roles) => users.filter((u) => roles.includes(u.role)).map((u) => ({ value: u.id, label: u.name }));
  const jobOptions = jobs.map((j) => ({
    value: j.id,
    label: `${j.descripcionTrabajo} (${formatDay(j.fechaProgramada)})`,
    hint: [j.project?.codigo, STATUS.job[j.estado]?.label].filter(Boolean).join(', '),
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editing ? `Editar ${TIPO[form.tipoVisita].label.toLowerCase()}` : 'Nueva visita'}</DialogTitle>
          <DialogDescription>{editing ? visit.cliente?.nombre : 'Relevamiento: ver qué necesita el cliente. Asistencia: atender una falla o un pedido de soporte.'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <Section title="Visita">
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Tipo de visita">
              {Object.entries(TIPO).map(([key, t]) => (
                <Button key={key} type="button" role="radio" aria-checked={form.tipoVisita === key} variant={form.tipoVisita === key ? 'default' : 'outline'} onClick={() => set({ tipoVisita: key })}>
                  <t.icon /> {t.label}
                </Button>
              ))}
            </div>
            {fromQuote && <p className="text-sm text-muted-foreground">Visita de la cotización: el cliente es el de la cotización.</p>}
            {!editing && !fromQuote && (
              <div className="space-y-1.5">
                <Label>Cliente *</Label>
                <ClientPicker value={form.clienteId} onChange={pickClient} />
              </div>
            )}
            <div className="grid gap-2 sm:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="visit-fecha">Fecha *</Label>
                <Input id="visit-fecha" type="date" value={form.fecha} onChange={(e) => set({ fecha: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="visit-hora">Hora</Label>
                <Input id="visit-hora" type="time" value={form.hora} onChange={(e) => set({ hora: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="visit-prioridad">Prioridad</Label>
                <select id="visit-prioridad" className="h-9 w-full rounded-md border border-input bg-background px-2 text-sm" value={form.prioridad} onChange={(e) => set({ prioridad: e.target.value })}>
                  {Object.entries(PRIORIDAD).map(([key, p]) => <option key={key} value={key}>{p.label}</option>)}
                </select>
              </div>
            </div>
            {!tecnico && (
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="visit-tec" className={cn(!form.tecnicoId && 'text-danger-fg')}>Técnico{!form.tecnicoId && ' (sin asignar)'}</Label>
                  <SearchSelect id="visit-tec" value={form.tecnicoId} onChange={(tecnicoId) => set({ tecnicoId })} emptyOption="Sin asignar" searchPlaceholder="Buscar técnico…" options={people([ROLES.TEC])} />
                </div>
                {isVentasLevel() && (
                  <div className="space-y-1.5">
                    <Label htmlFor="visit-vend">Vendedor</Label>
                    <SearchSelect id="visit-vend" value={form.vendedorId} onChange={(vendedorId) => set({ vendedorId })} emptyOption="Sin vendedor" searchPlaceholder="Buscar vendedor…" options={people(COMMERCIAL_ROLES)} />
                  </div>
                )}
              </div>
            )}
            <LocationField id="visit-lugar" label="Lugar *" address={form.lugar} link={form.mapsLink} placeholder="Dirección del cliente" onChange={({ address, link }) => set({ lugar: address, mapsLink: link })} />
          </Section>

          {asistencia ? (
            <Section title="Asistencia: qué falló y qué se hizo">
              <div className="grid gap-2 sm:grid-cols-2">
                <Text id="visit-motivo" label="Motivo" value={form.motivo} onChange={(motivo) => set({ motivo })} placeholder="Ej. cámara sin imagen" />
                <Text id="visit-equipo" label="Equipo afectado" value={form.equipoAfectado} onChange={(equipoAfectado) => set({ equipoAfectado })} placeholder="Ej. DVR de 8 canales" />
              </div>
              <Text id="visit-problema" area label="Problema que reporta el cliente" value={form.problemaReportado} onChange={(problemaReportado) => set({ problemaReportado })} />
              <Text id="visit-causa" area label="Causa probable" value={form.causaProbable} onChange={(causaProbable) => set({ causaProbable })} />
              <Text id="visit-diag" area label="Diagnóstico técnico" value={form.diagnostico} onChange={(diagnostico) => set({ diagnostico })} />
              <Text id="visit-solucion" area label="Solución realizada" value={form.solucion} onChange={(solucion) => set({ solucion })} />
              <div className="flex flex-wrap gap-x-6">
                <Flag id="visit-mat" label="Requiere material" checked={form.requiereMaterial} onChange={(requiereMaterial) => set({ requiereMaterial })} />
                <Flag id="visit-volver" label="Hay que volver" checked={form.requiereVolver} onChange={(requiereVolver) => set({ requiereVolver })} />
              </div>
              <div className="grid gap-2 sm:grid-cols-[2fr_1fr]">
                <div className="space-y-1.5">
                  <Label htmlFor="visit-trabajo">Trabajo que se revisa (garantía)</Label>
                  <SearchSelect
                    id="visit-trabajo"
                    value={form.trabajoRelacionadoId}
                    onChange={(trabajoRelacionadoId) => set({ trabajoRelacionadoId, garantiaHasta: '' })}
                    emptyOption="Ninguno"
                    placeholder={form.clienteId ? 'Buscar trabajo del cliente…' : 'Elige primero el cliente'}
                    disabled={!form.clienteId}
                    searchPlaceholder="Buscar trabajo…"
                    options={jobOptions}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="visit-garantia">Garantía hasta</Label>
                  <Input id="visit-garantia" type="date" value={form.garantiaHasta} onChange={(e) => set({ garantiaHasta: e.target.value })} />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">
                Si eliges el trabajo, la garantía se calcula sola: la del proyecto desde su entrega, o 12 meses desde que terminó un trabajo suelto.
              </p>
            </Section>
          ) : (
            <Section title="Relevamiento: qué necesita el cliente">
              <Text id="visit-necesidad" area label="Necesidad del cliente" value={form.necesidadCliente} onChange={(necesidadCliente) => set({ necesidadCliente })} />
              <div className="grid gap-2 sm:grid-cols-[2fr_1fr]">
                <Text id="visit-area" label="Área a revisar" value={form.areaRevisar} onChange={(areaRevisar) => set({ areaRevisar })} placeholder="Ej. depósito y patio" />
                <div className="space-y-1.5">
                  <Label htmlFor="visit-cant">Cámaras o puntos</Label>
                  <Input id="visit-cant" type="number" min="0" step="1" value={form.cantidadEstimada} onChange={(e) => set({ cantidadEstimada: e.target.value })} />
                </div>
              </div>
              <Text id="visit-medidas" area label="Medidas / puntos requeridos" value={form.medidasPuntos} onChange={(medidasPuntos) => set({ medidasPuntos })} />
              <Text id="visit-obs-tec" area label="Observación técnica" value={form.observacionTecnica} onChange={(observacionTecnica) => set({ observacionTecnica })} />
              <Flag id="visit-cot" label="Requiere cotización" checked={form.requiereCotizacion} onChange={(requiereCotizacion) => set({ requiereCotizacion })} />
            </Section>
          )}

          <Section title="Cierre">
            <Text id="visit-final" area label="Observación final" value={form.observacionFinal} onChange={(observacionFinal) => set({ observacionFinal })} placeholder="Lo que el cliente debe saber, lo que queda pendiente…" />
          </Section>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
            <Button type="submit" disabled={save.isPending}>{editing ? 'Guardar cambios' : 'Registrar visita'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
