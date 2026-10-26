"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.orderCode = orderCode;
function orderCode(id) {
    return `PED-${id.replace(/[^a-z0-9]/gi, '').slice(0, 6).toUpperCase()}`;
}
//# sourceMappingURL=codes.js.map