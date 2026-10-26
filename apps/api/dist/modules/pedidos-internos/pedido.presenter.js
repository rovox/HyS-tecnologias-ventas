"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PEDIDO_INCLUDE = void 0;
exports.presentPedidos = presentPedidos;
const codes_1 = require("../../common/domain/codes");
const pedidos_internos_rules_1 = require("./domain/pedidos-internos.rules");
const PERSON = { select: { id: true, name: true } };
exports.PEDIDO_INCLUDE = {
    responsable: PERSON,
    solicitante: PERSON,
    sucursalOrigen: { select: { id: true, nombre: true } },
    items: true,
    _count: { select: { comentarios: true } },
};
async function presentPedidos(prisma, rows) {
    const ids = (pick) => [...new Set(rows.map(pick).filter((v) => Boolean(v)))];
    const [branches, jobs, people] = await Promise.all([
        prisma.sucursal.findMany({ where: { id: { in: ids((r) => r.sucursalDestinoId) } }, select: { id: true, nombre: true } }),
        prisma.schedule.findMany({
            where: { id: { in: ids((r) => r.cronogramaId) } },
            select: {
                id: true,
                descripcionTrabajo: true,
                fechaProgramada: true,
                estado: true,
                cliente: { select: { id: true, nombre: true } },
                project: { select: { id: true, codigo: true } },
            },
        }),
        prisma.user.findMany({ where: { id: { in: ids((r) => r.entregadoPorId) } }, select: { id: true, name: true } }),
    ]);
    const byId = (list) => new Map(list.map((x) => [x.id, x]));
    const branch = byId(branches);
    const job = byId(jobs);
    const person = byId(people);
    return rows.map((r) => {
        const items = r.items.map((i) => ({ ...i, cantidad: Number(i.cantidad), costoUnitario: i.costoUnitario == null ? null : Number(i.costoUnitario) }));
        const trabajo = r.cronogramaId ? job.get(r.cronogramaId) ?? null : null;
        return {
            ...r,
            items: items.map((i) => ({ ...i, costoTotal: (0, pedidos_internos_rules_1.itemTotal)(i) })),
            codigo: (0, codes_1.orderCode)(r.id),
            destino: trabajo
                ? { tipo: 'trabajo', trabajo }
                : { tipo: 'sucursal', sucursal: r.sucursalDestinoId ? branch.get(r.sucursalDestinoId) ?? null : null },
            entregadoPor: r.entregadoPorId ? person.get(r.entregadoPorId) ?? null : null,
            costoTotal: (0, pedidos_internos_rules_1.pedidoTotal)(items),
            transicionesValidas: (0, pedidos_internos_rules_1.nextStates)(r.estado),
        };
    });
}
//# sourceMappingURL=pedido.presenter.js.map