import { CanActivate, ExecutionContext, ForbiddenException, Injectable, SetMetadata } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { MANAGER_ROLES, ROLES } from '../policy/policy';

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
    if (user && actsAsAdmin(user.role, roles)) return true;
    if (!user || !roles.includes(user.role)) {
      throw new ForbiddenException('Sin permiso para esta acción');
    }
    return true;
  }
}

/** Contabilidad has the same permissions as ADMINISTRADOR (ROLE-01): it passes wherever Gerencia does. */
function actsAsAdmin(role: string, roles: string[]) {
  return MANAGER_ROLES.includes(role) && roles.includes(ROLES.ADMIN);
}
