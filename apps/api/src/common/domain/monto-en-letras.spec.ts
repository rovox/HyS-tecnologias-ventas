import { integerInWords, montoEnLetras } from './monto-en-letras';

describe('amount in words (VD-03)', () => {
  it('writes the examples of the owner', () => {
    expect(montoEnLetras(430)).toBe('CUATROCIENTOS TREINTA 00/100 BOLIVIANOS');
    expect(montoEnLetras(166)).toBe('CIENTO SESENTA Y SEIS 00/100 BOLIVIANOS');
  });

  it('handles the tricky numbers', () => {
    expect(integerInWords(0)).toBe('CERO');
    expect(integerInWords(1)).toBe('UNO');
    expect(integerInWords(21)).toBe('VEINTIUNO');
    expect(integerInWords(100)).toBe('CIEN');
    expect(integerInWords(101)).toBe('CIENTO UNO');
    expect(integerInWords(115)).toBe('CIENTO QUINCE');
    expect(integerInWords(1000)).toBe('MIL');
    expect(integerInWords(1001)).toBe('MIL UNO');
    expect(integerInWords(21000)).toBe('VEINTIÚN MIL');
    expect(integerInWords(31500)).toBe('TREINTA Y UN MIL QUINIENTOS');
    expect(integerInWords(100000)).toBe('CIEN MIL');
    expect(integerInWords(1000000)).toBe('UN MILLÓN');
    expect(integerInWords(2500750)).toBe('DOS MILLONES QUINIENTOS MIL SETECIENTOS CINCUENTA');
    expect(montoEnLetras(1250.5)).toBe('MIL DOSCIENTOS CINCUENTA 50/100 BOLIVIANOS');
    expect(montoEnLetras(0.99)).toBe('CERO 99/100 BOLIVIANOS');
  });
});
