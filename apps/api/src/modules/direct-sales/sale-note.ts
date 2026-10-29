import { readFileSync } from 'fs';
import * as path from 'path';
import type { Content, TDocumentDefinitions } from 'pdfmake/interfaces';
import { montoEnLetras } from '../../common/domain/monto-en-letras';
import { saleNumber } from './domain/direct-sales.rules';


/** One NIT for every branch (owner 2026-10-27); the address is the branch's. */
const COMPANY = { nombre: 'H&S TECNOLOGÍAS', nit: '4416960', pais: 'Bolivia' };
const METHOD = { efectivo: 'EFECTIVO', qr: 'QR', transferencia: 'TRANSFERENCIA BANCARIA' } as Record<string, string>;
const FONTS = { Helvetica: { normal: 'Helvetica', bold: 'Helvetica-Bold', italics: 'Helvetica-Oblique', bolditalics: 'Helvetica-BoldOblique' } };

type Num = number | string | { toString(): string };
export type NoteSale = {
  numero: number;
  fecha: Date;
  sucursal: { nombre: string; direccion: string };
  vendedor: { name: string; phone: string };
  clienteNombre: string;
  clienteCelular: string;
  clienteNit: string;
  subtotal: Num;
  descuento: Num;
  total: Num;
  items: { codigo: string; descripcion: string; unidad: string; cantidad: Num; precioUnitario: Num; descuento: Num; subtotal: Num }[];
  cobros: { medioPago: string | null; monto: Num }[];
  motivoAnulacion?: string | null;
};

