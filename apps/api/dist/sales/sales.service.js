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
exports.SalesService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const activity_service_1 = require("../auth/activity.service");
const roles_1 = require("../auth/roles");
const JOB_FLOW = {
    programado: ['en_proceso', 'cancelado'],
    en_proceso: ['terminado', 'cancelado'],
    terminado: [],
    cancelado: [],
};
let SalesService = class SalesService {
    prisma;
    activity;
    constructor(prisma, activity) {
        this.prisma = prisma;
        this.activity = activity;
    }
    list(user) {
        return this.prisma.sale.findMany({
            where: (0, roles_1.saleWhere)(user),
            include: { quotation: true, jobs: true, payments: true },
            orderBy: { createdAt: 'desc' },
        });
    }
    async get(id, user) {
        const sale = await this.prisma.sale.findFirst({
            where: { id, ...(user ? (0, roles_1.saleWhere)(user) : {}) },
            include: { quotation: true, jobs: true, payments: true },
        });
        if (!sale)
            throw new common_1.NotFoundException('Venta no encontrada');
        const cobrado = sale.payments.reduce((sum, row) => sum + Number(row.monto), 0);
        return { ...sale, cobrado, saldo: Number(sale.total) - cobrado };
    }
    async addJob(saleId, dto, user, sessionId) {
        const sale = await this.get(saleId, user);
        const next = Number(dto.monto || 0);
        const jobsSum = sale.jobs.reduce((sum, row) => sum + Number(row.monto), 0) + next;
        if (jobsSum > Number(sale.total) + 0.009) {
            throw new common_1.BadRequestException('Los trabajos no pueden superar el total de la venta');
        }
        const job = await this.prisma.saleJob.create({
            data: {
                saleId,
                titulo: dto.titulo,
                asignadoId: dto.asignadoId,
                monto: next,
            },
        });
        await this.prisma.touchClientActivity(sale.quotation?.clienteId);
        await this.activity.log(user.id, sessionId, 'sale.job', 'sale', saleId);
        return job;
    }
    async updateJob(saleId, jobId, estado, user, sessionId) {
        await this.get(saleId, user);
        const job = await this.prisma.saleJob.findFirst({ where: { id: jobId, saleId } });
        if (!job)
            throw new common_1.NotFoundException('Trabajo no encontrado');
        const allowed = JOB_FLOW[job.estado] || [];
        if (!allowed.includes(estado)) {
            throw new common_1.BadRequestException(`Transición inválida: ${job.estado} → ${estado}`);
        }
        const updated = await this.prisma.saleJob.update({ where: { id: jobId }, data: { estado } });
        await this.activity.log(user.id, sessionId, 'sale.job.status', 'sale_job', jobId);
        return updated;
    }
    async addPayment(saleId, dto, user, sessionId) {
        const sale = await this.get(saleId, user);
        if (sale.cobrado + dto.monto > Number(sale.total) + 0.009) {
            throw new common_1.BadRequestException('El pago supera el total de la venta');
        }
        const payment = await this.prisma.salePayment.create({
            data: {
                saleId,
                monto: dto.monto,
                metodo: dto.metodo || '',
                nota: dto.nota || '',
            },
        });
        await this.activity.log(user.id, sessionId, 'sale.payment', 'sale', saleId);
        return payment;
    }
};
exports.SalesService = SalesService;
exports.SalesService = SalesService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        activity_service_1.ActivityService])
], SalesService);
//# sourceMappingURL=sales.service.js.map