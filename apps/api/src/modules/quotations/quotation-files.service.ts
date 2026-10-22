import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import type { Prisma, User } from '@prisma/client';
import { promises as fs } from 'fs';
import * as path from 'path';
import { PrismaService } from '../../common/prisma/prisma.service';
import { AuditService } from '../../common/audit/audit.service';
import { assertCanMutateQuotes, quotationWhere } from '../../common/policy/roles';
import { editError } from './domain/quotations.rules';
import { QuotationsService } from './quotations.service';

function uploadDir() {
  return path.resolve(process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads'));
}

/** Quotation files: the PDF sent to the client and the licitación / prerequisite documents. */
@Injectable()
export class QuotationFilesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly quotations: QuotationsService,
  ) {}

  async attachFile(id: string, file: { buffer?: Buffer; path?: string; originalname?: string }, user: User, sessionId?: string, kind = 'pdf') {
    assertCanMutateQuotes(user);
    const quote = await this.quotations.get(id, user);
    const blocked = editError(quote, {});
    if (blocked) throw new BadRequestException(blocked);
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
    const isDocPack = kind === 'licitacion' || kind === 'prerequisito';
    const existing = Array.isArray(quote.licitacionArchivos)
      ? (quote.licitacionArchivos as { name?: string; url?: string; kind?: string }[])
      : [];
    const updated = await this.prisma.quotation.update({
      where: { id },
      data: isDocPack
        ? {
            ...(kind === 'licitacion' ? { tieneLicitacion: true } : {}),
            licitacionArchivos: [...existing, {
              name: file.originalname || stored,
              url: archivoPdfUrl,
              kind,
            }] as Prisma.InputJsonValue,
          }
        : { archivo: file.originalname || stored, archivoPdfUrl },
    });
    await this.audit.record({
      user,
      sessionId,
      action: kind === 'licitacion' ? 'quotation.licitacion-file' : kind === 'prerequisito' ? 'quotation.prerequisito-file' : 'quotation.file',
      entity: 'quotation',
      id,
      patch: { archivo: updated.archivo },
    });
    return this.quotations.get(id, user);
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
    const licensed = quote || (await this.prisma.quotation.findMany({
      where: quotationWhere(user),
      select: { id: true, licitacionArchivos: true },
    })).find((row) => JSON.stringify(row.licitacionArchivos || '').includes(safe));
    if (!licensed) throw new ForbiddenException('Sin acceso a este archivo');
    try {
      await fs.access(full);
    } catch {
      throw new NotFoundException('Archivo no encontrado');
    }
    return full;
  }
}
