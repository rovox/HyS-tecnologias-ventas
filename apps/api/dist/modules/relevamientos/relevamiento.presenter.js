"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VISIT_INCLUDE = void 0;
exports.fotosOf = fotosOf;
exports.presentVisits = presentVisits;
const relevamientos_rules_1 = require("./domain/relevamientos.rules");
const PERSON = { select: { id: true, name: true } };
exports.VISIT_INCLUDE = {
    cliente: { select: { id: true, nombre: true, telefono: true, direccion: true, mapsLink: true } },
    sucursal: { select: { id: true, nombre: true } },
    cotizacion: { select: { id: true, numero: true, titulo: true } },
    usuario: PERSON,
    trabajoRelacionado: {
        select: { id: true, descripcionTrabajo: true, fechaProgramada: true, estado: true, project: { select: { id: true, codigo: true } } },
    },
    movements: {
        select: { id: true, monto: true, metodo: true, estado: true, fecha: true, recibidoPor: PERSON },
        orderBy: { fecha: 'desc' },
    },
};
function fotosOf(fotosUrl) {
    if (Array.isArray(fotosUrl))
        return fotosUrl.map(String).filter(Boolean);
    if (fotosUrl && typeof fotosUrl === 'object' && Array.isArray(fotosUrl.urls)) {
        return (fotosUrl.urls || []).map(String).filter(Boolean);
    }
    return [];
}
async function presentVisits(prisma, rows) {
    const ids = [...new Set(rows.flatMap((r) => [r.tecnicoId, r.vendedorId]).filter((v) => Boolean(v)))];
    const people = new Map((await prisma.user.findMany({ where: { id: { in: ids } }, select: { id: true, name: true } })).map((u) => [u.id, u]));
    return rows.map((r) => ({
        ...r,
        tecnico: r.tecnicoId ? people.get(r.tecnicoId) ?? null : null,
        vendedor: r.vendedorId ? people.get(r.vendedorId) ?? null : null,
        fotos: fotosOf(r.fotosUrl),
        enGarantia: (0, relevamientos_rules_1.inWarranty)(r.garantiaHasta, r.fecha),
        movements: r.movements.map((m) => ({ ...m, monto: Number(m.monto) })),
        ...(0, relevamientos_rules_1.visitPayments)(r.movements),
        transicionesValidas: (0, relevamientos_rules_1.nextVisitStates)(r.estado),
    }));
}
//# sourceMappingURL=relevamiento.presenter.js.map