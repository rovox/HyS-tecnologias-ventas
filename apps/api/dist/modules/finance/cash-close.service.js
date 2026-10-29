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
exports.CashCloseService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const audit_service_1 = require("../../common/audit/audit.service");
const calendar_1 = require("../../common/domain/calendar");
const policy_1 = require("../../common/policy/policy");
const cash_close_rules_1 = require("./domain/cash-close.rules");
const finance_rules_1 = require("./domain/finance.rules");
const movement_presenter_1 = require("./movement.presenter");
const USER_NAME = { select: { id: true, name: true } };
const CLOSE_DETAIL = {
    sucursal: { select: { id: true, nombre: true } },
    caja: { select: { id: true, nombre: true } },
    cerradoPor: USER_NAME,
    revisadoPor: USER_NAME,
    diferenciaMovimiento: { select: { id: true, estado: true, tipo: true, monto: true } },
};
const cents = (value) => Math.round(value * 100) / 100;
let CashCloseService = class CashCloseService {
    prisma;
    audit;
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    assertCloser(user, sucursalId) {
        if ((0, policy_1.isAdmin)(user))
            return;
        if ((0, policy_1.isVentas)(user) && user.sucursalId === sucursalId)
            return;
        throw new common_1.ForbiddenException('Cierras la caja de tu sucursal');
    }
    async box(sucursalId) {
        const box = await this.prisma.cashBox.findFirst({ where: { sucursalId, active: true, tipo: { in: ['caja', 'caja_chica'] } } });
        if (!box)
            throw new common_1.BadRequestException('La sucursal no tiene caja de efectivo');
        return box;
    }
    async preview(sucursalId, dia, user) {
        if (!(0, policy_1.isAdmin)(user) && !(0, policy_1.isVentas)(user))
            throw new common_1.ForbiddenException('Sin acceso al cierre de caja');
        const day = dia.slice(0, 10);
        const sucursal = await this.prisma.sucursal.findUnique({ where: { id: sucursalId } });
        if (!sucursal)
            throw new common_1.NotFoundException('Sucursal no encontrada');
        const box = await this.box(sucursalId);
        const [previous, existing, movements, sales] = await Promise.all([
            this.prisma.cierreCaja.findFirst({ where: { sucursalId, dia: { lt: day } }, orderBy: { dia: 'desc' } }),
            this.prisma.cierreCaja.findUnique({ where: { sucursalId_dia: { sucursalId, dia: day } }, include: CLOSE_DETAIL }),
            this.prisma.cashMovement.findMany({
                where: { fecha: { gte: (0, calendar_1.businessDayStart)(day), lte: (0, calendar_1.businessDayEnd)(day) }, OR: [{ sucursalId }, { cajaId: box.id }, { cajaDestinoId: box.id }] },
                include: movement_presenter_1.MOVEMENT_DETAIL,
                orderBy: { fecha: 'asc' },
            }),
            this.prisma.directSale.aggregate({ where: { sucursalId, estado: 'registrada', fecha: { gte: (0, calendar_1.businessDayStart)(day), lte: (0, calendar_1.businessDayEnd)(day) } }, _count: true, _sum: { total: true } }),
        ]);
        const inBox = { OR: [{ cajaId: box.id }, { cajaDestinoId: box.id }] };
        const saldoInicial = previous
            ? Number(previous.efectivoContado)
            : (0, finance_rules_1.cashBoxBalance)(box.id, await this.prisma.cashMovement.findMany({ where: { estado: 'validado', fecha: { lt: (0, calendar_1.businessDayStart)(day) }, ...inBox } }));
        const unclosed = previous
            ? await this.prisma.cashMovement.findFirst({
                where: {
                    estado: { not: 'anulado' },
                    concepto: { not: 'saldo_inicial' },
                    fecha: { gt: (0, calendar_1.businessDayEnd)(previous.dia), lt: (0, calendar_1.businessDayStart)(day) },
                    OR: [{ sucursalId }, { cajaId: box.id }, { cajaDestinoId: box.id }],
                },
                orderBy: { fecha: 'asc' },
                select: { fecha: true },
            })
            : null;
        const pendingDay = unclosed ? (0, calendar_1.businessDay)(unclosed.fecha) : null;
        const counter = new Set((await this.prisma.user.findMany({ where: { sucursalId, active: true, role: { not: policy_1.ROLES.TEC } }, select: { id: true } })).map((u) => u.id));
        const cash = (0, cash_close_rules_1.expectedCash)(saldoInicial ?? 0, movements, box.id, counter);
        const effect = new Map(cash.lines.map((l) => [l.id, l.efecto]));
        return {
            sucursal: { id: sucursal.id, nombre: sucursal.nombre },
            caja: { id: box.id, nombre: box.nombre },
            dia: day,
            saldoInicial,
            requisitos: (0, cash_close_rules_1.closeRequirements)({ dia: day, today: (0, calendar_1.businessToday)(new Date()), closed: Boolean(existing), pendingDay }),
            cierreAnterior: previous ? { dia: previous.dia, efectivoContado: Number(previous.efectivoContado) } : null,
            ingresosEfectivo: cash.ingresos,
            egresosEfectivo: cash.egresos,
            efectivoEsperado: cash.esperado,
            movimientos: movements.filter((m) => effect.has(m.id)).map((m) => ({ ...(0, movement_presenter_1.presentMovement)(m), efecto: effect.get(m.id) })),
            ...(0, cash_close_rules_1.otherMethods)(movements),
            ventas: { cantidad: sales._count, total: Number(sales._sum.total ?? 0) },
            cierre: existing,
        };
    }
    async close(dto, user, sessionId) {
        this.assertCloser(user, dto.sucursalId);
        const day = dto.dia.slice(0, 10);
        if (day > (0, calendar_1.businessToday)(new Date()))
            throw new common_1.BadRequestException('No se cierra un día que todavía no llegó');
        const countErr = (0, cash_close_rules_1.countError)(dto.conteo);
        if (countErr)
            throw new common_1.BadRequestException(countErr);
        const preview = await this.preview(dto.sucursalId, day, user);
        if (preview.cierre)
            throw new common_1.ConflictException(`La caja de ${preview.sucursal.nombre} ya se cerró el ${day}`);
        const missing = preview.requisitos.find((r) => !r.ok);
        if (missing)
            throw new common_1.BadRequestException(missing.texto);
        const saldoInicial = preview.saldoInicial;
        const esperado = cents(saldoInicial + preview.ingresosEfectivo - preview.egresosEfectivo);
        const contado = (0, cash_close_rules_1.countTotal)(dto.conteo);
        const diferencia = cents(contado - esperado);
        const error = (0, cash_close_rules_1.closeError)(diferencia, dto.motivoDiferencia);
        if (error)
            throw new common_1.BadRequestException(error);
        const extra = (0, cash_close_rules_1.differenceMovement)(diferencia);
        const row = await this.prisma.$transaction(async (tx) => {
            const movement = extra
                ? await tx.cashMovement.create({
                    data: {
                        tipo: extra.tipo,
                        concepto: extra.concepto,
                        monto: extra.monto,
                        metodo: 'efectivo',
                        nota: `${extra.label} del cierre del ${day} en ${preview.sucursal.nombre}: ${dto.motivoDiferencia.trim()}`,
                        sucursalId: dto.sucursalId,
                        registradoPorId: user.id,
                        ...(extra.tipo === 'egreso' ? { pagadoPor: 'empresa' } : { recibidoPorId: user.id }),
                    },
                })
                : null;
            return tx.cierreCaja.create({
                data: {
                    sucursalId: dto.sucursalId,
                    cajaId: preview.caja.id,
                    dia: day,
                    saldoInicial,
                    ingresosEfectivo: preview.ingresosEfectivo,
                    egresosEfectivo: preview.egresosEfectivo,
                    efectivoEsperado: esperado,
                    conteo: dto.conteo,
                    efectivoContado: contado,
                    diferencia,
                    motivoDiferencia: dto.motivoDiferencia?.trim() || null,
                    totalQr: preview.qr,
                    totalTransferencia: preview.transferencia,
                    ventasCantidad: preview.ventas.cantidad,
                    ventasTotal: preview.ventas.total,
                    observaciones: dto.observaciones?.trim() || null,
                    cerradoPorId: user.id,
                    diferenciaMovimientoId: movement?.id ?? null,
                },
                include: CLOSE_DETAIL,
            });
        });
        await this.audit.record({ user, sessionId, action: 'cashClose.create', entity: 'cashClose', id: row.id, patch: { dia: day, diferencia }, affects: extra ? ['movement'] : [] });
        return row;
    }
    async list(query, user) {
        if (!(0, policy_1.isAdmin)(user) && !(0, policy_1.isVentas)(user))
            throw new common_1.ForbiddenException('Sin acceso al cierre de caja');
        const sucursalId = (0, policy_1.isAdmin)(user) ? query.sucursalId : user.sucursalId;
        return this.prisma.cierreCaja.findMany({
            where: {
                ...(sucursalId ? { sucursalId } : {}),
                ...(query.desde || query.hasta ? { dia: { ...(query.desde ? { gte: query.desde.slice(0, 10) } : {}), ...(query.hasta ? { lte: query.hasta.slice(0, 10) } : {}) } } : {}),
            },
            include: CLOSE_DETAIL,
            orderBy: [{ dia: 'desc' }, { cerradoAt: 'desc' }],
            take: 500,
        });
    }
    async review(id, action, motivo, user, sessionId) {
        if (!(0, policy_1.isAdmin)(user))
            throw new common_1.ForbiddenException('Solo Administración o Contabilidad revisan los cierres');
        const before = await this.prisma.cierreCaja.findUnique({ where: { id }, include: { diferenciaMovimiento: true } });
        if (!before)
            throw new common_1.NotFoundException('Cierre no encontrado');
        const error = (0, cash_close_rules_1.reviewError)(before.revisionEstado, action, motivo);
        if (error)
            throw new common_1.BadRequestException(error);
        const movement = before.diferenciaMovimiento;
        const open = movement && ['por_validar', 'observado'].includes(movement.estado);
        const row = await this.prisma.$transaction(async (tx) => {
            if (open && action === 'aprobar') {
                await tx.cashMovement.update({ where: { id: movement.id }, data: { estado: 'validado', cajaId: before.cajaId, validadoPorId: user.id, validadoAt: new Date(), motivo: null } });
            }
            if (open && action === 'observar') {
                await tx.cashMovement.update({ where: { id: movement.id }, data: { estado: 'observado', motivo: motivo.trim() } });
            }
            return tx.cierreCaja.update({
                where: { id },
                data: {
                    revisionEstado: action === 'aprobar' ? 'aprobado' : 'observado',
                    revisionMotivo: action === 'observar' ? motivo.trim() : null,
                    revisadoPorId: user.id,
                    revisadoAt: new Date(),
                },
                include: CLOSE_DETAIL,
            });
        });
        await this.audit.record({
            user,
            sessionId,
            action: `cashClose.${action}`,
            entity: 'cashClose',
            id,
            patch: { revisionEstado: row.revisionEstado, ...(action === 'observar' ? { motivo: row.revisionMotivo } : {}) },
            affects: open ? ['movement'] : [],
        });
        return row;
    }
};
exports.CashCloseService = CashCloseService;
exports.CashCloseService = CashCloseService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], CashCloseService);
//# sourceMappingURL=cash-close.service.js.map