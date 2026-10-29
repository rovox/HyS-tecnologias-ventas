"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var DigicorpService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DigicorpService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const policy_1 = require("../../common/policy/policy");
const digicorp_rules_1 = require("./domain/digicorp.rules");
const API = 'https://nweb.apidigicorp.com/api_neweb/api';
const PAGE = 100;
const PAUSE_MS = 3000;
const DAY_MS = 24 * 60 * 60 * 1000;
const DETAIL_TTL_MS = 30 * DAY_MS;
class Blocked extends Error {
}
let DigicorpService = DigicorpService_1 = class DigicorpService {
    prisma;
    logger = new common_1.Logger(DigicorpService_1.name);
    timer;
    running = false;
    constructor(prisma) {
        this.prisma = prisma;
    }
    startTimers() {
        if (process.env.DIGICORP_AUTO_SYNC !== '1')
            return;
        const check = () => this.syncIfDue().catch((err) => this.logger.error(`Tienda Digicorp: ${err}`));
        check();
        this.timer = setInterval(check, DAY_MS);
        this.timer.unref();
    }
    onModuleDestroy() {
        clearInterval(this.timer);
    }
    assertRead(user) {
        if (!(0, policy_1.canRegisterMovements)(user))
            throw new common_1.ForbiddenException('Sin acceso a la tienda Digicorp');
    }
    async get(path) {
        const response = await fetch(`${API}/${path}`, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(20000) });
        const blocked = (0, digicorp_rules_1.blockedReason)(response.status, response.headers.get('content-type'));
        if (blocked)
            throw new Blocked(blocked);
        if (!response.ok)
            throw new Error(`Digicorp respondió ${response.status}`);
        return response.json();
    }
    async syncIfDue(now = new Date()) {
        const last = await this.prisma.digicorpSync.findFirst({ where: { estado: 'ok' }, orderBy: { iniciadoAt: 'desc' } });
        if ((0, digicorp_rules_1.syncDue)(last?.terminadoAt ?? null, now))
            await this.run(null);
    }
    async startSync(user) {
        if (!(0, policy_1.isAdmin)(user))
            throw new common_1.ForbiddenException('Solo Administración o Contabilidad actualizan la tienda Digicorp');
        if (this.running)
            throw new common_1.ConflictException('Ya se está actualizando');
        const sync = await this.prisma.digicorpSync.create({ data: { iniciadoPorId: user.id } });
        void this.run(sync.id).catch((err) => this.logger.error(`Tienda Digicorp: ${err}`));
        return sync;
    }
    async run(syncId) {
        if (this.running)
            return;
        this.running = true;
        const sync = syncId ? { id: syncId } : await this.prisma.digicorpSync.create({ data: {} });
        const startedAt = new Date();
        const counts = { paginas: 0, nuevos: 0, cambiados: 0 };
        try {
            for (let offset = 0;; offset += PAGE) {
                if (offset)
                    await new Promise((r) => setTimeout(r, PAUSE_MS));
                const rows = (0, digicorp_rules_1.parseListPage)(await this.get(`Producto/publico?limit=${PAGE}&offset=${offset}`));
                counts.paginas += 1;
                for (const row of rows) {
                    const before = await this.prisma.digicorpProducto.findUnique({ where: { sku: row.sku }, select: { hash: true } });
                    if (!before)
                        counts.nuevos += 1;
                    else if (before.hash !== row.hash)
                        counts.cambiados += 1;
                    await this.prisma.digicorpProducto.upsert({
                        where: { sku: row.sku },
                        create: { ...row, vistoAt: new Date() },
                        update: { ...row, vistoAt: new Date(), retiradoAt: null },
                    });
                }
                await this.prisma.digicorpSync.update({ where: { id: sync.id }, data: counts });
                if (rows.length < PAGE)
                    break;
            }
            const { count: retirados } = await this.prisma.digicorpProducto.updateMany({ where: { vistoAt: { lt: startedAt }, retiradoAt: null }, data: { retiradoAt: new Date() } });
            await this.prisma.digicorpSync.update({ where: { id: sync.id }, data: { ...counts, retirados, estado: 'ok', terminadoAt: new Date() } });
            this.logger.log(`Tienda Digicorp: ${counts.paginas} páginas, ${counts.nuevos} nuevos, ${counts.cambiados} cambiados, ${retirados} retirados`);
        }
        catch (err) {
            const blocked = err instanceof Blocked;
            await this.prisma.digicorpSync.update({ where: { id: sync.id }, data: { ...counts, estado: blocked ? 'bloqueado' : 'error', error: String(err.message), terminadoAt: new Date() } });
            this.logger.warn(`Tienda Digicorp ${blocked ? 'bloqueada' : 'con error'}: ${err.message}`);
        }
        finally {
            this.running = false;
        }
    }
    async list(query, user) {
        this.assertRead(user);
        const q = query.q?.trim();
        const where = {
            retiradoAt: null,
            ...(query.marca ? { marca: query.marca } : {}),
            ...(q ? { OR: [{ sku: { contains: q } }, { nombre: { contains: q } }, { marca: { contains: q } }] } : {}),
        };
        const [total, items, marcas, ultimaSync] = await Promise.all([
            this.prisma.digicorpProducto.count({ where }),
            this.prisma.digicorpProducto.findMany({ where, orderBy: { nombre: 'asc' }, skip: query.offset ?? 0, take: query.limit ?? 48 }),
            this.prisma.digicorpProducto.groupBy({ by: ['marca'], where: { retiradoAt: null }, _count: true, orderBy: { marca: 'asc' } }),
            this.prisma.digicorpSync.findFirst({ orderBy: { iniciadoAt: 'desc' } }),
        ]);
        return {
            total,
            items: items.map((p) => ({ ...p, url: (0, digicorp_rules_1.productUrl)(p.sku) })),
            marcas: marcas.filter((m) => m.marca).map((m) => ({ marca: m.marca, cantidad: m._count })),
            ultimaSync,
            actualizando: this.running,
        };
    }
    async detail(sku, user) {
        this.assertRead(user);
        const row = await this.prisma.digicorpProducto.findUnique({ where: { sku } });
        if (!row)
            throw new common_1.NotFoundException('Producto no encontrado en la tienda Digicorp');
        if (row.detalleAt && Date.now() - row.detalleAt.getTime() < DETAIL_TTL_MS)
            return { ...row, url: (0, digicorp_rules_1.productUrl)(sku) };
        try {
            const detail = (0, digicorp_rules_1.parseDetail)(await this.get(`Producto/producto/publico/${encodeURIComponent(sku)}`));
            const updated = await this.prisma.digicorpProducto.update({ where: { sku }, data: { ...detail, detalleAt: new Date() } });
            return { ...updated, url: (0, digicorp_rules_1.productUrl)(sku) };
        }
        catch (err) {
            return { ...row, url: (0, digicorp_rules_1.productUrl)(sku), aviso: `No se pudo actualizar el detalle: ${err.message}` };
        }
    }
};
exports.DigicorpService = DigicorpService;
exports.DigicorpService = DigicorpService = DigicorpService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], DigicorpService);
//# sourceMappingURL=digicorp.service.js.map