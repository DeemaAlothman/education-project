import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../public.decorator'; // عدل المسار حسب موقع ملف public.decorator.ts

@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  constructor(private reflector: Reflector) {
    super();
  }

  canActivate(context: ExecutionContext) {
    // تحقق إذا الميثود أو الكنترولر معلمة بـ @Public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true; // تجاهل التحقق من التوكن (أي السماح)
    }

    return super.canActivate(context); // تابع التحقق الطبيعي
  }
}
