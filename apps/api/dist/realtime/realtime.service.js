"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeService = void 0;
const common_1 = require("@nestjs/common");
const rxjs_1 = require("rxjs");
let RealtimeService = class RealtimeService {
    bus = new rxjs_1.Subject();
    emit(type, entity, id, opts = {}) {
        this.bus.next({
            type,
            entity,
            id,
            at: new Date().toISOString(),
            byUserId: opts.byUserId,
            patch: opts.patch,
        });
    }
    stream() {
        const events$ = this.bus.asObservable().pipe((0, rxjs_1.map)((data) => ({
            data: JSON.stringify(data),
        })));
        const heartbeat$ = (0, rxjs_1.interval)(25_000).pipe((0, rxjs_1.map)(() => ({
            data: JSON.stringify({ type: 'heartbeat', entity: 'system', id: 'ping', at: new Date().toISOString() }),
        })));
        return (0, rxjs_1.merge)(events$, heartbeat$);
    }
};
exports.RealtimeService = RealtimeService;
exports.RealtimeService = RealtimeService = __decorate([
    (0, common_1.Injectable)()
], RealtimeService);
//# sourceMappingURL=realtime.service.js.map