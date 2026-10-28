import { ConflictException, ForbiddenException, Injectable, Logger, NotFoundException, OnModuleDestroy } from '@nestjs/common';
import type { User } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { canRegisterMovements, isAdmin } from '../../common/policy/policy';
import { ListDigicorpQuery } from './dto/digicorp.dto';
import { blockedReason, parseDetail, parseListPage, productUrl, syncDue } from './domain/digicorp.rules';

const API = 'https://nweb.apidigicorp.com/api_neweb/api';
const PAGE = 100;
/** A fixed pace between pages (one connection, about 50 pages a month): light on their server. */
const PAUSE_MS = 3000;
const DAY_MS = 24 * 60 * 60 * 1000;
const DETAIL_TTL_MS = 30 * DAY_MS;

class Blocked extends Error {}

/**
 * Digicorp's public catalog as an internal reference (DIGI-01, owner 2026-10-27). The listing is loaded once and
 * refreshed monthly; the detail of a product is fetched when someone opens it. A plain client with no H&S data and no
 * disguise: if Digicorp refuses (403, 429 or a challenge page) the sync stops and says so — it is never retried or
 * evaded. The monthly refresh only runs where `DIGICORP_AUTO_SYNC=1` (production), never in tests.
 */
@Injectable()
export class DigicorpService implements OnModuleDestroy {
  private readonly logger = new Logger(DigicorpService.name);
  private timer?: NodeJS.Timeout;
  private running = false;

  constructor(private readonly prisma: PrismaService) {}

  /** Called by main.ts after app.listen(): nothing runs before the port is open. */
  startTimers() {
    if (process.env.DIGICORP_AUTO_SYNC !== '1') return;
    const check = () => this.syncIfDue().catch((err) => this.logger.error(`Tienda Digicorp: ${err}`));
    check();
    this.timer = setInterval(check, DAY_MS);
    this.timer.unref();
  }

  onModuleDestroy() {
    clearInterval(this.timer);
  }

  private assertRead(user: User) {
    if (!canRegisterMovements(user)) throw new ForbiddenException('Sin acceso a la tienda Digicorp');
  }

  private async get(path: string) {
    const response = await fetch(`${API}/${path}`, { headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(20000) });
    const blocked = blockedReason(response.status, response.headers.get('content-type'));
    if (blocked) throw new Blocked(blocked);
    if (!response.ok) throw new Error(`Digicorp respondió ${response.status}`);
    return response.json();
  }

  async syncIfDue(now = new Date()) {
    const last = await this.prisma.digicorpSync.findFirst({ where: { estado: 'ok' }, orderBy: { iniciadoAt: 'desc' } });
    if (syncDue(last?.terminadoAt ?? null, now)) await this.run(null);
  }

  /** Gerencia: "Actualizar ahora". Answers at once; the sync runs in the background (a few minutes). */
  async startSync(user: User) {
    if (!isAdmin(user)) throw new ForbiddenException('Solo Administración o Contabilidad actualizan la tienda Digicorp');
    if (this.running) throw new ConflictException('Ya se está actualizando');
    const sync = await this.prisma.digicorpSync.create({ data: { iniciadoPorId: user.id } });
    void this.run(sync.id).catch((err) => this.logger.error(`Tienda Digicorp: ${err}`));
    return sync;
  }

