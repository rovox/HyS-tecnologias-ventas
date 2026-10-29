"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validationMessages = validationMessages;
const last = (text) => text.match(/(-?\d+(?:\.\d+)?)(?!.*\d)/)?.[1] ?? '';
const SPANISH = {
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
const isDefault = (message, property) => message.startsWith(`${property} `) || message.startsWith(`property ${property} `) || message.startsWith('each value in ') || message.startsWith('nested property ');
function validationMessages(errors, parent = '') {
    return errors.flatMap((error) => {
        const path = parent ? `${parent}.${error.property}` : error.property;
        const own = Object.entries(error.constraints ?? {}).map(([rule, message]) => {
            if (!isDefault(message, error.property))
                return message;
            const key = Object.keys(SPANISH).find((k) => k.toLowerCase() === rule.toLowerCase());
            return `${path}: ${key ? SPANISH[key](message) : 'no es válido'}`;
        });
        return [...own, ...validationMessages(error.children ?? [], path)];
    });
}
//# sourceMappingURL=validation-messages.js.map