import type { User } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { IncomeDto } from './dto/finance.dto';
type IncomeRef = {
    projectId?: string;
    scheduleId?: string;
    relevamientoId?: string;
};
export declare class IncomeService {
    private readonly prisma;
    private readonly audit;
    constructor(prisma: PrismaService, audit: AuditService);
    private target;
    register(ref: IncomeRef, dto: IncomeDto, user: User, sessionId?: string): Promise<{
        transicionesValidas: readonly string[];
        reembolsoPendiente: boolean;
        sucursal: {
            id: string;
            nombre: string;
        };
        relevamiento: {
            id: string;
            fecha: Date;
            tipoVisita: string;
        } | null;
        schedule: {
            id: string;
            descripcionTrabajo: string;
        } | null;
        project: {
            id: string;
            titulo: string;
            codigo: string;
        } | null;
        cliente: {
            id: string;
            nombre: string;
        } | null;
        caja: {
            id: string;
            nombre: string;
        } | null;
        cajaDestino: {
            id: string;
            nombre: string;
        } | null;
        registradoPor: {
            id: string;
            name: string;
        };
        validadoPor: {
            id: string;
            name: string;
        } | null;
        recibidoPor: {
            id: string;
            name: string;
        } | null;
        id: string;
        tipo: string;
        sucursalId: string;
        createdAt: Date;
        updatedAt: Date;
        clienteId: string | null;
        monto: import("@prisma/client/runtime/library").Decimal;
        estado: string;
        motivo: string | null;
        scheduleId: string | null;
        metodo: string;
        nota: string;
        relevamientoId: string | null;
        recibidoPorId: string | null;
        cajaId: string | null;
        concepto: string;
        fecha: Date;
        projectId: string | null;
        cajaDestinoId: string | null;
        pagadoPor: string | null;
        asunto: string | null;
        fechaLimite: Date | null;
        reembolsadoAt: Date | null;
        comprobanteUrl: string | null;
        reversaDeId: string | null;
        registradoPorId: string;
        validadoPorId: string | null;
        validadoAt: Date | null;
        medioPago: string | null;
        ventaDirectaId: string | null;
        rendidoAt: Date | null;
    }>;
}
export {};
