import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES } from '../policy/policy';

const ROLES_KEY = 'roles';
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext) {
    const roles = this.reflector.getAllAndOverride<string[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!roles?.length) return true;
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    if (user && readsLikeAdmin(user.role, request.method, roles)) return true;
    if (!user || !roles.includes(user.role)) {
      throw new ForbiddenException('Sin permiso para esta acción');
    }
    return true;
  }
}

/** Contabilidad reads whatever Gerencia reads (GET/HEAD); what it may change is decided by the policy of each action. */
function readsLikeAdmin(role: string, method: string, roles: string[]) {
  return role === ROLES.CONTA && (method === 'GET' || method === 'HEAD') && roles.includes(ROLES.ADMIN);
}
