import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private usersService: UsersService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('JWT_SECRET is not defined in environment variables');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: any) {
    try {
      const user = await this.usersService.findOne(payload.sub);

      if (!user) {
        throw new UnauthorizedException('User is inactive or not found');
      }

      const userData = {
        id: user.user_id,
        username: user.username,
        role: user.role.toString(), // تحويل enum إلى سلسلة نصية
      };
      console.log('JwtStrategy - validate userData:', userData); // سجل للتصحيح
      return userData;
    } catch (error) {
      console.log('JwtStrategy - validation error:', error.message); // سجل للتصحيح
      throw new UnauthorizedException('Invalid token');
    }
  }
}
