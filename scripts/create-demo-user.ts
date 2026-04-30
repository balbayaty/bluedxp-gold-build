/**
 * Create Demo User Script
 * Creates a demo admin user for testing without database
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Creating demo user...');

  try {
    // Hash password
    const passwordHash = await bcrypt.hash('demo123', 10);

    // Create demo user
    const user = await prisma.user.upsert({
      where: { email: 'admin@demo.com' },
      update: {},
      create: {
        id: 'demo-user-1',
        email: 'admin@demo.com',
        name: 'Demo Admin',
        passwordHash: passwordHash,
        role: 'SYSTEM_ADMIN',
        status: 'ACTIVE',
        tenantId: 'demo-tenant-1',
        emailVerified: true,
        failedLoginAttempts: 0,
        loginCount: 0,
        permissions: [],
        hierarchicalPermissions: {},
        moduleAccess: {},
        featureAccess: {},
        tabAccess: {},
        preferences: {
          theme: 'dark',
          language: 'en',
          timezone: 'Asia/Riyadh',
          dateFormat: 'MM/dd/yyyy',
          timeFormat: 'HH:mm',
          defaultView: 'table',
          notifications: { email: true, sms: false, push: true, desktop: true },
          dashboard: { widgets: [], layout: 'grid' },
        },
      },
    });

    console.log('✅ Demo user created successfully!');
    console.log('📧 Email: admin@demo.com');
    console.log('🔑 Password: demo123');
    console.log('👤 User ID:', user.id);
  } catch (error) {
    console.error('❌ Error creating demo user:', error);
    throw error;
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
