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
exports.LedgerService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../../common/prisma/prisma.service");
const audit_service_1 = require("../../common/audit/audit.service");
const policy_1 = require("../../common/policy/policy");
const calendar_1 = require("../../common/domain/calendar");
const ledger_export_rules_1 = require("./domain/ledger-export.rules");
const ledger_export_1 = require("./ledger-export");
const finance_rules_1 = require("./domain/finance.rules");
const movement_presenter_1 = require("./movement.presenter");
let LedgerService = class LedgerService {
    prisma;
    audit;
    constructor(prisma, audit) {
        this.prisma = prisma;
        this.audit = audit;
    }
    assertValidator(user) {
        if (!(0, policy_1.canValidateMovements)(user))
            throw new common_1.ForbiddenException('Solo Gerencia o Contabilidad validan movimientos y gestionan cajas');
    }
    async row(id) {
        const row = await this.prisma.cashMovement.findUnique({ where: { id }, include: movement_presenter_1.MOVEMENT_DETAIL });
        if (!row)
            throw new common_1.NotFoundException('Movimiento no encontrado');
        return row;
    }
    async get(id, user) {
        if (!(0, policy_1.canRegisterMovements)(user))
            throw new common_1.ForbiddenException('Sin acceso a finanzas');
        const row = await this.row(id);
        if (!(0, policy_1.canSeeLedger)(user) && row.registradoPorId !== user.id && row.recibidoPorId !== user.id)
            throw new common_1.ForbiddenException('Sin acceso a este movimiento');
        return (0, movement_presenter_1.presentMovement)(row);
    }
    listWhere(query, user) {
        return {
            AND: [
                (0, policy_1.canSeeLedger)(user) ? {} : { OR: [{ registradoPorId: user.id }, { recibidoPorId: user.id }] },
                query.cajaId ? { OR: [{ cajaId: query.cajaId }, { cajaDestinoId: query.cajaId }] } : {},
            ],
            ...(query.tipo ? { tipo: query.tipo } : {}),
            ...(query.estado ? { estado: query.estado } : {}),
            ...(query.projectId ? { projectId: query.projectId } : {}),
            ...(query.clienteId ? { clienteId: query.clienteId } : {}),
            ...(query.sucursalId ? { sucursalId: query.sucursalId } : {}),
            ...(query.desde || query.hasta
                ? { fecha: { ...(query.desde ? { gte: (0, calendar_1.businessDayStart)(query.desde.slice(0, 10)) } : {}), ...(query.hasta ? { lte: (0, calendar_1.businessDayEnd)(query.hasta.slice(0, 10)) } : {}) } }
                : {}),
        };
    }
    async list(query, user) {
        if (!(0, policy_1.canRegisterMovements)(user))
            throw new common_1.ForbiddenException('Sin acceso a finanzas');
        const rows = await this.prisma.cashMovement.findMany({
            where: this.listWhere(query, user),
            include: movement_presenter_1.MOVEMENT_DETAIL,
            orderBy: [{ fecha: 'desc' }, { createdAt: 'desc' }],
            take: 1000,
        });
        return rows.map(movement_presenter_1.presentMovement);
    }
    async export(query, user) {
        if (!(0, policy_1.canRegisterMovements)(user))
            throw new common_1.ForbiddenException('Sin acceso a finanzas');
        const movements = await this.prisma.cashMovement.findMany({
            where: this.listWhere(query, user),
            include: movement_presenter_1.MOVEMENT_DETAIL,
            orderBy: [{ fecha: 'asc' }, { createdAt: 'asc' }],
            take: 20000,
        });
        const sucursal = query.sucursalId ? await this.prisma.sucursal.findUnique({ where: { id: query.sucursalId } }) : null;
        const scope = sucursal ? sucursal.nombre : 'Toda la empresa';
        const period = query.desde && query.hasta && query.desde.slice(0, 10) === query.hasta.slice(0, 10) ? query.desde.slice(0, 10) : `${query.desde?.slice(0, 10) ?? 'inicio'} a ${query.hasta?.slice(0, 10) ?? 'hoy'}`;
        const name = `libro-${scope.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${period.replace(/ a /, '_')}.${query.formato}`;
        const rows = (0, ledger_export_rules_1.ledgerRows)(movements);
        const file = query.formato === 'xlsx' ? await (0, ledger_export_1.ledgerXlsx)(rows, (0, ledger_export_rules_1.ledgerSummary)(movements), `Libro ${period} · ${scope}`) : (0, ledger_export_1.ledgerCsv)(rows);
        return { file, name, type: query.formato === 'xlsx' ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' : 'text/csv; charset=utf-8' };
    }
    async create(dto, user, sessionId) {
        if (!(0, policy_1.canRegisterMovements)(user))
            throw new common_1.ForbiddenException('Sin acceso a finanzas');
        if (dto.tipo === 'ingreso' && ['adelanto', 'cobro', 'adicional'].includes(dto.concepto)) {
            throw new common_1.BadRequestException('Los cobros se registran desde el proyecto o el trabajo');
        }
        if (dto.tipo === 'ingreso' && !(0, policy_1.canSeeLedger)(user))
            throw new common_1.ForbiddenException('Solo ventas, Gerencia o Contabilidad registran otros ingresos');
        if (dto.tipo === 'transferencia')
            this.assertValidator(user);
        const error = (0, finance_rules_1.movementError)(dto) || (0, finance_rules_1.advanceError)(dto);
        if (error)
            throw new common_1.BadRequestException(error);
        if (dto.concepto === 'anticipo_por_rendir')
            await this.assertActiveUser(dto.responsableId);
        const project = dto.projectId ? await this.prisma.project.findUnique({ where: { id: dto.projectId } }) : null;
        if (dto.projectId && !project)
            throw new common_1.BadRequestException('Proyecto no encontrado');
        const sucursalId = dto.sucursalId || project?.sucursalId || user.sucursalId;
        if (!sucursalId)
            throw new common_1.BadRequestException('Indica la sucursal');
        const transfer = dto.tipo === 'transferencia';
        const row = await this.prisma.cashMovement.create({
            data: {
                tipo: dto.tipo,
                concepto: dto.concepto,
                monto: dto.monto,
                fecha: (0, finance_rules_1.movementDate)(dto.fecha),
                metodo: dto.metodo || '',
                nota: dto.nota || '',
                projectId: project?.id ?? null,
                clienteId: project?.clienteId ?? null,
                cajaId: transfer ? dto.cajaId : null,
                cajaDestinoId: transfer ? dto.cajaDestinoId : null,
                pagadoPor: dto.tipo === 'egreso' ? dto.pagadoPor : null,
                sucursalId,
                registradoPorId: user.id,
                ...(dto.tipo === 'ingreso' ? { recibidoPorId: user.id } : {}),
                ...(dto.concepto === 'anticipo_por_rendir' ? { recibidoPorId: dto.responsableId, asunto: dto.asunto.trim(), fechaLimite: new Date(`${dto.fechaLimite.slice(0, 10)}T12:00:00Z`) } : {}),
                ...(transfer ? { estado: 'validado', validadoPorId: user.id, validadoAt: new Date() } : {}),
            },
            include: movement_presenter_1.MOVEMENT_DETAIL,
        });
        await this.audit.record({ user, sessionId, action: `movement.${dto.tipo}`, entity: 'movement', id: row.id, affects: project ? ['project'] : [] });
        return (0, movement_presenter_1.presentMovement)(row);
    }
    async update(id, dto, user, sessionId) {
        const before = await this.row(id);
        if (before.ventaDirectaId)
            throw new common_1.BadRequestException('Es el cobro de una venta directa: se corrige anulando la venta');
        const manager = (0, policy_1.canValidateMovements)(user);
        if (before.registradoPorId !== user.id && !manager)
            throw new common_1.ForbiddenException('Solo quien lo registró, Gerencia o Contabilidad lo corrigen');
        const blocked = (0, finance_rules_1.editMovementError)(before, manager);
        if (blocked)
            throw new common_1.BadRequestException(blocked);
        if (dto.cajaId !== undefined && (!manager || before.estado !== 'validado' || before.tipo === 'transferencia')) {
            throw new common_1.BadRequestException('La caja se cambia solo en un movimiento validado, y lo hacen Gerencia o Contabilidad');
        }
        if (dto.cajaId)
            await this.assertBox(dto.cajaId);
        if (dto.recibidoPorId !== undefined) {
            if (before.tipo !== 'ingreso')
                throw new common_1.BadRequestException('Solo un ingreso tiene quién recibió el dinero');
            await this.assertActiveUser(dto.recibidoPorId);
        }
        const next = { tipo: before.tipo, concepto: dto.concepto ?? before.concepto, monto: dto.monto ?? Number(before.monto), cajaId: before.cajaId, cajaDestinoId: before.cajaDestinoId, pagadoPor: dto.pagadoPor ?? before.pagadoPor };
        const moneyChanged = (dto.monto !== undefined && dto.monto !== Number(before.monto)) || (dto.concepto !== undefined && dto.concepto !== before.concepto);
        const target = before.tipo === 'ingreso' && moneyChanged ? await this.target(before) : null;
        const counted = ['por_validar', 'validado'].includes(before.estado) && ['adelanto', 'cobro'].includes(before.concepto) ? Number(before.monto) : 0;
        const error = (0, finance_rules_1.movementError)(next) || (target ? (0, finance_rules_1.incomeError)({ ...target, cobrado: target.cobrado - counted }, next.concepto, next.monto) : null);
        if (error)
            throw new common_1.BadRequestException(error);
        const after = await this.prisma.cashMovement.update({
            where: { id },
            data: {
                ...(dto.concepto !== undefined ? { concepto: dto.concepto } : {}),
                ...(dto.monto !== undefined ? { monto: dto.monto } : {}),
                ...(dto.fecha !== undefined ? { fecha: (0, finance_rules_1.movementDate)(dto.fecha, new Date(), before.fecha) } : {}),
                ...(dto.metodo !== undefined ? { metodo: dto.metodo } : {}),
                ...(dto.nota !== undefined ? { nota: dto.nota } : {}),
                ...(dto.pagadoPor !== undefined && before.tipo === 'egreso' ? { pagadoPor: dto.pagadoPor } : {}),
                ...(dto.recibidoPorId !== undefined ? { recibidoPorId: dto.recibidoPorId } : {}),
                ...(dto.cajaId ? { cajaId: dto.cajaId } : {}),
                ...(before.estado === 'observado' ? { estado: 'por_validar', motivo: null } : {}),
            },
            include: movement_presenter_1.MOVEMENT_DETAIL,
        });
        await this.audit.record({ user, sessionId, action: 'movement.update', entity: 'movement', id, before, after, affects: this.affects(before) });
        return (0, movement_presenter_1.presentMovement)(after);
    }
    async transition(id, to, input, user, sessionId) {
        const before = await this.row(id);
        if (before.ventaDirectaId)
            throw new common_1.BadRequestException('Es el cobro de una venta directa: se corrige anulando la venta');
        const ownWaiting = to === 'anulado' && before.registradoPorId === user.id && before.estado !== 'validado';
        if (!ownWaiting)
            this.assertValidator(user);
        const check = (0, finance_rules_1.checkMovementTransition)(before, to, input);
        if (!check.ok)
            throw new common_1.BadRequestException(check.reason);
        if (to === 'validado' && input.cajaId)
            await this.assertBox(input.cajaId);
        const data = to === 'validado'
            ? {
                estado: 'validado',
                ...(before.tipo !== 'transferencia' ? { cajaId: input.cajaId } : {}),
                ...(before.tipo === 'ingreso' && before.fechaLimite && !before.rendidoAt ? { rendidoAt: new Date() } : {}),
                validadoPorId: user.id,
                validadoAt: new Date(),
                motivo: null,
            }
            : { estado: to, motivo: input.motivo.trim() };
        const after = await this.prisma.cashMovement.update({ where: { id }, data, include: movement_presenter_1.MOVEMENT_DETAIL });
        await this.audit.record({ user, sessionId, action: `movement.${to}`, entity: 'movement', id, before, after, affects: this.affects(before) });
        return (0, movement_presenter_1.presentMovement)(after);
    }
    async refund(id, user, sessionId) {
        this.assertValidator(user);
        const before = await this.row(id);
        if (!(0, finance_rules_1.pendingRefund)(before))
            throw new common_1.BadRequestException('No hay reembolso pendiente en este movimiento');
        const after = await this.prisma.cashMovement.update({ where: { id }, data: { reembolsadoAt: new Date() }, include: movement_presenter_1.MOVEMENT_DETAIL });
        await this.audit.record({ user, sessionId, action: 'movement.refund', entity: 'movement', id, before, after });
        return (0, movement_presenter_1.presentMovement)(after);
    }
    async summary(user, mes) {
        if (!(0, policy_1.canSeeLedger)(user))
            throw new common_1.ForbiddenException('Sin acceso al resumen de dinero');
        const today = (0, calendar_1.businessToday)(new Date());
        const month = /^\d{4}-\d{2}$/.test(mes ?? '') ? mes : today.slice(0, 7);
        const [y, mo] = month.split('-').map(Number);
        const lastDay = new Date(Date.UTC(y, mo, 0)).toISOString().slice(0, 10);
        const [movements, boxes, sucursales, sales, closes] = await Promise.all([
            this.prisma.cashMovement.findMany({ where: { fecha: { gte: (0, calendar_1.businessDayStart)(`${month}-01`), lte: (0, calendar_1.businessDayEnd)(lastDay) } }, select: { tipo: true, monto: true, estado: true } }),
            this.cashBoxes(user),
            this.prisma.sucursal.findMany({ orderBy: { nombre: 'asc' } }),
            this.prisma.directSale.groupBy({ by: ['sucursalId'], where: { estado: 'registrada', fecha: { gte: (0, calendar_1.businessDayStart)(today), lte: (0, calendar_1.businessDayEnd)(today) } }, _count: true, _sum: { total: true } }),
            this.prisma.cierreCaja.findMany({ where: { dia: today }, select: { sucursalId: true, diferencia: true } }),
        ]);
        return {
            mes: month,
            ...(0, finance_rules_1.monthMoney)(movements),
            cajas: boxes.map((b) => ({ id: b.id, nombre: b.nombre, sucursal: b.sucursal?.nombre, saldo: b.saldo })),
            hoy: sucursales.map((s) => {
                const sold = sales.find((x) => x.sucursalId === s.id);
                const closed = closes.find((c) => c.sucursalId === s.id);
                return { sucursal: { id: s.id, nombre: s.nombre }, ventas: sold?._count ?? 0, total: Number(sold?._sum.total ?? 0), cierre: closed ? { diferencia: Number(closed.diferencia) } : null };
            }),
        };
    }
    async cashBoxes(user) {
        if (!(0, policy_1.canRegisterMovements)(user))
            throw new common_1.ForbiddenException('Sin acceso a finanzas');
        const [boxes, movements] = await Promise.all([
            this.prisma.cashBox.findMany({ where: { active: true }, include: { sucursal: { select: { id: true, nombre: true } } }, orderBy: { nombre: 'asc' } }),
            this.prisma.cashMovement.findMany({ where: { estado: 'validado' }, select: { tipo: true, concepto: true, monto: true, estado: true, cajaId: true, cajaDestinoId: true } }),
        ]);
        return boxes.map((box) => ({ ...box, saldo: (0, finance_rules_1.cashBoxBalance)(box.id, movements) }));
    }
    async advances(user) {
        if (!(0, policy_1.canRegisterMovements)(user))
            throw new common_1.ForbiddenException('Sin acceso a finanzas');
        const rows = await this.prisma.cashMovement.findMany({
            where: {
                rendidoAt: null,
                OR: [{ concepto: 'anticipo_por_rendir', estado: { not: 'anulado' } }, { tipo: 'ingreso', fechaLimite: { not: null }, estado: { in: ['por_validar', 'observado'] } }],
                ...((0, policy_1.canSeeLedger)(user) ? {} : { recibidoPorId: user.id }),
            },
            include: movement_presenter_1.MOVEMENT_DETAIL,
            orderBy: { fechaLimite: 'asc' },
        });
        const today = (0, calendar_1.businessToday)(new Date());
        return rows.map((m) => ({ ...(0, movement_presenter_1.presentMovement)(m), diasAtraso: m.fechaLimite ? (0, finance_rules_1.daysLate)(m.fechaLimite, today) : 0 }));
    }
    async settleAdvance(id, nota, user, sessionId) {
        this.assertValidator(user);
        const before = await this.row(id);
        if (before.concepto !== 'anticipo_por_rendir')
            throw new common_1.BadRequestException('Solo un anticipo por rendir se rinde');
        if (before.rendidoAt)
            throw new common_1.BadRequestException('Este anticipo ya está rendido');
        if (before.estado === 'anulado')
            throw new common_1.BadRequestException('El anticipo está anulado');
        const after = await this.prisma.cashMovement.update({
            where: { id },
            data: { rendidoAt: new Date(), ...(nota?.trim() ? { nota: `${before.nota ? `${before.nota}\n` : ''}Rendido: ${nota.trim()}` } : {}) },
            include: movement_presenter_1.MOVEMENT_DETAIL,
        });
        await this.audit.record({ user, sessionId, action: 'movement.rendido', entity: 'movement', id, before, after });
        return (0, movement_presenter_1.presentMovement)(after);
    }
    async custody(user) {
        if (!(0, policy_1.canSeeLedger)(user))
            throw new common_1.ForbiddenException('Sin acceso a finanzas');
        const rows = await this.prisma.cashMovement.findMany({
            where: { tipo: 'ingreso', estado: 'por_validar', recibidoPorId: { not: null } },
            include: movement_presenter_1.MOVEMENT_DETAIL,
            orderBy: { fecha: 'asc' },
        });
        return (0, finance_rules_1.custody)(rows).map((group) => ({
            ...group,
            persona: group.movimientos[0].recibidoPor,
            movimientos: group.movimientos.map(movement_presenter_1.presentMovement),
        }));
    }
    async impact(id, query, user) {
        this.assertValidator(user);
        const m = await this.row(id);
        const [boxes, target] = await Promise.all([this.cashBoxes(user), this.target(m)]);
        const balances = Object.fromEntries(boxes.map((b) => [b.id, b.saldo]));
        const names = Object.fromEntries(boxes.map((b) => [b.id, b.nombre]));
        const efectos = (0, finance_rules_1.movementImpact)(m, query.accion, { boxes: balances, cajaId: query.cajaId, target });
        return {
            efectos: efectos.map((e) => (e.tipo === 'caja' ? { ...e, caja: names[e.cajaId] ?? e.cajaId } : { ...e, de: m.project?.codigo ?? m.schedule?.descripcionTrabajo ?? null })),
        };
    }
    async target(m) {
        if (!m.projectId && !m.scheduleId)
            return null;
        const where = m.projectId ? { projectId: m.projectId } : { scheduleId: m.scheduleId, projectId: null };
        const [owner, movements] = await Promise.all([
            m.projectId
                ? this.prisma.project.findUnique({ where: { id: m.projectId }, select: { montoOficial: true, estado: true } })
                : this.prisma.schedule.findUnique({ where: { id: m.scheduleId }, select: { monto: true, estado: true } }),
            this.prisma.cashMovement.findMany({ where, select: { tipo: true, concepto: true, monto: true, estado: true } }),
        ]);
        if (!owner)
            return null;
        const monto = Number('montoOficial' in owner ? owner.montoOficial : owner.monto);
        const cancelled = owner.estado === 'anulado' || owner.estado === 'cancelado';
        return { monto, cobrado: (0, finance_rules_1.incomeOf)(movements).cobrado, costo: (0, finance_rules_1.expensesOf)(movements), cancelled };
    }
    async assertBox(cajaId) {
        const box = await this.prisma.cashBox.findUnique({ where: { id: cajaId } });
        if (!box?.active)
            throw new common_1.BadRequestException('Caja no válida');
    }
    async assertActiveUser(userId) {
        const person = await this.prisma.user.findUnique({ where: { id: userId }, select: { active: true } });
        if (!person?.active)
            throw new common_1.BadRequestException('La persona que recibió el dinero no existe o está inactiva');
    }
    affects(m) {
        return [...(m.projectId ? ['project'] : []), ...(m.scheduleId ? ['schedule'] : []), 'client'];
    }
};
exports.LedgerService = LedgerService;
exports.LedgerService = LedgerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        audit_service_1.AuditService])
], LedgerService);
//# sourceMappingURL=ledger.service.js.map