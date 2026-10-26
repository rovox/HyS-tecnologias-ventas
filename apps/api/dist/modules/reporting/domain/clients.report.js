"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.clientStatus = clientStatus;
const cents = (value) => Math.round(value * 100) / 100;
const OPEN_PROJECT = ['planificado', 'en_ejecucion', 'entregado'];
const OPEN_JOB = ['programado', 'en_proceso'];
function clientStatus(projects, jobs) {
    const saldoPendiente = cents([...projects, ...jobs].reduce((sum, x) => sum + x.saldo, 0));
    const proyectosEnCurso = projects.filter((p) => OPEN_PROJECT.includes(p.estado)).length;
    const trabajosEnCurso = jobs.filter((j) => OPEN_JOB.includes(j.estado)).length;
    const totalContratado = cents([...projects.filter((p) => p.estado !== 'anulado'), ...jobs.filter((j) => j.estado !== 'cancelado')].reduce((sum, x) => sum + Number(x.monto), 0));
    return {
        saldoPendiente,
        proyectosEnCurso,
        trabajosEnCurso,
        totalContratado,
        servicioEnCurso: proyectosEnCurso > 0 || trabajosEnCurso > 0 || saldoPendiente > 0,
    };
}
//# sourceMappingURL=clients.report.js.map