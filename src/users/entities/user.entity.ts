// src/users/entities/user.entity.ts
import * as bcrypt from 'bcrypt';

export class User {
  user_id: number;
  username: string;
  phone?: string;
  password: string;
  role: string;
  academic_year?: number;
  lastLogin?: Date;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  constructor(user: any) {
    this.user_id = user.user_id;
    this.username = user.username;
    this.phone = user.phone;
    this.password = user.password;
    this.role = user.role;
    this.academic_year = user.academic_year;
    this.lastLogin = user.lastLogin;
    this.isActive = user.isActive;
    this.createdAt = user.createdAt;
    this.updatedAt = user.updatedAt;
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}
