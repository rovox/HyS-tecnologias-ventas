"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ledgerCsv = ledgerCsv;
exports.ledgerXlsx = ledgerXlsx;
const ledger_export_rules_1 = require("./domain/ledger-export.rules");
const csvCell = (value) => {
    const text = String(value ?? '');
    return /[";\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};
function ledgerCsv(rows) {
    const lines = [ledger_export_rules_1.LEDGER_COLUMNS.map(([, header]) => csvCell(header)).join(';'), ...rows.map((r) => ledger_export_rules_1.LEDGER_COLUMNS.map(([key]) => csvCell(key === 'monto' ? r.monto.toFixed(2) : r[key])).join(';'))];
    return Buffer.from(`﻿${lines.join('\n')}`, 'utf8');
}
const MONEY = '#,##0.00;[Red]-#,##0.00';
async function ledgerXlsx(rows, summary, title) {
    const { Workbook } = await Promise.resolve().then(() => __importStar(require('exceljs')));
    const book = new Workbook();
    book.creator = 'H&S Tecnologías ERP';
    book.created = new Date();
    const sheet = book.addWorksheet('Libro', { views: [{ state: 'frozen', ySplit: 1 }] });
    sheet.columns = ledger_export_rules_1.LEDGER_COLUMNS.map(([key, header]) => ({ header, key, width: key === 'nota' || key === 'cliente' ? 32 : key === 'caja' ? 24 : 14 }));
    sheet.addRows(rows);
    sheet.getRow(1).font = { bold: true };
    sheet.getColumn('monto').numFmt = MONEY;
    sheet.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: ledger_export_rules_1.LEDGER_COLUMNS.length } };
    const resumen = book.addWorksheet('Resumen');
    resumen.columns = [{ width: 32 }, { width: 16 }];
    resumen.addRow([title]).font = { bold: true, size: 13 };
    resumen.addRow([]);
    const figures = [
        ['Ingresos', summary.ingresos],
        ['Egresos', summary.egresos],
        ['Neto', summary.neto],
        [`Por validar (${summary.porValidar.cantidad})`, summary.porValidar.monto],
    ];
    for (const [label, value] of figures)
        resumen.addRow([label, value]).getCell(2).numFmt = MONEY;
    resumen.addRow(['Anulados (no cuentan)', summary.anulados]);
    resumen.addRow([]);
    resumen.addRow(['Por concepto', 'Monto Bs']).font = { bold: true };
    for (const c of summary.porConcepto)
        resumen.addRow([c.concepto, c.monto]).getCell(2).numFmt = MONEY;
    return Buffer.from(await book.xlsx.writeBuffer());
}
//# sourceMappingURL=ledger-export.js.map