import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );
    if (!requiredRoles) {
      console.log('RolesGuard - No roles required, allowing access');
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;
    console.log('RolesGuard - user:', user); // سجل للتصحيح
    console.log('RolesGuard - requiredRoles:', requiredRoles); // سجل للتصحيح

    if (!user || !user.role) {
      console.log('RolesGuard - No user or role found');
      throw new ForbiddenException('No user or role found');
    }

    // تحويل user.role إلى سلسلة نصية وتجاهل الحالة (case-insensitive)
    const userRole =
      typeof user.role === 'string'
        ? user.role.toLowerCase()
        : user.role.toString().toLowerCase();
    const hasRole = requiredRoles.some(
      (role) => role.toLowerCase() === userRole,
    );
    console.log('RolesGuard - hasRole:', hasRole); // سجل للتصحيح

    if (!hasRole) {
      throw new ForbiddenException('You do not have permission (roles)');
    }

    return true;
  }
}
