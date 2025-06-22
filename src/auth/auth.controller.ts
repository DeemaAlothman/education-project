
// src/auth/auth.controller.ts
import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CreateUserDto } from '../users/dto/create-user.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  async login(@Body() loginDto: { username: string; password: string }) {
    return this.authService.login(loginDto);
  }

  @Post('register')
  async register(@Body() createUserDto: CreateUserDto) {
    const user = await this.authService.register(createUserDto);
    return {
      message: 'User registered successfully',
      user: {
        id: user.user_id,
        username: user.username,
        role: user.role,
      },
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('profile')
  getProfile(@Request() req) {
    return req.user;
  }
  @UseGuards(JwtAuthGuard)
  @Post('create-admin')
  createAdmin(@Body() dto: CreateUserDto, @Request() req) {
    return this.authService.createAdmin(dto, req.user);
  }

  @UseGuards(JwtAuthGuard)
  @Post('create-doctor')
  createDoctor(@Body() dto: CreateUserDto, @Request() req) {
    return this.authService.createDoctor(dto, req.user);
  }
}
