import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

/** The confirmation dialog itself, loaded the first time a confirmation is asked (GATE-01): see confirm.jsx. */
export default function ConfirmDialog({ request, reason, setReason, close }) {
  const needsReason = Boolean(request?.reason);
  const canConfirm = !needsReason || reason.trim().length > 0;
  const effects = [request?.effect].flat().filter(Boolean);
  return (
    <Dialog open={Boolean(request)} onOpenChange={(open) => !open && close({ ok: false })}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{request?.title}</DialogTitle>
          {request?.description && <DialogDescription>{request.description}</DialogDescription>}
        </DialogHeader>
        {request?.details?.length > 0 && (
          <dl className="divide-y divide-border rounded-md border border-border bg-muted/40 text-sm">
            {request.details.filter(([, v]) => v !== undefined && v !== null && v !== '').map(([label, value]) => (
              <div key={label} className="grid grid-cols-[8.5rem_1fr] gap-2 px-3 py-1.5">
                <dt className="text-muted-foreground">{label}</dt>
                <dd className="min-w-0 break-words font-medium text-foreground">{value}</dd>
              </div>
            ))}
          </dl>
        )}
        {effects.length > 0 && (
          <ul
            className={cn(
              'space-y-1 rounded-md border px-3 py-2 text-sm',
              request?.destructive ? 'border-danger-border bg-danger-soft text-danger-fg' : 'border-info-border bg-info-soft text-info-fg',
            )}
          >
            {effects.map((e) => (
              <li key={e} className="flex gap-2">
                <ArrowRight className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
                <span>{e}</span>
              </li>
            ))}
          </ul>
        )}
        {needsReason && (
          <div className="space-y-2">
            <Label htmlFor="confirm-reason">{request.reason} *</Label>
            {request.reasonOptions?.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {request.reasonOptions.map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setReason(option)}
                    className={cn(
                      'rounded-md border px-2 py-1 text-xs font-medium',
                      reason === option ? 'border-primary bg-primary text-primary-foreground' : 'border-border hover:bg-muted',
                    )}
                  >
                    {option}
                  </button>
                ))}
              </div>
            )}
            <Textarea id="confirm-reason" autoFocus value={reason} onChange={(e) => setReason(e.target.value)} rows={3} />
          </div>
        )}
        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => close({ ok: false })}>
            Cancelar
          </Button>
          <Button
            variant={request?.destructive ? 'destructive' : request?.tone === 'success' ? 'success' : 'default'}
            disabled={!canConfirm}
            onClick={() => close({ ok: true, reason: reason.trim() || undefined })}
          >
            {request?.confirmLabel || 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
