import { useRef } from 'react';
import { FileText, Pencil, RotateCcw, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { notify } from '@/shared/lib/notify.js';
import { openQuotationFile, useAttachQuotationFile } from '../api.js';
import { TRANSITION_LABEL } from '../constants.js';
import { useQuotationActions } from './useQuotationActions.js';

/** Header buttons of a quotation: only what the API allows for its current state. */
export function QuotationActions({ quote, onEdit }) {
  const actions = useQuotationActions();
  const attach = useAttachQuotationFile();
  const fileInput = useRef(null);
  const deleted = Boolean(quote.eliminadaAt);

  const upload = async (file) => {
    if (!file) return;
    try {
      await attach.mutateAsync({ id: quote.id, file });
      notify.success('PDF adjuntado');
    } catch {
      /* shown by the query client */
    }
  };

  return (
    <>
      {quote.transicionesValidas.map((estado) => (
        <Button
          key={estado}
          size="sm"
          variant={estado === 'aprobado' || estado === 'enviado' ? 'default' : estado === 'rechazado' ? 'destructive' : 'outline'}
          disabled={actions.busy}
          onClick={() => actions.changeStatus(quote, estado)}
        >
          {TRANSITION_LABEL[estado]}
        </Button>
      ))}
      {!deleted && (
        <Button size="sm" variant="outline" onClick={onEdit}>
          <Pencil /> Editar
        </Button>
      )}
      {!deleted && (
        <>
          <Button size="sm" variant="outline" disabled={attach.isPending} onClick={() => fileInput.current?.click()}>
            <Upload /> {quote.archivoPdfUrl ? 'Reemplazar PDF' : 'Adjuntar PDF'}
          </Button>
          <input ref={fileInput} type="file" accept="application/pdf" hidden onChange={(e) => upload(e.target.files?.[0])} />
        </>
      )}
      {quote.archivoPdfUrl && (
        <Button size="sm" variant="ghost" onClick={() => openQuotationFile(quote.archivoPdfUrl).catch((e) => notify.error(e))}>
          <FileText /> Ver PDF
        </Button>
      )}
      {quote.puedeEliminar && (
        <Button size="sm" variant="ghost" className="text-destructive" disabled={actions.busy} onClick={() => actions.deleteQuote(quote)}>
          <Trash2 /> Eliminar
        </Button>
      )}
      {deleted && (
        <Button size="sm" variant="outline" disabled={actions.busy} onClick={() => actions.restoreQuote(quote)}>
          <RotateCcw /> Restaurar
        </Button>
      )}
    </>
  );
}
