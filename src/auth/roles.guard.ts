import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './public.decorator'; // عدل المسار حسب موقع ملف public.decorator.ts

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    // تحقق إذا الميثود أو الكنترولر معلمة بـ @Public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true; // تجاهل التحقق من الأدوار (أي السماح)
    }

    const requiredRoles = this.reflector.get<string[]>(
      'roles',
      context.getHandler(),
    );
    if (!requiredRoles) {
      return true; // لا توجد أدوار مطلوبة، السماح
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user || !user.role) {
      throw new ForbiddenException('No user or role found');
    }

    const userRole =
      typeof user.role === 'string'
        ? user.role.toLowerCase()
        : user.role.toString().toLowerCase();

    const hasRole = requiredRoles.some(
      (role) => role.toLowerCase() === userRole,
    );

    if (!hasRole) {
      throw new ForbiddenException('You do not have permission (roles)');
    }

    return true;
  }
}
