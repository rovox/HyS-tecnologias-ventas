import { Workbook } from 'exceljs';
import { LEDGER_COLUMNS, LedgerRow, LedgerSummary } from './domain/ledger-export.rules';

const csvCell = (value: string | number) => {
  const text = String(value ?? '');
  return /[";\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** CSV as Excel in Bolivia opens it: UTF-8 BOM, semicolon separator, decimal point. */
export function ledgerCsv(rows: LedgerRow[]): Buffer {
  const lines = [LEDGER_COLUMNS.map(([, header]) => csvCell(header)).join(';'), ...rows.map((r) => LEDGER_COLUMNS.map(([key]) => csvCell(key === 'monto' ? r.monto.toFixed(2) : r[key])).join(';'))];
  return Buffer.from(`﻿${lines.join('\n')}`, 'utf8');
}

const MONEY = '#,##0.00;[Red]-#,##0.00';

/** A real workbook: sheet "Libro" (amounts as numbers, filters, frozen header) and sheet "Resumen". */
export async function ledgerXlsx(rows: LedgerRow[], summary: LedgerSummary, title: string): Promise<Buffer> {
  const book = new Workbook();
  book.creator = 'H&S Tecnologías ERP';
  book.created = new Date();

  const sheet = book.addWorksheet('Libro', { views: [{ state: 'frozen', ySplit: 1 }] });
  sheet.columns = LEDGER_COLUMNS.map(([key, header]) => ({ header, key, width: key === 'nota' || key === 'cliente' ? 32 : key === 'caja' ? 24 : 14 }));
  sheet.addRows(rows);
  sheet.getRow(1).font = { bold: true };
  sheet.getColumn('monto').numFmt = MONEY;
  sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: LEDGER_COLUMNS.length } };

  const resumen = book.addWorksheet('Resumen');
  resumen.columns = [{ width: 32 }, { width: 16 }];
  resumen.addRow([title]).font = { bold: true, size: 13 };
  resumen.addRow([]);
  const figures: [string, number][] = [
    ['Ingresos', summary.ingresos],
    ['Egresos', summary.egresos],
    ['Neto', summary.neto],
    [`Por validar (${summary.porValidar.cantidad})`, summary.porValidar.monto],
  ];
  for (const [label, value] of figures) resumen.addRow([label, value]).getCell(2).numFmt = MONEY;
  resumen.addRow(['Anulados (no cuentan)', summary.anulados]);
  resumen.addRow([]);
  resumen.addRow(['Por concepto', 'Monto Bs']).font = { bold: true };
  for (const c of summary.porConcepto) resumen.addRow([c.concepto, c.monto]).getCell(2).numFmt = MONEY;

  return Buffer.from(await book.xlsx.writeBuffer());
}
