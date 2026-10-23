import { useState } from 'react';
import { Check, ChevronsUpDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import ClientFormModal from '@/components/ClientFormModal.jsx';
import { useClientOptions } from '../api.js';
import { cn } from '@/lib/utils';

/** Searchable client select with "Nuevo cliente" (creates it and selects it). */
export function ClientPicker({ value, onChange, disabled }) {
  const [open, setOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const { data: clients = [], isLoading } = useClientOptions();
  const selected = clients.find((c) => c.id === value);

  return (
    <div className="flex gap-2">
      <Popover modal open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button type="button" variant="outline" role="combobox" disabled={disabled} className="flex-1 justify-between font-normal">
            <span className={cn('truncate', !selected && 'text-muted-foreground')}>
              {selected?.nombre || (isLoading ? 'Cargando…' : 'Selecciona un cliente')}
            </span>
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[var(--radix-popover-trigger-width)] p-0" align="start">
          <Command>
            <CommandInput placeholder="Buscar cliente…" />
            <CommandList>
              <CommandEmpty>Sin resultados</CommandEmpty>
              <CommandGroup>
                {clients.map((c) => (
                  <CommandItem
                    key={c.id}
                    value={`${c.nombre} ${c.id}`}
                    onSelect={() => {
                      onChange(c.id);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn(value === c.id ? 'opacity-100' : 'opacity-0')} />
                    {c.nombre}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      <Button type="button" variant="outline" size="icon" title="Nuevo cliente" disabled={disabled} onClick={() => setCreating(true)}>
        <Plus />
      </Button>
      <ClientFormModal
        isOpen={creating}
        onClose={() => setCreating(false)}
        onSuccess={(client) => {
          setCreating(false);
          if (client?.id) onChange(client.id);
        }}
      />
    </div>
  );
}
