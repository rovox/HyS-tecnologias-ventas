// Digicorp's public catalog (DIGI-01): turn their listing and detail answers into our rows. Pure TS (crypto for the hash).

import { createHash } from 'crypto';

/** Their public product page. */
export const productUrl = (sku: string) => `https://digicorp.com.bo/producto/${encodeURIComponent(sku)}`;

/** Names come with quotes, "*" separators and padding: one readable line. */
export function cleanText(value: unknown): string {
  return String(value ?? '')
    .replace(/^[\s"]+|[\s"]+$/g, '')
    .replace(/\*\s*/g, ' · ')
    .replace(/\s+/g, ' ')
    .replace(/^(\s*·\s*)+|(\s*·\s*)+$/g, '')
    .trim();
}

/** HTML of the extended description as plain text (it is shown as text: never injected as HTML). */
export function htmlToText(html: unknown): string {
  return String(html ?? '')
    .replace(/<(script|style)[\s\S]*?<\/\1>/gi, '')
    .replace(/<\s*(br|\/p|\/tr|\/li|\/h\d)\s*\/?>/gi, '\n')
    .replace(/<\s*\/td\s*>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n\s*\n+/g, '\n')
    .trim();
}

type ListItem = { codigoProd?: string; codigo?: string; nombre?: string; marca?: string; urlImagen1?: string };
export type CatalogRow = { sku: string; nombre: string; marca: string; imagenUrl: string; hash: string };

/** One page of the public listing → rows (items without a code are skipped). */
export function parseListPage(body: unknown): CatalogRow[] {
  const items: ListItem[] = Array.isArray(body) ? body : Array.isArray((body as { data?: unknown })?.data) ? (body as { data: ListItem[] }).data : [];
  return items
    .map((i) => {
      const sku = String(i.codigoProd || i.codigo || '').trim();
      const nombre = cleanText(i.nombre);
      const marca = cleanText(i.marca);
      const imagenUrl = /\.(webp|jpe?g|png)$/i.test(i.urlImagen1 || '') ? i.urlImagen1!.trim() : '';
      return { sku, nombre, marca, imagenUrl, hash: createHash('sha256').update(`${nombre}|${marca}|${imagenUrl}`).digest('hex') };
    })
    .filter((r) => r.sku && r.nombre);
}

type Detail = {
  sku?: string;
  nombre?: string;
  descripcion?: string;
  marca?: string;
  seccion?: string;
  categoriaCodigo?: string;
  stockTotal?: number | null;
  moneda?: string;
  assets?: { imagenes?: { url?: string; urlSmall?: string; posicion?: number }[]; descripcionExtendida?: string | null };
};

/** The detail of one product → the fields we keep (no price: it needs a Digicorp login). */
export function parseDetail(body: unknown) {
  const d = ((body as { data?: Detail })?.data ?? body) as Detail;
  const images = [...(d.assets?.imagenes ?? [])].sort((a, b) => (a.posicion ?? 0) - (b.posicion ?? 0));
  const extended = htmlToText(d.assets?.descripcionExtendida);
  return {
    descripcion: extended || cleanText(d.descripcion) || null,
    seccion: cleanText(d.seccion),
    categoriaCodigo: String(d.categoriaCodigo ?? '').trim(),
    stockTotal: typeof d.stockTotal === 'number' ? d.stockTotal : null,
    moneda: d.moneda || 'Bs',
    imagenGrandeUrl: images[0]?.url || '',
    ...(images[0]?.urlSmall ? { imagenUrl: images[0].urlSmall } : {}),
  };
}

/** Digicorp refused us (rate limit, blocked, or a challenge page instead of JSON): the sync stops, no retries. */
export function blockedReason(status: number, contentType: string | null): string | null {
  if (status === 403 || status === 429) return `Digicorp respondió ${status}: la sincronización se detuvo`;
  if (status >= 200 && status < 300 && !(contentType || '').includes('json')) return 'Digicorp respondió con una página en lugar de datos (posible verificación anti-bots): la sincronización se detuvo';
  return null;
}

/** A monthly refresh is due when the last complete sync is older than 30 days (or there is none). */
export const syncDue = (lastOk: Date | null, now: Date) => !lastOk || now.getTime() - lastOk.getTime() > 30 * 86400e3;
