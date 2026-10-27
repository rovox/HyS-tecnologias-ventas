import React, { useCallback, useEffect, useState } from 'react';
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle.js';
import { useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Inbox, Search, UserPlus, XCircle } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Layout from '@/components/Layout.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Input } from '@/components/ui/input.jsx';
import { StatusBadge } from '@/shared/views';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { Textarea } from '@/components/ui/textarea.jsx';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet.jsx';
import { useSolicitudesWeb } from '@/hooks/useSolicitudesWeb.js';
import { useRealtimeEntities } from '@/hooks/useRealtimeRefresh.js';

/** WEB-01: contact-form requests from hstecnologias.com, before they become clients. */
const ESTADOS = [
  { value: 'todas', label: 'Todas' },
  { value: 'nueva', label: 'Nuevas' },
  { value: 'contactada', label: 'Contactadas' },
  { value: 'convertida', label: 'Convertidas en cliente' },
  { value: 'descartada', label: 'Descartadas' },
];


const fecha = (value) => (value ? format(new Date(value), "d MMM yyyy, HH:mm", { locale: es }) : '—');

const EstadoBadge = ({ estado }) => <StatusBadge entity="lead" state={estado} />;

const SolicitudesWebPage = () => {
  useDocumentTitle('Solicitudes web');
  const navigate = useNavigate();
  const { rows, loading, error, fetchSolicitudes, updateSolicitud, convertSolicitud } = useSolicitudesWeb();
  const [estado, setEstado] = useState('nueva');
  const [q, setQ] = useState('');
  const [selected, setSelected] = useState(null);
  const [notas, setNotas] = useState('');
  const [busy, setBusy] = useState(false);

  const load = useCallback(() => fetchSolicitudes({ estado, q }), [fetchSolicitudes, estado, q]);

  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  // Realtime: a new website request (or a change from another session) refreshes the list.
  useRealtimeEntities(['solicitud_web'], () => load());

  const open = (row) => {
    setSelected(row);
    setNotas(row.notas || '');
  };

  const setEstadoSolicitud = async (nuevo, okMessage) => {
    setBusy(true);
    const row = await updateSolicitud(selected.id, { estado: nuevo, notas }, okMessage);
    setBusy(false);
    if (row) setSelected(row);
  };

  const guardarNotas = async () => {
    setBusy(true);
    const row = await updateSolicitud(selected.id, { notas }, 'Notas guardadas');
    setBusy(false);
    if (row) setSelected(row);
  };

  const convertir = async () => {
    setBusy(true);
    const res = await convertSolicitud(selected.id);
    setBusy(false);
    if (res?.client?.id) navigate(`/clientes/${res.client.id}`);
  };

  return (
    <Layout>

      <div className="content-container space-y-6 py-8 pb-24 w-full">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 w-full bg-card p-6 rounded-2xl border shadow-sm">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-3">
              <Inbox className="h-8 w-8 text-primary" /> Solicitudes web
            </h1>
            <p className="text-muted-foreground mt-2 font-medium max-w-prose">
              Requerimientos enviados desde el formulario de hstecnologias.com. Contáctalos y conviértelos en clientes cuando avancen.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, empresa, correo o teléfono..."
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9 bg-card border-border h-11 shadow-sm font-medium"
            />
          </div>
          <Select value={estado} onValueChange={setEstado}>
            <SelectTrigger className="bg-card h-11 shadow-sm font-bold text-muted-foreground">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              {ESTADOS.map((e) => (
                <SelectItem key={e.value} value={e.value} className="font-medium">{e.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Contacto</th>
                <th>Servicio</th>
                <th>Departamento</th>
                <th>Estado</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}><td colSpan="5"><Skeleton className="h-8 w-full rounded-md" /></td></tr>
                ))
              ) : error ? (
                <tr>
                  <td colSpan="5" className="py-16 text-center">
                    <div className="flex flex-col items-center text-destructive">
                      <AlertCircle className="h-10 w-10 mb-3 opacity-60" />
                      <p className="font-bold">{error}</p>
                    </div>
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-16 text-center text-muted-foreground">
                    No hay solicitudes con este filtro.
                  </td>
                </tr>
              ) : (
                rows.map((row) => (
                  <tr key={row.id} className="cursor-pointer hover:bg-muted" onClick={() => open(row)}>
                    <td className="whitespace-nowrap">{fecha(row.createdAt)}</td>
                    <td>
                      <button type="button" className="text-left font-bold text-foreground hover:text-primary focus-visible:underline" onClick={(e) => { e.stopPropagation(); open(row); }}>
                        {row.empresa || row.nombre}
                      </button>
                      <div className="text-sm text-muted-foreground">{row.empresa ? row.nombre : row.email}</div>
                    </td>
                    <td>{row.servicio || '—'}</td>
                    <td>{row.departamento || '—'}</td>
                    <td><EstadoBadge estado={row.estado} /></td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Sheet open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selected && (
            <>
              <SheetHeader>
                <SheetTitle>{selected.empresa || selected.nombre}</SheetTitle>
                <SheetDescription>Recibida el {fecha(selected.createdAt)}</SheetDescription>
                <div><EstadoBadge estado={selected.estado} /></div>
              </SheetHeader>

              <dl className="mt-6 grid grid-cols-1 gap-3 text-sm">
                <div><dt className="text-muted-foreground">Contacto</dt><dd className="font-medium">{selected.nombre}</dd></div>
                <div><dt className="text-muted-foreground">Correo</dt><dd>{selected.email ? <a className="text-primary underline" href={`mailto:${selected.email}`}>{selected.email}</a> : '—'}</dd></div>
                <div><dt className="text-muted-foreground">Teléfono / WhatsApp</dt><dd>{selected.telefono ? <a className="text-primary underline" href={`https://wa.me/591${selected.telefono.replace(/\D/g, '').slice(-8)}`} target="_blank" rel="noopener noreferrer">{selected.telefono}</a> : '—'}</dd></div>
                <div><dt className="text-muted-foreground">Servicio · Departamento</dt><dd>{selected.servicio || '—'} · {selected.departamento || '—'}</dd></div>
                <div><dt className="text-muted-foreground">Requerimiento</dt><dd className="whitespace-pre-wrap rounded-lg border border-border bg-muted p-3">{selected.detalle}</dd></div>
                {selected.pagina && <div><dt className="text-muted-foreground">Enviada desde</dt><dd className="break-all">{selected.pagina}</dd></div>}
              </dl>

              <div className="mt-6 space-y-2">
                <label htmlFor="sw-notas" className="text-sm font-medium">Notas internas</label>
                <Textarea id="sw-notas" value={notas} onChange={(e) => setNotas(e.target.value)} rows={4} placeholder="Ej.: llamado el lunes, pide visita técnica." />
                <Button variant="secondary" size="sm" disabled={busy} onClick={guardarNotas}>Guardar notas</Button>
              </div>

              <div className="mt-8 flex flex-col gap-3">
                {selected.estado === 'convertida' ? (
                  <Button className="min-h-11" onClick={() => navigate(`/clientes/${selected.clienteId}`)}>
                    <CheckCircle2 className="h-4 w-4 mr-2" /> Ver ficha del cliente
                  </Button>
                ) : (
                  <>
                    <Button className="min-h-11" disabled={busy} onClick={convertir}>
                      <UserPlus className="h-4 w-4 mr-2" /> Convertir en cliente
                    </Button>
                    {selected.estado !== 'contactada' && (
                      <Button variant="secondary" className="min-h-11" disabled={busy} onClick={() => setEstadoSolicitud('contactada', 'Marcada como contactada')}>
                        <CheckCircle2 className="h-4 w-4 mr-2" /> Marcar contactada
                      </Button>
                    )}
                    {selected.estado !== 'descartada' ? (
                      <Button variant="outline" className="min-h-11" disabled={busy} onClick={() => setEstadoSolicitud('descartada', 'Solicitud descartada')}>
                        <XCircle className="h-4 w-4 mr-2" /> Descartar
                      </Button>
                    ) : (
                      <Button variant="outline" className="min-h-11" disabled={busy} onClick={() => setEstadoSolicitud('nueva', 'Solicitud reabierta')}>
                        Reabrir
                      </Button>
                    )}
                  </>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </Layout>
  );
};

export default SolicitudesWebPage;
