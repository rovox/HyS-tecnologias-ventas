import { ExternalLink, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

/** Link to open: the saved link (Google Maps, Waze, WhatsApp location…) or a map search for the address. */
function locationHref(address, link) {
  if (link) return /^https?:\/\//i.test(link) ? link : `https://${link}`;
  return address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}` : null;
}

/** Address + optional location link, for any form with a place. value: { address, link }. */
export function LocationField({ id, label = 'Lugar', address, link, onChange, placeholder = 'Dirección o referencia' }) {
  return (
    <div className="space-y-2">
      <div className="space-y-1.5">
        <Label htmlFor={`${id}-address`}>{label}</Label>
        <Input id={`${id}-address`} value={address || ''} placeholder={placeholder} onChange={(e) => onChange({ address: e.target.value, link })} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor={`${id}-link`}>
          Link de ubicación <span className="font-normal text-muted-foreground">(opcional: Maps, Waze, WhatsApp…)</span>
        </Label>
        <Input
          id={`${id}-link`}
          type="url"
          inputMode="url"
          value={link || ''}
          placeholder="https://maps.app.goo.gl/…"
          onChange={(e) => onChange({ address, link: e.target.value })}
        />
      </div>
    </div>
  );
}

/** Address with an "Abrir ubicación" button (uses the link when there is one). */
export function LocationLink({ address, link }) {
  const href = locationHref(address, link);
  if (!address && !link) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      <span className="inline-flex items-center gap-1">
        <MapPin className="h-4 w-4 shrink-0 text-danger-fg" aria-hidden />
        {address || 'Ubicación'}
      </span>
      {href && (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 rounded-md border border-info-border bg-info-soft px-2 py-0.5 text-xs font-semibold text-info-fg hover:underline"
        >
          <ExternalLink className="h-3.5 w-3.5" /> Abrir ubicación
        </a>
      )}
    </span>
  );
}
