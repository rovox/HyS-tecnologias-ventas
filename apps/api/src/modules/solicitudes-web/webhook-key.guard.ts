import {
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Injectable,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { timingSafeEqual } from 'crypto';

type WebhookRequest = { ip?: string; headers: Record<string, string | string[] | undefined> };

const MAX_FAILURES = 10;
const WINDOW_MS = 10 * 60 * 1000;

/**
 * Server-to-server auth for the website webhook: header `X-HS-Webhook-Key`
 * must equal env `WEB_LEADS_KEY` (constant-time compare). Repeated wrong keys
 * from one IP are blocked for 10 minutes. Without the env var the endpoint
 * answers 503 instead of accepting anything.
 */
@Injectable()
export class WebhookKeyGuard implements CanActivate {
  private readonly failures = new Map<string, { count: number; resetAt: number }>();

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<WebhookRequest>();
    const expected = (process.env.WEB_LEADS_KEY || '').trim();
    if (!expected) {
      throw new ServiceUnavailableException('Webhook de solicitudes web no configurado (WEB_LEADS_KEY).');
    }

    const ip = req.ip || 'unknown';
    const now = Date.now();
    const entry = this.failures.get(ip);
    if (entry && entry.resetAt > now && entry.count >= MAX_FAILURES) {
      throw new HttpException('Demasiados intentos fallidos', HttpStatus.TOO_MANY_REQUESTS);
    }

    const given = String(req.headers['x-hs-webhook-key'] || '');
    const a = Buffer.from(given);
    const b = Buffer.from(expected);
    if (a.length === b.length && timingSafeEqual(a, b)) {
      this.failures.delete(ip);
      return true;
    }

    const fresh = !entry || entry.resetAt <= now;
    this.failures.set(ip, {
      count: fresh ? 1 : entry.count + 1,
      resetAt: fresh ? now + WINDOW_MS : entry.resetAt,
    });
    throw new UnauthorizedException('Clave de webhook inválida');
  }
}