  /** The whole listing, page by page; products not found in a complete run are marked withdrawn. */
  private async run(syncId: string | null) {
    if (this.running) return;
    this.running = true;
    const sync = syncId ? { id: syncId } : await this.prisma.digicorpSync.create({ data: {} });
    const startedAt = new Date();
    const counts = { paginas: 0, nuevos: 0, cambiados: 0 };
    try {
      for (let offset = 0; ; offset += PAGE) {
        if (offset) await new Promise((r) => setTimeout(r, PAUSE_MS));
        const rows = parseListPage(await this.get(`Producto/publico?limit=${PAGE}&offset=${offset}`));
        counts.paginas += 1;
        for (const row of rows) {
          const before = await this.prisma.digicorpProducto.findUnique({ where: { sku: row.sku }, select: { hash: true } });
          if (!before) counts.nuevos += 1;
          else if (before.hash !== row.hash) counts.cambiados += 1;
          await this.prisma.digicorpProducto.upsert({
            where: { sku: row.sku },
            create: { ...row, vistoAt: new Date() },
            update: { ...row, vistoAt: new Date(), retiradoAt: null },
          });
        }
        await this.prisma.digicorpSync.update({ where: { id: sync.id }, data: counts });
        if (rows.length < PAGE) break;
      }
      const { count: retirados } = await this.prisma.digicorpProducto.updateMany({ where: { vistoAt: { lt: startedAt }, retiradoAt: null }, data: { retiradoAt: new Date() } });
      await this.prisma.digicorpSync.update({ where: { id: sync.id }, data: { ...counts, retirados, estado: 'ok', terminadoAt: new Date() } });
      this.logger.log(`Tienda Digicorp: ${counts.paginas} páginas, ${counts.nuevos} nuevos, ${counts.cambiados} cambiados, ${retirados} retirados`);
    } catch (err) {
      const blocked = err instanceof Blocked;
      await this.prisma.digicorpSync.update({ where: { id: sync.id }, data: { ...counts, estado: blocked ? 'bloqueado' : 'error', error: String((err as Error).message), terminadoAt: new Date() } });
      this.logger.warn(`Tienda Digicorp ${blocked ? 'bloqueada' : 'con error'}: ${(err as Error).message}`);
    } finally {
      this.running = false;
    }
  }

  /** Search the catalog (code, name, brand), newest first; the last sync tells how fresh it is. */
  async list(query: ListDigicorpQuery, user: User) {
    this.assertRead(user);
    const q = query.q?.trim();
    const where = {
      retiradoAt: null,
      ...(query.marca ? { marca: query.marca } : {}),
      ...(q ? { OR: [{ sku: { contains: q } }, { nombre: { contains: q } }, { marca: { contains: q } }] } : {}),
    };
    const [total, items, marcas, ultimaSync] = await Promise.all([
      this.prisma.digicorpProducto.count({ where }),
      this.prisma.digicorpProducto.findMany({ where, orderBy: { nombre: 'asc' }, skip: query.offset ?? 0, take: query.limit ?? 48 }),
      this.prisma.digicorpProducto.groupBy({ by: ['marca'], where: { retiradoAt: null }, _count: true, orderBy: { marca: 'asc' } }),
      this.prisma.digicorpSync.findFirst({ orderBy: { iniciadoAt: 'desc' } }),
    ]);
    return {
      total,
      items: items.map((p) => ({ ...p, url: productUrl(p.sku) })),
      marcas: marcas.filter((m) => m.marca).map((m) => ({ marca: m.marca, cantidad: m._count })),
      ultimaSync,
      actualizando: this.running,
    };
  }

  /** One product; its detail (description, stock, section) is fetched when missing or older than 30 days. */
  async detail(sku: string, user: User) {
    this.assertRead(user);
    const row = await this.prisma.digicorpProducto.findUnique({ where: { sku } });
    if (!row) throw new NotFoundException('Producto no encontrado en la tienda Digicorp');
    if (row.detalleAt && Date.now() - row.detalleAt.getTime() < DETAIL_TTL_MS) return { ...row, url: productUrl(sku) };
    try {
      const detail = parseDetail(await this.get(`Producto/producto/publico/${encodeURIComponent(sku)}`));
      const updated = await this.prisma.digicorpProducto.update({ where: { sku }, data: { ...detail, detalleAt: new Date() } });
      return { ...updated, url: productUrl(sku) };
    } catch (err) {
      // What is saved is still useful: show it and say why it could not be refreshed.
      return { ...row, url: productUrl(sku), aviso: `No se pudo actualizar el detalle: ${(err as Error).message}` };
    }
  }
}
