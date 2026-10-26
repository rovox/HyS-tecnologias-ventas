"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.fieldChanges = fieldChanges;
const IGNORED = new Set(['updatedAt', 'createdAt']);
const isDecimal = (value) => value !== null && typeof value === 'object' && 'toFixed' in value;
const isNested = (value) => value !== null && typeof value === 'object' && !(value instanceof Date) && !isDecimal(value);
function normalize(value) {
    if (value === undefined)
        return null;
    if (value instanceof Date)
        return value.toISOString();
    if (isDecimal(value))
        return String(value);
    return value;
}
function fieldChanges(before, after) {
    if (!before || !after)
        return {};
    const changes = {};
    for (const key of Object.keys(after)) {
        if (IGNORED.has(key) || !(key in before) || isNested(before[key]) || isNested(after[key]))
            continue;
        const antes = normalize(before[key]);
        const despues = normalize(after[key]);
        if (antes !== despues)
            changes[key] = { antes, despues };
    }
    return changes;
}
//# sourceMappingURL=audit-diff.js.map