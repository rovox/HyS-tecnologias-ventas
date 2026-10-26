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
exports.ProjectsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const audit_service_1 = require("../../common/audit/audit.service");
const roles_1 = require("../../common/policy/roles");
const schedules_1 = require("../schedules");
const finance_1 = require("../finance");
const projects_rules_1 = require("./domain/projects.rules");
const project_presenter_1 = require("./project.presenter");
let ProjectsService = class ProjectsService {
    prisma;
    audit;
    schedules;
    income;
    constructor(prisma, audit, schedules, income) {
        this.prisma = prisma;
        this.audit = audit;
        this.schedules = schedules;
        this.income = income;
    }
    async list(query, user) {
        (0, roles_1.assertCanSeeProjects)(user);
        const rows = await this.prisma.project.findMany({
            where: { ...(query.estado ? { estado: query.estado } : {}), ...(query.clienteId ? { clienteId: query.clienteId } : {}) },
            include: project_presenter_1.PROJECT_DETAIL,
            orderBy: { createdAt: 'desc' },
            take: 500,
        });
        const now = new Date();
        return rows.map((row) => (0, project_presenter_1.presentProject)(row, now));
    }
    async row(id) {
        const row = await this.prisma.project.findUnique({ where: { id }, include: project_presenter_1.PROJECT_DETAIL });
        if (!row)
            throw new common_1.NotFoundException('Proyecto no encontrado');
        return row;
    }
    async get(id, user) {
        (0, roles_1.assertCanSeeProjects)(user);
        return (0, project_presenter_1.presentProject)(await this.row(id));
    }
    async createFromQuotation(tx, quote, options) {
        const project = await tx.project.create({
            data: {
                codigo: (0, projects_rules_1.projectCode)(quote.numero),
                quotationId: quote.id,
                clienteId: quote.clienteId,
                categoriaId: quote.categoriaId,
                sucursalId: quote.sucursalId,
                titulo: quote.titulo.slice(0, 300),
                montoOficial: quote.monto,
                responsableId: quote.vendedorId || null,
            },
        });
        const schedule = await this.schedules.createFirstJob(tx, {
            ...(0, projects_rules_1.firstJobFromQuotation)(quote, quote.cliente?.direccion || '', options, new Date()),
            projectId: project.id,
        });
        return { project, schedule };
    }
    async update(id, dto, user, sessionId) {
        (0, roles_1.assertCanManageProjects)(user);
        const before = await this.row(id);
        const after = await this.prisma.project.update({
            where: { id },
            data: {
                ...(dto.titulo !== undefined ? { titulo: dto.titulo.trim() } : {}),
                ...(dto.garantiaMeses !== undefined ? { garantiaMeses: dto.garantiaMeses } : {}),
                ...(dto.responsableId !== undefined ? { responsableId: dto.responsableId || null } : {}),
            },
            include: project_presenter_1.PROJECT_DETAIL,
        });
        await this.audit.record({ user, sessionId, action: 'project.update', entity: 'project', id, before, after, affects: ['client'] });
        return (0, project_presenter_1.presentProject)(after);
    }
    async changeStatus(id, dto, user, sessionId) {
        (0, roles_1.assertCanManageProjects)(user);
        const before = await this.row(id);
        const { saldo } = (0, project_presenter_1.presentProject)(before);
        const openJobs = before.schedules.filter((s) => ['programado', 'en_proceso'].includes(s.estado)).length;
        const check = (0, projects_rules_1.checkProjectTransition)(before, dto.estado, { saldo, isAdmin: (0, roles_1.isAdmin)(user), motivo: dto.motivo, openJobs });
        if (!check.ok)
            throw new common_1.BadRequestException(check.reason);
        const now = new Date();
        await this.prisma.$transaction(async (tx) => {
            await tx.project.update({
                where: { id },
                data: {
                    estado: dto.estado,
                    ...(dto.estado === 'entregado' ? { entregadoAt: now } : {}),
                    ...(dto.estado === 'en_ejecucion' ? { entregadoAt: null } : {}),
                    ...(dto.estado === 'cerrado' ? { cerradoAt: now } : {}),
                    ...(dto.estado === 'anulado' ? { motivoAnulacion: dto.motivo.trim() } : {}),
                },
            });
            if (dto.estado === 'anulado')
                await this.schedules.cancelOpenJobs(tx, id);
        });
        const after = await this.row(id);
        await this.audit.record({
            user,
            sessionId,
            action: 'project.status',
            entity: 'project',
            id,
            before,
            after,
            affects: ['schedule', 'client'],
            patch: { estado: dto.estado },
        });
        return (0, project_presenter_1.presentProject)(after);
    }
    async addJob(id, dto, user, sessionId) {
        (0, roles_1.assertCanManageProjects)(user);
        const project = await this.row(id);
        const error = (0, projects_rules_1.newJobError)(project);
        if (error)
            throw new common_1.BadRequestException(error);
        await this.schedules.create({
            ...dto,
            clienteId: project.clienteId,
            sucursalId: project.sucursalId,
            quotationId: project.quotationId,
            lugar: dto.lugar || project.cliente.direccion || '',
            monto: 0,
        }, user, sessionId, { projectId: id });
        return this.get(id, user);
    }
    async registerPayment(id, dto, user, sessionId) {
        await this.income.register({ projectId: id }, dto, user, sessionId);
        return (0, project_presenter_1.presentProject)(await this.row(id));
    }
    async changeAmount(id, dto, user, sessionId) {
        (0, roles_1.assertCanManageProjects)(user);
        const before = await this.row(id);
        const error = (0, projects_rules_1.montoChangeError)({ isAdmin: (0, roles_1.isAdmin)(user), estado: before.estado }, dto.montoOficial, dto.motivo);
        if (error)
            throw new common_1.BadRequestException(error);
        const after = await this.prisma.project.update({ where: { id }, data: { montoOficial: dto.montoOficial }, include: project_presenter_1.PROJECT_DETAIL });
        await this.audit.record({
            user,
            sessionId,
            action: 'project.amount',
            entity: 'project',
            id,
            before,
            after,
            affects: ['client'],
            patch: { motivo: dto.motivo.trim() },
        });
        return (0, project_presenter_1.presentProject)(after);
    }
};
exports.ProjectsService = ProjectsService;
exports.ProjectsService = ProjectsService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService,
        schedules_1.SchedulesService,
        finance_1.IncomeService])
], ProjectsService);
//# sourceMappingURL=projects.service.js.map