// Same as the screens: dot decimal, 2 decimals, comma thousands (1,234.50).
const money = (v: Num) => Number(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const qty = (v: Num) => Number(v).toLocaleString('en-US', { maximumFractionDigits: 2 });
const when = (d: Date) => new Intl.DateTimeFormat('es-BO', { timeZone: 'America/La_Paz', day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false }).format(d);

let logo: string | null = null;
/** The logo, copied next to this file in the build (nest-cli assets). */
const logoDataUrl = () => (logo ??= `data:image/jpeg;base64,${readFileSync(path.join(__dirname, 'assets', 'hyslogo.jpg')).toString('base64')}`);

/** The sale note as printed (letter size): header, client, lines, totals, amount in words, payments, signatures. */
export function saleNoteDefinition(sale: NoteSale, { annulled = false } = {}): TDocumentDefinitions {
  const metodos = [...new Set(sale.cobros.map((c) => METHOD[c.medioPago ?? ''] ?? String(c.medioPago ?? '').toUpperCase()))].join(', ') || '—';
  const label = (text: string): Content => ({ text, color: '#555555' });
  const lines = sale.items.map((l) => [
    { text: qty(l.cantidad), alignment: 'right' },
    l.unidad.toUpperCase(),
    `${l.codigo} — ${l.descripcion}`,
    { text: money(l.precioUnitario), alignment: 'right' },
    { text: Number(l.descuento) ? money(l.descuento) : '0.00', alignment: 'right' },
    { text: money(l.subtotal), alignment: 'right' },
  ]);
  const signature = (text: string): Content => ({ stack: [{ canvas: [{ type: 'line', x1: 0, y1: 0, x2: 110, y2: 0, lineWidth: 0.7 }] }, { text, margin: [0, 3, 0, 0], alignment: 'center', fontSize: 8 }], alignment: 'center' });
  return {
    pageSize: 'LETTER',
    pageMargins: [40, 36, 40, 48],
    defaultStyle: { font: 'Helvetica', fontSize: 9 },
    info: { title: `Nota de venta ${saleNumber(sale.numero)}`, author: COMPANY.nombre },
    ...(annulled ? { watermark: { text: 'ANULADA', color: '#c62828', opacity: 0.25, bold: true } } : {}),
    footer: { text: '¡Gracias por su compra!  ·  Documento no fiscal', alignment: 'center', fontSize: 8, color: '#555555', margin: [0, 18, 0, 0] },
    content: [
      {
        columns: [
          { image: logoDataUrl(), width: 70 },
          {
            width: '*',
            margin: [10, 4, 0, 0],
            stack: [
              { text: COMPANY.nombre, bold: true, fontSize: 14 },
              `Sucursal ${sale.sucursal.nombre}`,
              sale.sucursal.direccion || '',
              `NIT ${COMPANY.nit}  ·  ${COMPANY.pais}`,
            ],
          },
          {
            width: 190,
            stack: [
              { text: 'NOTA DE VENTA', bold: true, fontSize: 15, alignment: 'right' },
              { text: `NRO: ${saleNumber(sale.numero)}`, bold: true, fontSize: 11, alignment: 'right', margin: [0, 2, 0, 4] },
              { text: [label('Fecha: '), when(sale.fecha)], alignment: 'right' },
              { text: [label('Método de pago: '), metodos], alignment: 'right' },
              { text: [label('Usuario/Cajero: '), sale.vendedor.name.toUpperCase()], alignment: 'right' },
              ...(sale.vendedor.phone ? [{ text: [label('Celular: '), sale.vendedor.phone], alignment: 'right' } as Content] : []),
            ],
          },
        ],
      },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 532, y2: 0, lineWidth: 0.7, lineColor: '#999999' }], margin: [0, 10, 0, 8] },
      {
        columns: [
          { text: [label('Cliente: '), { text: sale.clienteNombre.toUpperCase(), bold: true }] },
          { text: [label('Celular: '), sale.clienteCelular || '—'], width: 140 },
          { text: [label('Razón Soc./NIT: '), sale.clienteNit || '—'], width: 190 },
        ],
        margin: [0, 0, 0, 10],
      },
      {
        table: {
          headerRows: 1,
          widths: [38, 48, '*', 58, 48, 62],
          body: [
            ['CANT.', 'UNIDAD', 'PRODUCTO', 'PRECIO', 'DESC.', 'SUBTOTAL'].map((h, i) => ({ text: h, bold: true, fillColor: '#eeeeee', alignment: i === 0 || i > 2 ? 'right' : 'left' })),
            ...lines,
          ],
        },
        layout: { hLineWidth: () => 0.5, vLineWidth: () => 0, hLineColor: () => '#bbbbbb', paddingTop: () => 4, paddingBottom: () => 4 },
      },
      {
        columns: [
          {
            width: '*',
            margin: [0, 10, 10, 0],
            stack: [
              { text: [label('SON: '), { text: montoEnLetras(Number(sale.total)), bold: true }] },
              { text: [label('Pagos: '), sale.cobros.map((c) => `${METHOD[c.medioPago ?? ''] ?? c.medioPago} Bs ${money(c.monto)}`).join('  ·  ')], margin: [0, 4, 0, 0] },
              ...(annulled && sale.motivoAnulacion ? [{ text: [label('Motivo de anulación: '), sale.motivoAnulacion], color: '#c62828', margin: [0, 4, 0, 0] } as Content] : []),
            ],
          },
          {
            width: 190,
            margin: [0, 8, 0, 0],
            table: {
              widths: ['*', 70],
              body: [
                [label('SUBTOTAL:'), { text: money(sale.subtotal), alignment: 'right' }],
                [label('DESCUENTO:'), { text: money(sale.descuento), alignment: 'right' }],
                [{ text: 'TOTAL Bs:', bold: true }, { text: money(sale.total), bold: true, fontSize: 11, alignment: 'right' }],
              ],
            },
            layout: 'noBorders',
          },
        ],
      },
      annulled
        ? { text: 'ANULADA', color: '#c62828', bold: true, fontSize: 18, alignment: 'right', margin: [0, 10, 0, 0] }
        : { table: { body: [[{ text: 'CANCELADO', color: '#2e7d32', bold: true, fontSize: 14, margin: [8, 2, 8, 2] }]] }, layout: { hLineColor: () => '#2e7d32', vLineColor: () => '#2e7d32' }, alignment: 'right', margin: [372, 12, 0, 0] },
      { columns: ['Entregué conforme', 'Recibí conforme', 'Encargado de almacén', 'Vo. Bo.'].map(signature), margin: [0, 56, 0, 0], columnGap: 14 },
    ],
  };
}

/** The PDF bytes of a sale note. */
export function renderSaleNote(sale: NoteSale, options: { annulled?: boolean } = {}): Promise<Buffer> {
  // pdfmake on the server, with the 14 standard PDF fonts (no font files to ship). Loaded on the first note, not at
  // boot (keeps app.listen() fast on Hostinger).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const PdfPrinter = require('pdfmake');
  const printer = new PdfPrinter(FONTS);
  const doc = printer.createPdfKitDocument(saleNoteDefinition(sale, options));
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    doc.end();
  });
}
