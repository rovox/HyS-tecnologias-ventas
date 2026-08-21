import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { User } from '@prisma/client';
import { promises as fs } from 'fs';
import * as path from 'path';
import { PrismaService } from '../prisma/prisma.service';
import { ActivityService } from '../auth/activity.service';
import { CreateQuotationDto } from './dto/quotation.dto';
import { assertCanMutateQuotes, isCont, isTec, quotationWhere } from '../auth/roles';

const FLOW: Record<string, string[]> = {
  borrador: ['enviado', 'rechazado'],
  enviado: ['aceptado', 'rechazado', 'borrador'],
  aceptado: ['rechazado'],
  rechazado: ['borrador'],
};

function uploadDir() {
  return path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'));
}

@Injectable()
export class QuotationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly activity: ActivityService,
  ) {}

  private async nextNumero() {
    const now = new Date();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    const base = `COT-${mm}${dd}${yy}`;
    const sameDay = await this.prisma.quotation.count({
      where: { OR: [{ numero: base }, { numero: { startsWith: `${base}-` } }] },
    });
    return sameDay === 0 ? base : `${base}-${sameDay + 1}`;
  }

  private async requireSucursal(id: string) {
    const row = await this.prisma.sucursal.findUnique({ where: { id } });
    if (!row) throw new BadRequestException('Sucursal no válida');
    return row;
  }

  private assertCommission(vendors: { commissionPct?: number }[]) {
    if (vendors.length === 1) return;
    const sum = vendors.reduce((total, row) => total + Number(row.commissionPct ?? 0), 0);
    if (Math.abs(sum - 100) > 0.05) {
      throw new BadRequestException('Las comisiones de los vendedores deben sumar 100%');
    }
  }

  list(filters: { estado?: string; vendedorId?: string; sucursalId?: string }, user: User) {
    if (isTec(user)) throw new ForbiddenException('Sin acceso a cotizaciones');
    return this.prisma.quotation.findMany({
      where: {
        ...quotationWhere(user),
        ...(filters.estado ? { estado: filters.estado } : {}),
        ...(filters.vendedorId && !isCont(user) ? { vendedorId: filters.vendedorId } : {}),
        ...(filters.sucursalId ? { sucursalId: filters.sucursalId } : {}),
      },
      include: { sellers: true, cliente: true, sucursal: true, sale: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(id: string, user?: User) {
    const row = await this.prisma.quotation.findFirst({
      where: { id, ...(user ? quotationWhere(user) : {}) },
      include: { sellers: true, cliente: true, sucursal: true, sale: { include: { jobs: true, payments: true } } },
    });
    if (!row) throw new NotFoundException('Cotización no encontrada');
    return row;
  }

  async create(dto: CreateQuotationDto, user: User, sessionId?: string) {
    assertCanMutateQuotes(user);
    const client = await this.prisma.client.findUnique({ where: { id: dto.clienteId } });
    if (!client) throw new BadRequestException('Cliente no encontrado');
    const sucursal = await this.requireSucursal(dto.sucursalId);
    const vendors = dto.vendedores.filter((row) => row.userId);
    if (vendors.length === 0) throw new BadRequestException('Selecciona al menos un vendedor');
    this.assertCommission(vendors);
    const numero = await this.nextNumero();
    const primary = vendors[0];
    const quote = await this.prisma.quotation.create({
      data: {
        numero,
        titulo: dto.titulo.trim(),
        categoria: dto.categoria,
        categoriaId: dto.categoriaId,
        subcategoria: dto.subcategoria || '',
        sucursalId: sucursal.id,
        sucursalNombre: sucursal.nombre,
        clienteId: dto.clienteId,
        estado: 'borrador',
        monto: dto.monto,
        observacion: dto.observacion || '',
        archivo: dto.archivo || '',
        vendedorId: primary.userId,
        sellers: {
          create: vendors.map((row) => ({
            userId: row.userId,
            nombre: row.nombre || '',
            commissionPct: row.commissionPct ?? (vendors.length === 1 ? 100 : 0),
          })),
        },
      },
      include: { sellers: true, cliente: true, sucursal: true },
    });
    await this.prisma.touchClientActivity(dto.clienteId);
    await this.activity.log(user.id, sessionId, 'quotation.create', 'quotation', quote.id);
    return quote;
  }

  async updateStatus(id: string, estado: string, user: User, sessionId?: string, motivoRechazo?: string) {
    assertCanMutateQuotes(user);
    const current = await this.get(id, user);
    const allowed = FLOW[current.estado] || [];
    if (!allowed.includes(estado)) {
      throw new BadRequestException(`Transición inválida: ${current.estado} → ${estado}`);
    }
    if (estado === 'enviado' && !current.archivoPdfUrl) {
      throw new BadRequestException('Adjunta el PDF antes de enviar la cotización');
    }
    if (estado === 'rechazado' && !motivoRechazo?.trim() && current.estado !== 'borrador') {
      // Motivo opcional en borrador; recomendado al rechazar un envío
    }
    const quote = await this.prisma.quotation.update({
      where: { id },
      data: {
        estado,
        ...(estado === 'rechazado' ? { motivoRechazo: motivoRechazo || current.motivoRechazo } : {}),
      },
    });
    await this.prisma.touchClientActivity(current.clienteId);
    await this.activity.log(user.id, sessionId, 'quotation.status', 'quotation', id);
    return quote;
  }

  async attachFile(id: string, file: { buffer?: Buffer; path?: string; originalname?: string }, user: User, sessionId?: string) {
    assertCanMutateQuotes(user);
    await this.get(id, user);
    const bytes = file?.buffer?.length ? file.buffer : file?.path ? await fs.readFile(file.path) : null;
    if (!bytes?.length) throw new BadRequestException('Archivo vacío');
    const ext = path.extname(file.originalname || '').toLowerCase() || '.bin';
    const safeExt = ['.pdf', '.png', '.jpg', '.jpeg', '.webp'].includes(ext) ? ext : '.bin';
    const stored = `${id}-${Date.now()}${safeExt}`;
    const dir = uploadDir();
    await fs.mkdir(dir, { recursive: true });
    const full = path.join(dir, stored);
    await fs.writeFile(full, bytes);
    const archivoPdfUrl = `/api/files/quotations/${stored}`;
    const quote = await this.prisma.quotation.update({
      where: { id },
      data: { archivo: file.originalname || stored, archivoPdfUrl },
    });
    await this.activity.log(user.id, sessionId, 'quotation.file', 'quotation', id);
    return quote;
  }

  async filePath(name: string, user: User) {
    const safe = path.basename(name);
    const full = path.join(uploadDir(), safe);
    const quote = await this.prisma.quotation.findFirst({
      where: {
        ...quotationWhere(user),
        OR: [{ archivoPdfUrl: { contains: safe } }, { archivo: safe }],
      },
    });
    if (!quote) throw new ForbiddenException('Sin acceso a este archivo');
    try {
      await fs.access(full);
    } catch {
      throw new NotFoundException('Archivo no encontrado');
    }
    return full;
  }

  async accept(id: string, user: User, sessionId?: string) {
    assertCanMutateQuotes(user);
    const current = await this.get(id, user);
    if (current.sale) return { quotation: current, sale: current.sale, alreadyConverted: true };
    if (current.estado === 'rechazado') throw new BadRequestException('Una cotización rechazada no crea venta');
    if (current.estado !== 'enviado' && current.estado !== 'aceptado') {
      throw new BadRequestException('La cotización no se puede aceptar');
    }
    const sale = await this.prisma.$transaction(async (tx) => {
      await tx.quotation.update({ where: { id }, data: { estado: 'aceptado' } });
      return tx.sale.create({
        data: {
          quotationId: id,
          total: current.monto,
          jobs: {
            create: {
              titulo: current.titulo,
              estado: 'programado',
              monto: current.monto,
            },
          },
        },
        include: { jobs: true, payments: true },
      });
    });
    await this.prisma.touchClientActivity(current.clienteId);
    await this.activity.log(user.id, sessionId, 'quotation.accept', 'sale', sale.id);
    const quotation = await this.get(id, user);
    return { quotation, sale, alreadyConverted: false };
  }
}
