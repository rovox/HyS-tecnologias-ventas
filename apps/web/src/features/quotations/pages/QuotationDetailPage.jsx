import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { CalendarDays, ClipboardList, FolderKanban, MapPin, User } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import Layout from '@/components/Layout.jsx';
import { Chatter } from '@/features/activity';
import { ControlPanel, Field, FieldGrid, FormView, StatusBar } from '@/shared/views';
import { formatBs, formatDate, formatDateTime } from '@/shared/lib/format.js';
import { notify } from '@/shared/lib/notify.js';
import { useDocumentTitle } from '@/shared/lib/useDocumentTitle.js';
import { openQuotationFile, useQuotation } from '../api.js';
import { QUOTATION_FIELDS, formatQuotationValue, statusStages } from '../constants.js';
import { QuotationActions } from '../components/QuotationActions.jsx';
import { QuotationFormDialog } from '../components/QuotationFormDialog.jsx';
import { QuotationStateBadge } from '../components/QuotationStateBadge.jsx';
import { useQuotationActions } from '../components/useQuotationActions.js';

export default function QuotationDetailPage() {
  const { id } = useParams();
  const { data: quote, isLoading } = useQuotation(id);
  const actions = useQuotationActions();
  const [editing, setEditing] = useState(false);
  useDocumentTitle(quote?.numero || 'Cotización');

  if (isLoading || !quote) {
    return (
      <Layout>
        <div className="mx-auto max-w-6xl space-y-4 p-6">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-64 w-full" />
        </div>
      </Layout>
    );
  }

  const vista = quote.eliminadaAt || !['borrador', 'enviado'].includes(quote.estado) ? 'cerradas' : 'abiertas';
  const smartButtons = [
    quote.cliente && { key: 'cliente', icon: User, label: 'Cliente', value: quote.cliente.nombre, to: `/clientes/${quote.cliente.id}` },
    { key: 'relevamientos', icon: MapPin, label: 'Relevamientos', value: quote._count.relevamientos, to: '/surveys' },
    { key: 'tareas', icon: ClipboardList, label: 'Tareas', value: quote._count.tasks },
    quote.proyectoId && { key: 'proyecto', icon: FolderKanban, label: 'Proyecto', value: 'Ver en cronograma', to: '/schedule' },
  ].filter(Boolean);

  return (
    <Layout>
      <ControlPanel
        breadcrumbs={[
          { label: vista === 'abiertas' ? 'Cotizaciones' : 'Cotizaciones cerradas', to: `/quotations?vista=${vista}` },
          { label: quote.numero },
        ]}
      />
      <FormView
        actions={<QuotationActions quote={quote} onEdit={() => setEditing(true)} />}
        statusBar={
          <StatusBar
            stages={statusStages(quote.estado)}
            current={quote.estado}
            allowed={quote.transicionesValidas}
            onSelect={(estado) => actions.changeStatus(quote, estado)}
          />
        }
        smartButtons={smartButtons}
        subtitle={quote.numero}
        title={quote.titulo}
        badge={<QuotationStateBadge quote={quote} className="text-sm" />}
        chatter={<Chatter entity="quotation" id={quote.id} fieldLabels={QUOTATION_FIELDS} formatValue={formatQuotationValue} />}
      >
        {quote.eliminadaAt && (
          <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm" role="status">
            Eliminada el {formatDateTime(quote.eliminadaAt)} por {quote.eliminadaPor?.name || '—'}. Motivo: {quote.motivoEliminacion}
          </div>
        )}
        {quote.estado === 'rechazado' && quote.motivoRechazo && (
          <div className="rounded-md border border-border bg-muted/50 p-3 text-sm">Motivo del rechazo: {quote.motivoRechazo}</div>
        )}
        <FieldGrid>
          <Field label="Cliente">{quote.cliente?.nombre}</Field>
          <Field label="Monto">
            <span className="font-semibold">{formatBs(quote.monto)}</span>
          </Field>
          <Field label="Categoría">{quote.categoria?.label}</Field>
          <Field label="Subcategoría">{quote.subcategoria || null}</Field>
          <Field label="Sucursal">{quote.sucursal?.nombre}</Field>
          <Field label="Vendedor(es)">
            {quote.sellers.map((s) => `${s.nombre}${quote.sellers.length > 1 ? ` (${Number(s.commissionPct)} %)` : ''}`).join(', ')}
          </Field>
          <Field label="Creada">{formatDate(quote.createdAt)}</Field>
          <Field label="Enviada">{quote.fechaEnvio ? formatDate(quote.fechaEnvio) : null}</Field>
          <Field label="Vence">
            {quote.venceEl ? (
              <span className="inline-flex items-center gap-1"><CalendarDays className="h-4 w-4" /> {formatDate(quote.venceEl)}</span>
            ) : null}
          </Field>
          <Field label="Plazo de entrega">{quote.plazoFinal ? formatDate(quote.plazoFinal) : null}</Field>
          {quote.tieneLicitacion && <Field label="Licitación">{[quote.licitacionNumero, quote.licitacionEntidad].filter(Boolean).join(' · ') || 'Sí'}</Field>}
        </FieldGrid>
        {Array.isArray(quote.licitacionArchivos) && quote.licitacionArchivos.length > 0 && (
          <div className="space-y-1 text-sm">
            <p className="font-medium">Documentos de licitación</p>
            <ul className="list-inside list-disc text-primary">
              {quote.licitacionArchivos.map((doc) => (
                <li key={doc.url}>
                  <button type="button" className="hover:underline" onClick={() => openQuotationFile(doc.url).catch((e) => notify.error(e))}>
                    {doc.name}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}
        {quote.observacion && (
          <div className="space-y-1 text-sm">
            <p className="font-medium">Observación</p>
            <p className="whitespace-pre-wrap text-muted-foreground">{quote.observacion}</p>
          </div>
        )}
      </FormView>
      <QuotationFormDialog open={editing} onOpenChange={setEditing} quote={quote} />
    </Layout>
  );
}
