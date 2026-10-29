"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.integerInWords = integerInWords;
exports.montoEnLetras = montoEnLetras;
const UNITS = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE', 'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE', 'VEINTE', 'VEINTIUNO', 'VEINTIDÓS', 'VEINTITRÉS', 'VEINTICUATRO', 'VEINTICINCO', 'VEINTISÉIS', 'VEINTISIETE', 'VEINTIOCHO', 'VEINTINUEVE'];
const TENS = ['', '', '', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
const HUNDREDS = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];
function belowThousand(n, apocope) {
    if (n === 100)
        return 'CIEN';
    const h = Math.floor(n / 100);
    const rest = n % 100;
    let words;
    if (rest < 30)
        words = UNITS[rest];
    else {
        const unit = rest % 10;
        words = TENS[Math.floor(rest / 10)] + (unit ? ` Y ${UNITS[unit]}` : '');
    }
    if (apocope)
        words = words.replace(/VEINTIUNO$/, 'VEINTIÚN').replace(/UNO$/, 'UN');
    return [HUNDREDS[h], words].filter(Boolean).join(' ');
}
function integerInWords(n) {
    if (n === 0)
        return 'CERO';
    const millions = Math.floor(n / 1_000_000);
    const thousands = Math.floor((n % 1_000_000) / 1000);
    const rest = n % 1000;
    const parts = [];
    if (millions)
        parts.push(millions === 1 ? 'UN MILLÓN' : `${belowThousand(millions, true)} MILLONES`);
    if (thousands)
        parts.push(thousands === 1 ? 'MIL' : `${belowThousand(thousands, true)} MIL`);
    if (rest)
        parts.push(belowThousand(rest, false));
    return parts.join(' ');
}
function montoEnLetras(amount) {
    const cents = Math.round(Math.abs(amount) * 100);
    return `${integerInWords(Math.floor(cents / 100))} ${String(cents % 100).padStart(2, '0')}/100 BOLIVIANOS`;
}
//# sourceMappingURL=monto-en-letras.js.map