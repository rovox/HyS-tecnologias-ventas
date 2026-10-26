import type { User } from '@prisma/client';
import { UpdateSolicitudDto, WebhookSolicitudDto } from './dto/solicitud-web.dto';
import { SolicitudesWebService } from './solicitudes-web.service';
export declare class SolicitudesWebhookController {
    private readonly solicitudes;
    constructor(solicitudes: SolicitudesWebService);
    create(dto: WebhookSolicitudDto): Promise<{
        id: string;
    }>;
}
export declare class SolicitudesWebController {
    private readonly solicitudes;
    constructor(solicitudes: SolicitudesWebService);
    list(user: User, estado?: string, q?: string): import("@prisma/client").Prisma.PrismaPromise<{
        id: string;
        nombre: string;
        email: string;
        telefono: string;
        createdAt: Date;
        updatedAt: Date;
        detalle: string;
        clienteId: string | null;
        estado: string;
        empresa: string;
        notas: string;
        servicio: string;
        departamento: string;
        pagina: string;
        origen: string;
        convertidaAt: Date | null;
    }[]>;
    get(id: string, user: User): Promise<{
        id: string;
        nombre: string;
        email: string;
        telefono: string;
        createdAt: Date;
        updatedAt: Date;
        detalle: string;
        clienteId: string | null;
        estado: string;
        empresa: string;
        notas: string;
        servicio: string;
        departamento: string;
        pagina: string;
        origen: string;
        convertidaAt: Date | null;
    }>;
    update(id: string, dto: UpdateSolicitudDto, user: User, sessionId?: string): Promise<{
        id: string;
        nombre: string;
        email: string;
        telefono: string;
        createdAt: Date;
        updatedAt: Date;
        detalle: string;
        clienteId: string | null;
        estado: string;
        empresa: string;
        notas: string;
        servicio: string;
        departamento: string;
        pagina: string;
        origen: string;
        convertidaAt: Date | null;
    }>;
    convert(id: string, user: User, sessionId?: string): Promise<{
        solicitud: {
            id: string;
            nombre: string;
            email: string;
            telefono: string;
            createdAt: Date;
            updatedAt: Date;
            detalle: string;
            clienteId: string | null;
            estado: string;
            empresa: string;
            notas: string;
            servicio: string;
            departamento: string;
            pagina: string;
            origen: string;
            convertidaAt: Date | null;
        };
        client: {
            id: string;
            nombre: string;
            tipo: string;
            contacto: string;
            email: string;
            telefono: string;
            direccion: string;
            sucursalId: string;
            observaciones: string;
            mapsLink: string;
            lastActivityAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        } | null;
        created: boolean;
    }>;
}
