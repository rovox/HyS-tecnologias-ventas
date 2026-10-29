import { validationMessages } from './validation-messages';

describe('validationMessages', () => {
  it('turns class-validator defaults into Spanish and keeps the DTO messages', () => {
    expect(
      validationMessages([
        { property: 'monto', constraints: { isNumber: 'monto must be a number conforming to the specified constraints', min: 'monto must not be less than 0.01' } },
        { property: 'metodo', constraints: { isIn: 'Método no válido' } },
        { property: 'extra', constraints: { whitelistValidation: 'property extra should not exist' } },
      ]),
    ).toEqual(['monto: debe ser un número', 'monto: debe ser como mínimo 0.01', 'Método no válido', 'extra: no es un campo permitido']);
  });

  it('names nested fields by their path', () => {
    expect(
      validationMessages([{ property: 'items', children: [{ property: '0', children: [{ property: 'cantidad', constraints: { isPositive: 'cantidad must be a positive number' } }] }] }]),
    ).toEqual(['items.0.cantidad: debe ser mayor que 0']);
  });

  it('falls back to a generic Spanish message for an unknown rule', () => {
    expect(validationMessages([{ property: 'telefono', constraints: { isPhoneNumber: 'telefono must be a valid phone number' } }])).toEqual(['telefono: no es válido']);
  });
});
