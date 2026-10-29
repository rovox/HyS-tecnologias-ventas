import type { User } from '@prisma/client';
import { ListDigicorpQuery } from './dto/digicorp.dto';
import { DigicorpService } from './digicorp.service';
export declare class DigicorpController {
    private readonly digicorp;
    constructor(digicorp: DigicorpService);
    list(query: ListDigicorpQuery, user: User): Promise<{
        total: number;
        items: {
            url: string;
            nombre: string;
            createdAt: Date;
            updatedAt: Date;
            descripcion: string | null;
            marca: string;
            imagenUrl: string;
            sku: string;
            imagenGrandeUrl: string;
            seccion: string;
            categoriaCodigo: string;
            stockTotal: number | null;
            moneda: string;
            hash: string;
            vistoAt: Date;
            detalleAt: Date | null;
            retiradoAt: Date | null;
        }[];
        marcas: {
            marca: string;
            cantidad: number;
        }[];
        ultimaSync: {
            error: string | null;
            id: string;
            estado: string;
            iniciadoAt: Date;
            terminadoAt: Date | null;
            paginas: number;
            nuevos: number;
            cambiados: number;
            retirados: number;
            iniciadoPorId: string | null;
        } | null;
        actualizando: boolean;
    }>;
    detail(sku: string, user: User): Promise<{
        url: string;
        nombre: string;
        createdAt: Date;
        updatedAt: Date;
        descripcion: string | null;
        marca: string;
        imagenUrl: string;
        sku: string;
        imagenGrandeUrl: string;
        seccion: string;
        categoriaCodigo: string;
        stockTotal: number | null;
        moneda: string;
        hash: string;
        vistoAt: Date;
        detalleAt: Date | null;
        retiradoAt: Date | null;
    } | {
        url: string;
        aviso: string;
        nombre: string;
        createdAt: Date;
        updatedAt: Date;
        descripcion: string | null;
        marca: string;
        imagenUrl: string;
        sku: string;
        imagenGrandeUrl: string;
        seccion: string;
        categoriaCodigo: string;
        stockTotal: number | null;
        moneda: string;
        hash: string;
        vistoAt: Date;
        detalleAt: Date | null;
        retiradoAt: Date | null;
    }>;
    sync(user: User): Promise<{
        error: string | null;
        id: string;
        estado: string;
        iniciadoAt: Date;
        terminadoAt: Date | null;
        paginas: number;
        nuevos: number;
        cambiados: number;
        retirados: number;
        iniciadoPorId: string | null;
    }>;
}
