"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CurrentSessionId = exports.CurrentUser = void 0;
const common_1 = require("@nestjs/common");
exports.CurrentUser = (0, common_1.createParamDecorator)((_data, ctx) => {
    const req = ctx.switchToHttp().getRequest();
    return req.user;
});
exports.CurrentSessionId = (0, common_1.createParamDecorator)((_data, ctx) => {
    const req = ctx.switchToHttp().getRequest();
    return req.sessionId;
});
//# sourceMappingURL=current-user.decorator.js.map