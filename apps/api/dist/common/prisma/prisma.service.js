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
Object.defineProperty(exports, "__esModule", { value: true });
exports.PrismaService = void 0;
const common_1 = require("@nestjs/common");
const adapter_mariadb_1 = require("@prisma/adapter-mariadb");
const client_1 = require("@prisma/client");
function mariaAdapter() {
    const url = process.env.DATABASE_URL?.trim();
    if (!url) {
        console.error('[Prisma] DATABASE_URL no está definida — revisa las variables en hPanel (clave en MAYÚSCULAS).');
        return new adapter_mariadb_1.PrismaMariaDb({
            host: '127.0.0.1',
            port: 3306,
            user: '__unset__',
            password: '',
            database: '__unset__',
        });
    }
    return new adapter_mariadb_1.PrismaMariaDb(url);
}
let PrismaService = class PrismaService extends client_1.PrismaClient {
    constructor() {
        super({ adapter: mariaAdapter() });
    }
    async onModuleInit() {
        if (!process.env.DATABASE_URL?.trim())
            return;
        try {
            await this.$connect();
        }
        catch (err) {
            console.error('[Prisma] $connect falló al arrancar:', err);
        }
    }
    async onModuleDestroy() {
        await this.$disconnect();
    }
    async touchClientActivity(clienteId) {
        if (!clienteId)
            return;
        await this.client.update({
            where: { id: clienteId },
            data: { lastActivityAt: new Date() },
        });
    }
};
exports.PrismaService = PrismaService;
exports.PrismaService = PrismaService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], PrismaService);
//# sourceMappingURL=prisma.service.js.map