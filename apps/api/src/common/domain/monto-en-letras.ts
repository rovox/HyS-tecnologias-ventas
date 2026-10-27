// Amounts in words for the sale note (VD-03): "SON: CUATROCIENTOS TREINTA 00/100 BOLIVIANOS". Pure TS.

const UNITS = ['', 'UNO', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE', 'DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE', 'VEINTE', 'VEINTIUNO', 'VEINTIDÓS', 'VEINTITRÉS', 'VEINTICUATRO', 'VEINTICINCO', 'VEINTISÉIS', 'VEINTISIETE', 'VEINTIOCHO', 'VEINTINUEVE'];
const TENS = ['', '', '', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
const HUNDREDS = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

/** 0–999 in words; `apocope` turns a final "UNO" into "UN" (before MIL or MILLONES). */
function belowThousand(n: number, apocope: boolean): string {
  if (n === 100) return 'CIEN';
  const h = Math.floor(n / 100);
  const rest = n % 100;
  let words: string;
  if (rest < 30) words = UNITS[rest];
  else {
    const unit = rest % 10;
    words = TENS[Math.floor(rest / 10)] + (unit ? ` Y ${UNITS[unit]}` : '');
  }
  if (apocope) words = words.replace(/VEINTIUNO$/, 'VEINTIÚN').replace(/UNO$/, 'UN');
  return [HUNDREDS[h], words].filter(Boolean).join(' ');
}

/** An integer up to 999 999 999 in words (0 → CERO). */
export function integerInWords(n: number): string {
  if (n === 0) return 'CERO';
  const millions = Math.floor(n / 1_000_000);
  const thousands = Math.floor((n % 1_000_000) / 1000);
  const rest = n % 1000;
  const parts: string[] = [];
  if (millions) parts.push(millions === 1 ? 'UN MILLÓN' : `${belowThousand(millions, true)} MILLONES`);
  if (thousands) parts.push(thousands === 1 ? 'MIL' : `${belowThousand(thousands, true)} MIL`);
  if (rest) parts.push(belowThousand(rest, false));
  return parts.join(' ');
}

/** "CUATROCIENTOS TREINTA 00/100 BOLIVIANOS". */
export function montoEnLetras(amount: number): string {
  const cents = Math.round(Math.abs(amount) * 100);
  return `${integerInWords(Math.floor(cents / 100))} ${String(cents % 100).padStart(2, '0')}/100 BOLIVIANOS`;
}
