// CSV export of what a list shows (Excel opens it: UTF-8 BOM, semicolon separator as used in Bolivia).

const cell = (value) => {
  const text = value === null || value === undefined ? '' : String(value);
  return /[";\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

/** columns: [{ header, value(row) }]. */
export function downloadCsv(filename, columns, rows) {
  const lines = [columns.map((c) => cell(c.header)).join(';'), ...rows.map((r) => columns.map((c) => cell(c.value(r))).join(';'))];
  const blob = new Blob([`﻿${lines.join('\n')}`], { type: 'text/csv;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}
