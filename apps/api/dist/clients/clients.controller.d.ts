import type { User } from '@prisma/client';
import { ClientsService } from './clients.service';
import { UpdateClientDto, UpsertClientDto } from './dto/upsert-client.dto';
export declare class ClientsController {
    private readonly clients;
    constructor(clients: ClientsService);
    list(user: User, q?: string, active?: string): Promise<{
        esActivo: boolean;
        esClienteContratado: boolean;
        cotizacionesCount: number;
        trabajosEnProceso: number;
        tareasCount: number;
        tareasRecientes: {
            id: string;
            titulo: string;
            estado: string;
            at: Date;
        }[];
        id: string;
        nombre: string;
        tipo: string;
        contacto: string;
        email: string;
        telefono: string;
        direccion: string;
        sucursalId: string;
        observaciones: string;
        lastActivityAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    history(id: string, user: User): Promise<{
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
            lastActivityAt: Date | null;
            createdAt: Date;
            updatedAt: Date;
        };
        events: {
            type: string;
            id: string;
            at: Date;
            titulo: string;
            detalle: string;
        }[];
    }>;
    get(id: string, user: User): Promise<{
        id: string;
        nombre: string;
        tipo: string;
        contacto: string;
        email: string;
        telefono: string;
        direccion: string;
        sucursalId: string;
        observaciones: string;
        lastActivityAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    create(dto: UpsertClientDto, user: User, sessionId?: string): Promise<{
        id: string;
        nombre: string;
        tipo: string;
        contacto: string;
        email: string;
        telefono: string;
        direccion: string;
        sucursalId: string;
        observaciones: string;
        lastActivityAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, dto: UpdateClientDto, user: User, sessionId?: string): Promise<{
        id: string;
        nombre: string;
        tipo: string;
        contacto: string;
        email: string;
        telefono: string;
        direccion: string;
        sucursalId: string;
        observaciones: string;
        lastActivityAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
