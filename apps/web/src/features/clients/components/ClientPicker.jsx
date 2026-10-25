import { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useClientOptions } from '@/features/catalogs';
import { SearchSelect } from '@/shared/views';
import { ClientFormDialog } from './ClientFormDialog.jsx';

/** Searchable client select with "Nuevo cliente" (creates it and selects it). */
export function ClientPicker({ id, value, onChange, disabled }) {
  const [creating, setCreating] = useState(false);
  const { data: clients = [], isLoading } = useClientOptions();

  return (
    <div className="flex gap-2">
      <SearchSelect
        id={id}
        className="flex-1"
        value={value}
        onChange={onChange}
        disabled={disabled}
        loading={isLoading}
        placeholder="Selecciona un cliente"
        searchPlaceholder="Buscar cliente…"
        options={clients.map((c) => ({ value: c.id, label: c.nombre, hint: c.direccion || undefined, keywords: [c.contacto, c.telefono].filter(Boolean).join(' ') }))}
      />
      <Button type="button" variant="outline" size="icon" title="Nuevo cliente" aria-label="Nuevo cliente" className="h-9 min-h-9 w-9 min-w-9" disabled={disabled} onClick={() => setCreating(true)}>
        <Plus />
      </Button>
      <ClientFormDialog open={creating} onOpenChange={setCreating} onSaved={(client) => client?.id && onChange(client.id)} />
    </div>
  );
}
