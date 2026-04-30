const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const bcrypt = require('bcryptjs');

async function main() {
  try {
    const user = await prisma.user.findFirst({ 
      where: { email: 'superadmin@hazalyze.com' },
      select: { email: true, passwordHash: true, role: true }
    });
    
    if (user) {
      console.log('User:', user.email, user.role);
      console.log('Has password hash:', !!user.passwordHash);
      
      // Test common passwords
      const testPasswords = ['Admin123!@#', 'password123', 'admin123', 'SuperAdmin123!'];
      for (const pwd of testPasswords) {
        const valid = await bcrypt.compare(pwd, user.passwordHash);
        console.log(`Password "${pwd}": ${valid ? 'VALID' : 'invalid'}`);
      }
    } else {
      console.log('User not found');
    }
  } catch (err) {
    console.log('Error:', err.message);
  }
}

main().finally(() => prisma.$disconnect());
