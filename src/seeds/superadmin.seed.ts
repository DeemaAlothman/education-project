// src/seeds/superadmin.seed.ts
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function createSuperAdmin() {
  try {
    // تحقق من وجود superadmin
    const existingSuperAdmin = await prisma.users.findFirst({
      where: { role: 'superadmin' },
    });

    if (existingSuperAdmin) {
      console.log('SuperAdmin already exists');
      return;
    }

    // إنشاء superadmin
    const hashedPassword = await bcrypt.hash('SuperAdmin@123', 10);

    const superAdmin = await prisma.users.create({
      data: {
        username: 'superadmin',
        password: hashedPassword,
        role: 'superadmin',
        
      },
    });

    console.log('SuperAdmin created successfully:', superAdmin.username);
  } catch (error) {
    console.error('Error creating SuperAdmin:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSuperAdmin();
