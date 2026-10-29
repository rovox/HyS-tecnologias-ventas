// The app is only in Spanish: class-validator's default messages ("monto must be a number…") become Spanish ones.
// A message written in the DTO (`{ message: '…' }`) is kept as it is. Pure TS, no Nest.

type ValidationErrorLike = { property: string; constraints?: Record<string, string>; children?: ValidationErrorLike[] };

/** The number in a default message ("must not be less than 0.01" → "0.01"). */
const last = (text: string) => text.match(/(-?\d+(?:\.\d+)?)(?!.*\d)/)?.[1] ?? '';

const SPANISH: Record<string, (original: string) => string> = {
  isDefined: () => 'es obligatorio',
  isNotEmpty: () => 'es obligatorio',
  isString: () => 'debe ser texto',
  isNumber: () => 'debe ser un número',
  isInt: () => 'debe ser un número entero',
  isPositive: () => 'debe ser mayor que 0',
  min: (m) => `debe ser como mínimo ${last(m)}`,
  max: (m) => `debe ser como máximo ${last(m)}`,
  minLength: (m) => `debe tener al menos ${last(m)} caracteres`,
  maxLength: (m) => `debe tener como máximo ${last(m)} caracteres`,
  isLength: () => 'tiene un largo no válido',
  isEmail: () => 'debe ser un correo válido',
  isIn: () => 'tiene un valor no permitido',
  isEnum: () => 'tiene un valor no permitido',
  isBoolean: () => 'debe ser sí o no',
  isDateString: () => 'debe ser una fecha válida',
  isIso8601: () => 'debe ser una fecha válida',
  isDate: () => 'debe ser una fecha válida',
  isArray: () => 'debe ser una lista',
  arrayMinSize: (m) => `debe tener al menos ${last(m)} elemento(s)`,
  arrayMaxSize: (m) => `debe tener como máximo ${last(m)} elemento(s)`,
  arrayNotEmpty: () => 'debe tener al menos un elemento',
  isUuid: () => 'no es un identificador válido',
  isUrl: () => 'debe ser un enlace válido',
  isObject: () => 'tiene datos no válidos',
  nestedValidation: () => 'tiene datos no válidos',
  matches: () => 'tiene un formato no válido',
  whitelistValidation: () => 'no es un campo permitido',
};

/** class-validator's own messages are English sentences about the property ("x must…", "x should…", "each value in x…"). */
const isDefault = (message: string, property: string) =>
  message.startsWith(`${property} `) || message.startsWith(`property ${property} `) || message.startsWith('each value in ') || message.startsWith('nested property ');

/** One Spanish message per failed rule ("monto: debe ser un número"), nested fields as "items.0.cantidad". */
export function validationMessages(errors: ValidationErrorLike[], parent = ''): string[] {
  return errors.flatMap((error) => {
    const path = parent ? `${parent}.${error.property}` : error.property;
    const own = Object.entries(error.constraints ?? {}).map(([rule, message]) => {
      if (!isDefault(message, error.property)) return message;
      const key = Object.keys(SPANISH).find((k) => k.toLowerCase() === rule.toLowerCase());
      return `${path}: ${key ? SPANISH[key](message) : 'no es válido'}`;
    });
    return [...own, ...validationMessages(error.children ?? [], path)];
  });
}
