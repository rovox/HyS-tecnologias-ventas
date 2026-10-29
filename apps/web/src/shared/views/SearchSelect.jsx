import { useState } from 'react';
import { Check, ChevronsUpDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

/**
 * Combobox with search for any list that can grow (clients, products, projects, jobs, users).
 * options: [{ value, label, hint?, keywords? }] · value · onChange(value | '') · `emptyOption` adds a "none" choice
 * (e.g. "Sin asignar") that also clears; `emptyText` says why nothing matches. The popover is modal so it works inside
 * dialogs.
 */
export function SearchSelect({
  id,
  options = [],
  value,
  onChange,
  placeholder = 'Selecciona…',
  searchPlaceholder = 'Buscar…',
  emptyOption,
  emptyText = 'Sin resultados',
  loading,
  disabled,
  className,
  invalid,
  'aria-label': ariaLabel,
}) {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value);
  const pick = (v) => {
    onChange(v);
    setOpen(false);
  };

  return (
    <Popover modal open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          type="button"
          variant="outline"
          role="combobox"
          aria-label={ariaLabel}
          aria-expanded={open}
          disabled={disabled}
          className={cn('h-9 min-h-9 w-full justify-between px-3 font-normal', invalid && 'border-danger', className)}
        >
          <span className={cn('truncate text-left', !selected && 'text-muted-foreground')}>
            {selected ? selected.label : loading ? 'Cargando…' : emptyOption || placeholder}
          </span>
          <span className="flex shrink-0 items-center gap-1">
            {selected && !disabled && (
              <X
                role="button"
                aria-label="Quitar selección"
                className="h-4 w-4 opacity-60 hover:opacity-100"
                onPointerDown={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onChange('');
                }}
              />
            )}
            <ChevronsUpDown className="h-4 w-4 opacity-50" />
          </span>
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[max(var(--radix-popover-trigger-width),16rem)] p-0" align="start">
        <Command>
          <CommandInput placeholder={searchPlaceholder} />
          <CommandList>
            <CommandEmpty>{emptyText}</CommandEmpty>
            <CommandGroup>
              {emptyOption && (
                <CommandItem value={`__none ${emptyOption}`} onSelect={() => pick('')}>
                  <Check className={cn('h-4 w-4', !value ? 'opacity-100' : 'opacity-0')} />
                  <span className="text-muted-foreground">{emptyOption}</span>
                </CommandItem>
              )}
              {options.map((o) => (
                <CommandItem key={o.value} value={`${o.label} ${o.hint || ''} ${o.keywords || ''} ${o.value}`} onSelect={() => pick(o.value)}>
                  <Check className={cn('h-4 w-4 shrink-0', value === o.value ? 'opacity-100' : 'opacity-0')} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate">{o.label}</span>
                    {o.hint && <span className="block truncate text-xs text-muted-foreground">{o.hint}</span>}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
