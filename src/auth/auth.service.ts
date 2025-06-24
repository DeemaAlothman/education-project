// 3. تحديث Auth Service
// src/auth/auth.service.ts
import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
import { CreateUserDto } from '../users/dto/create-user.dto';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../users/enums/user-role.enum';
@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.usersService.findByUsername(username);
    if (!user) return null;

    const isPasswordValid = await user.validatePassword(password);
    if (isPasswordValid) {
      user.lastLogin = new Date();
      await this.usersService.update(user.user_id, {
        lastLogin: user.lastLogin,
      });
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(loginDto: { username: string; password: string }) {
    const user = await this.validateUser(loginDto.username, loginDto.password);
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      username: user.username,
      sub: user.user_id,
      role: user.role,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.user_id,
        username: user.username,
        role: user.role,
        academic_year: user.academic_year,
      },
    };
  }

  // تسجيل الطلاب
  async register(createUserDto: CreateUserDto) {
    const existingUser = await this.usersService.findByUsername(
      createUserDto.username,
    );
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    return this.usersService.create({
      username: createUserDto.username,
      password: hashedPassword,
      role: UserRole.STUDENT,
      academic_year: createUserDto.academic_year,
      phone: createUserDto.phone,
      department_id: createUserDto.department_id, // ← أضف هذا السطر
    });
  }

  async createAdmin(createUserDto: CreateUserDto, currentUser: any) {
    console.log('currentUser.role:', currentUser.role); // طباعة الدور اللي جاي مع التوكن

    if (currentUser.role !== UserRole.SUPERADMIN) {
      throw new UnauthorizedException(
        'Only superadmin can create admin accounts',
      );
    }

    const existingUser = await this.usersService.findByUsername(
      createUserDto.username,
    );
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    return this.usersService.create({
      username: createUserDto.username,
      password: hashedPassword,
      role: UserRole.ADMIN,
      phone: createUserDto.phone,
    });
  }

  async createDoctor(createUserDto: CreateUserDto, currentUser: any) {
    if (currentUser.role !== UserRole.ADMIN) {
      throw new UnauthorizedException('Only admin can create doctor accounts');
    }

    const existingUser = await this.usersService.findByUsername(
      createUserDto.username,
    );
    if (existingUser) {
      throw new ConflictException('Username already exists');
    }

    const hashedPassword = await bcrypt.hash(createUserDto.password, 10);

    return this.usersService.create({
      username: createUserDto.username,
      password: hashedPassword,
      role: UserRole.DOCTOR,
      phone: createUserDto.phone,
    });
  }

  async logout(user: any) {
    // بشكل أساسي هنا ما في حاجة لعمل شيء لأن التوكن موجود عند العميل فقط
    // لكن ممكن تضيف لوج أو تنفذ أي منطق آخر لو حابب
    return { message: `User ${user.username} logged out successfully` };
  }
}
