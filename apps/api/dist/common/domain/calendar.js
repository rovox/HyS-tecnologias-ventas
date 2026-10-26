"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.businessToday = exports.dayOf = void 0;
const BUSINESS_OFFSET_MS = -4 * 60 * 60 * 1000;
const dayOf = (value) => new Date(value).toISOString().slice(0, 10);
exports.dayOf = dayOf;
const businessToday = (now) => new Date(now.getTime() + BUSINESS_OFFSET_MS).toISOString().slice(0, 10);
exports.businessToday = businessToday;
//# sourceMappingURL=calendar.js.map