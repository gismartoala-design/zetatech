/**
 * Script para crear usuario admin en PostgreSQL
 * Email: admin@difiori.com.ec
 * Password: admin123
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function createAdminUser() {
  try {
    console.log('🔧 Creando usuario admin...\n');

    const adminEmail = 'admin@difiori.com.ec';
    const adminPassword = 'admin123';

    console.log(`📧 Email: ${adminEmail}`);
    console.log(`🔑 Password: ${adminPassword}\n`);

    // 1. Buscar o crear compañía
    let company = await prisma.company.findFirst();
    if (!company) {
      company = await prisma.company.create({
        data: {
          name: 'Difiori Floristería',
          slug: 'difiori',
          email: adminEmail,
        },
      });
      console.log('✅ Compañía creada:', company.name);
    } else {
      console.log('✅ Compañía encontrada:', company.name);
    }

    // 2. Hash de la contraseña
    const hashedPassword = await bcrypt.hash(adminPassword, 12);
    console.log('🔐 Contraseña hasheada\n');

    // 3. Crear o actualizar usuario admin
    const admin = await prisma.users.upsert({
      where: { email: adminEmail },
      update: {
        password: hashedPassword,
        isActive: true,
      },
      create: {
        companyId: company.id,
        email: adminEmail,
        name: 'Admin Difiori',
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true,
      },
    });

    console.log('✅ Usuario admin creado/actualizado:\n');
    console.log(`   ID: ${admin.id}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Name: ${admin.name}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Active: ${admin.isActive}\n`);

    console.log('🎉 ¡Usuario listo! Puedes iniciar sesión con:');
    console.log(`   Email: ${adminEmail}`);
    console.log(`   Password: ${adminPassword}`);

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminUser();