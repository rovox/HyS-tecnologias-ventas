import type { User } from '@prisma/client';
import { ClientsService } from './clients.service';
import { UpdateClientDto, UpsertClientDto } from './dto/upsert-client.dto';
export declare class ClientsController {
    private readonly clients;
    constructor(clients: ClientsService);
    list(user: User, q?: string): import("@prisma/client").Prisma.PrismaPromise<({
        sucursal: {
            id: string;
            nombre: string;
        };
    } & {
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
    })[]>;
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
        mapsLink: string;
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
        mapsLink: string;
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
        mapsLink: string;
        lastActivityAt: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
