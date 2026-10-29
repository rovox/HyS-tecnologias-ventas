"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.atBusinessTime = exports.businessDayEnd = exports.businessDayStart = exports.businessDay = exports.businessToday = exports.dayOf = void 0;
const BUSINESS_OFFSET_MS = -4 * 60 * 60 * 1000;
const dayOf = (value) => new Date(value).toISOString().slice(0, 10);
exports.dayOf = dayOf;
const businessToday = (now) => new Date(now.getTime() + BUSINESS_OFFSET_MS).toISOString().slice(0, 10);
exports.businessToday = businessToday;
const businessDay = (value) => (0, exports.businessToday)(new Date(value));
exports.businessDay = businessDay;
const businessDayStart = (day) => new Date(new Date(`${day}T00:00:00.000Z`).getTime() - BUSINESS_OFFSET_MS);
exports.businessDayStart = businessDayStart;
const businessDayEnd = (day) => new Date((0, exports.businessDayStart)(day).getTime() + 24 * 60 * 60 * 1000 - 1);
exports.businessDayEnd = businessDayEnd;
const atBusinessTime = (day, now) => new Date((0, exports.businessDayStart)(day).getTime() + ((now.getTime() + BUSINESS_OFFSET_MS) % (24 * 60 * 60 * 1000) + 24 * 60 * 60 * 1000) % (24 * 60 * 60 * 1000));
exports.atBusinessTime = atBusinessTime;
//# sourceMappingURL=calendar.js.map