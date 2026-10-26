import { chipChangeError, DIVISIONS, divisionError } from './categories.rules';

describe('categories rules', () => {
  it('has exactly the 3 divisions', () => {
    expect(DIVISIONS.map((d) => d.id)).toEqual(['computo_comunicacion', 'seguridad_electronica', 'cableado_estructurado']);
  });

  it('requires an active division', () => {
    expect(divisionError(null)).toMatch(/Selecciona la categoría/);
    expect(divisionError({ principal: false, active: true })).toMatch(/principales/);
    expect(divisionError({ principal: true, active: false })).toMatch(/principales/);
    expect(divisionError({ principal: true, active: true })).toBeNull();
  });

  it('keeps divisions fixed and lets users manage their chips', () => {
    expect(chipChangeError({ principal: true, active: true })).toMatch(/no se pueden modificar/);
    expect(chipChangeError({ principal: false, active: true })).toBeNull();
  });
});
