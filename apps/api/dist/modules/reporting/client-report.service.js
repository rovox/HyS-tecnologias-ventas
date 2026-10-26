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
exports.ClientReportService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const roles_1 = require("../../common/policy/roles");
const finance_1 = require("../finance");
const projects_1 = require("../projects");
const clients_report_1 = require("./domain/clients.report");
const MONEY = { select: { tipo: true, concepto: true, monto: true, estado: true } };
const LINES = {
    projects: { select: { id: true, codigo: true, titulo: true, estado: true, montoOficial: true, entregadoAt: true, garantiaMeses: true, categoria: { select: { id: true, label: true } }, movements: MONEY } },
    schedules: {
        where: { projectId: null },
        select: { id: true, descripcionTrabajo: true, estado: true, monto: true, fechaProgramada: true, categoria: { select: { id: true, label: true } }, movements: MONEY },
    },
};
function lines(row, now) {
    const projects = row.projects.map(({ movements, ...p }) => {
        const { cobrado } = (0, finance_1.incomeOf)(movements);
        const g = (0, projects_1.warranty)(p.entregadoAt, p.garantiaMeses, now);
        return { ...p, monto: p.montoOficial, cobrado, saldo: (0, finance_1.balanceOf)(Number(p.montoOficial), cobrado, p.estado === 'anulado'), garantiaHasta: g.hasta, garantiaVigente: g.vigente };
    });
    const jobs = row.schedules.map(({ movements, ...j }) => {
        const { cobrado } = (0, finance_1.incomeOf)(movements);
        return { ...j, cobrado, saldo: (0, finance_1.balanceOf)(Number(j.monto), cobrado, j.estado === 'cancelado') };
    });
    return { projects, jobs };
}
let ClientReportService = class ClientReportService {
    prisma;
    constructor(prisma) {
        this.prisma = prisma;
    }
    async clients(user) {
        const rows = await this.prisma.client.findMany({
            where: (0, roles_1.clientWhere)(user),
            include: { ...LINES, sucursal: { select: { id: true, nombre: true } }, _count: { select: { quotations: true } } },
            orderBy: [{ lastActivityAt: 'desc' }, { createdAt: 'desc' }],
        });
        const now = new Date();
        return rows.map((row) => {
            const { projects: _p, schedules: _s, ...client } = row;
            const { projects, jobs } = lines(row, now);
            return { ...client, ...(0, clients_report_1.clientStatus)(projects, jobs), cotizaciones: row._count.quotations };
        });
    }
    async client(id, user) {
        const row = await this.prisma.client.findFirst({
            where: { id, ...(0, roles_1.clientWhere)(user) },
            include: {
                ...LINES,
                sucursal: { select: { id: true, nombre: true } },
                quotations: {
                    select: { id: true, numero: true, titulo: true, estado: true, monto: true, eliminadaAt: true, createdAt: true, categoria: { select: { label: true } } },
                    orderBy: { createdAt: 'desc' },
                },
                movements: {
                    where: { tipo: 'ingreso', estado: { not: 'anulado' } },
                    select: { id: true, concepto: true, monto: true, estado: true, fecha: true, metodo: true, project: { select: { id: true, codigo: true } }, schedule: { select: { id: true, descripcionTrabajo: true } } },
                    orderBy: { fecha: 'desc' },
                },
                relevamientos: { select: { id: true, fecha: true, estado: true, lugar: true, tipoVisita: true, motivo: true, necesidadCliente: true }, orderBy: { fecha: 'desc' } },
            },
        });
        const delivered = row
            ? await this.prisma.stockMovement.findMany({
                where: { tipo: 'salida_proyecto', project: { clienteId: row.id }, producto: { tipo: 'equipo' } },
                select: { id: true, cantidad: true, fecha: true, projectId: true, producto: { select: { id: true, codigo: true, nombre: true, marca: true } } },
                orderBy: { fecha: 'desc' },
            })
            : [];
        if (!row)
            throw new common_1.NotFoundException('Cliente no encontrado');
        const { projects: _p, schedules: _s, quotations, movements, relevamientos, ...client } = row;
        const { projects, jobs } = lines(row, new Date());
        const byProject = new Map(projects.map((p) => [p.id, p]));
        const equipos = delivered.map((e) => {
            const p = byProject.get(e.projectId);
            return { ...e, proyecto: p ? { id: p.id, codigo: p.codigo } : null, garantiaHasta: p?.garantiaHasta ?? null, garantiaVigente: p?.garantiaVigente ?? false };
        });
        return { ...client, ...(0, clients_report_1.clientStatus)(projects, jobs), proyectos: projects, trabajos: jobs, cotizaciones: quotations, cobros: movements, relevamientos, equipos };
    }
};
exports.ClientReportService = ClientReportService;
exports.ClientReportService = ClientReportService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ClientReportService);
//# sourceMappingURL=client-report.service.js.map