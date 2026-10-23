import { Wallet } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { formatBs } from '@/shared/lib/format.js';
import { useCashBoxes } from '../api.js';

/** Validated money per box (incomes − expenses ± transfers). */
export function CashBoxesView() {
  const { data: boxes = [], isLoading } = useCashBoxes();
  if (isLoading) return <Skeleton className="h-24 w-full" />;
  const total = boxes.reduce((sum, b) => sum + b.saldo, 0);
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {boxes.map((b) => (
          <div key={b.id} className="rounded-md border border-border bg-card p-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Wallet className="h-4 w-4" /> {b.nombre}
            </div>
            <p className="mt-2 text-2xl font-semibold">{formatBs(b.saldo)}</p>
            <p className="text-xs text-muted-foreground">{b.sucursal?.nombre}</p>
          </div>
        ))}
      </div>
      <p className="text-right text-sm">
        Total en cajas: <span className="font-semibold">{formatBs(total)}</span>
      </p>
    </div>
  );
}
