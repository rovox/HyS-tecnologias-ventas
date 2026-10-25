import { Plus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUserDirectory } from '@/features/catalogs';
import { SearchSelect } from '@/shared/views';

const COMMERCIAL = ['ADMINISTRADOR', 'VENTAS / ADMINISTRACIÓN'];

/** Sellers of a quotation: one by default (100 %); with several, the commissions must add up to 100 %. */
export function SellersField({ value, onChange, disabled }) {
  const { data: users = [] } = useUserDirectory();
  const options = users.filter((u) => COMMERCIAL.includes(u.role));
  const total = value.reduce((sum, row) => sum + (Number(row.commissionPct) || 0), 0);
  const set = (index, patch) => onChange(value.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  return (
    <div className="space-y-2">
      {value.map((row, index) => (
        <div key={index} className="flex items-center gap-2">
          <SearchSelect
            className="flex-1"
            value={row.userId}
            disabled={disabled}
            placeholder="Selecciona vendedor"
            searchPlaceholder="Buscar vendedor…"
            onChange={(userId) => set(index, { userId, nombre: options.find((u) => u.id === userId)?.name || '' })}
            options={options.map((u) => ({ value: u.id, label: u.name }))}
          />
          {value.length > 1 && (
            <>
              <Input
                type="number"
                min="0"
                max="100"
                className="w-20"
                aria-label="Comisión %"
                value={row.commissionPct}
                disabled={disabled}
                onChange={(e) => set(index, { commissionPct: e.target.value })}
              />
              <span className="text-sm text-muted-foreground">%</span>
              <Button type="button" variant="ghost" size="icon" disabled={disabled} onClick={() => onChange(value.filter((_, i) => i !== index))}>
                <X />
              </Button>
            </>
          )}
        </div>
      ))}
      <div className="flex items-center justify-between">
        <Button type="button" variant="ghost" size="sm" disabled={disabled} onClick={() => onChange([...value, { userId: '', nombre: '', commissionPct: 0 }])}>
          <Plus /> Co-vendedor
        </Button>
        {value.length > 1 && (
          <span className={Math.abs(total - 100) > 0.05 ? 'text-xs text-destructive' : 'text-xs text-muted-foreground'}>
            Total comisiones: {total} %
          </span>
        )}
      </div>
    </div>
  );
}
