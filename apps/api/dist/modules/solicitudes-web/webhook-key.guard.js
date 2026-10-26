"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebhookKeyGuard = void 0;
const common_1 = require("@nestjs/common");
const crypto_1 = require("crypto");
const MAX_FAILURES = 10;
const WINDOW_MS = 10 * 60 * 1000;
let WebhookKeyGuard = class WebhookKeyGuard {
    failures = new Map();
    canActivate(context) {
        const req = context.switchToHttp().getRequest();
        const expected = (process.env.WEB_LEADS_KEY || '').trim();
        if (!expected) {
            throw new common_1.ServiceUnavailableException('Webhook de solicitudes web no configurado (WEB_LEADS_KEY).');
        }
        const ip = req.ip || 'unknown';
        const now = Date.now();
        const entry = this.failures.get(ip);
        if (entry && entry.resetAt > now && entry.count >= MAX_FAILURES) {
            throw new common_1.HttpException('Demasiados intentos fallidos', common_1.HttpStatus.TOO_MANY_REQUESTS);
        }
        const given = String(req.headers['x-hs-webhook-key'] || '');
        const a = Buffer.from(given);
        const b = Buffer.from(expected);
        if (a.length === b.length && (0, crypto_1.timingSafeEqual)(a, b)) {
            this.failures.delete(ip);
            return true;
        }
        const fresh = !entry || entry.resetAt <= now;
        this.failures.set(ip, {
            count: fresh ? 1 : entry.count + 1,
            resetAt: fresh ? now + WINDOW_MS : entry.resetAt,
        });
        throw new common_1.UnauthorizedException('Clave de webhook inválida');
    }
};
exports.WebhookKeyGuard = WebhookKeyGuard;
exports.WebhookKeyGuard = WebhookKeyGuard = __decorate([
    (0, common_1.Injectable)()
], WebhookKeyGuard);
//# sourceMappingURL=webhook-key.guard.js.map