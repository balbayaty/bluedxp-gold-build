const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
  try {
    // Hash a known password
    const newPassword = 'Admin123!@#';
    const hash = await bcrypt.hash(newPassword, 12);
    
    // Update the superadmin user
    const updated = await prisma.user.update({
      where: { email: 'superadmin@hazalyze.com' },
      data: { 
        passwordHash: hash,
        failedLoginAttempts: 0,
        lockedUntil: null
      }
    });
    
    console.log('Password reset for:', updated.email);
    console.log('New password:', newPassword);
    
    // Also create an admin@bluedxp.com user if it doesn't exist
    const existingAdmin = await prisma.user.findUnique({
      where: { email: 'admin@bluedxp.com' }
    });
    
    if (!existingAdmin) {
      const adminUser = await prisma.user.create({
        data: {
          email: 'admin@bluedxp.com',
          name: 'System Admin',
          passwordHash: hash,
          role: 'SYSTEM_ADMIN',
          status: 'ACTIVE',
          tenantId: 'default',
          failedLoginAttempts: 0
        }
      });
      console.log('Created admin@bluedxp.com user');
    } else {
      await prisma.user.update({
        where: { email: 'admin@bluedxp.com' },
        data: { 
          passwordHash: hash,
          failedLoginAttempts: 0,
          lockedUntil: null
        }
      });
      console.log('Updated admin@bluedxp.com password');
    }
    
  } catch (err) {
    console.log('Error:', err.message);
  }
}

main().finally(() => prisma.$disconnect());
