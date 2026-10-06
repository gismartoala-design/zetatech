// Siembra datos de EJEMPLO en la base de prueba zetatech-review-db, para poder
// entrar al editor CMS (/app/cms/home) y revisarlo visualmente.
//
// Seguridad: este script SOLO lee variables de entorno desde .env.test
// (nunca desde .env) y se niega a correr si la URL no apunta a localhost,
// para evitar escribir por accidente en una base real.
//
// Uso: node scripts/seed-review-db.js

const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");

const envTestPath = path.join(__dirname, "..", ".env.test");
if (!fs.existsSync(envTestPath)) {
  console.error("No se encontró .env.test. Este script no debe usar .env real.");
  process.exit(1);
}
dotenv.config({ path: envTestPath });

const databaseUrl = process.env.DATABASE_URL || "";
if (!/^postgresql:\/\/[^@]+@(localhost|127\.0\.0\.1)[:/]/.test(databaseUrl)) {
  console.error(
    "DATABASE_URL de .env.test no apunta a localhost. Abortando por seguridad:",
    databaseUrl.replace(/:[^:@]+@/, ":****@"),
  );
  process.exit(1);
}

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });

const fixture = require("../prisma/fixtures/zetatech-review-seed.json");

async function main() {
  const company = await prisma.company.upsert({
    where: { slug: fixture.company.slug },
    update: fixture.company,
    create: fixture.company,
  });
  console.log(`Empresa lista: ${company.name} (${company.id})`);

  const passwordHash = await bcrypt.hash(fixture.admin.passwordPlain, 12);
  const admin = await prisma.users.upsert({
    where: { email: fixture.admin.email },
    update: {
      name: fixture.admin.name,
      role: fixture.admin.role,
      isActive: fixture.admin.isActive,
      companyId: company.id,
      password: passwordHash,
    },
    create: {
      email: fixture.admin.email,
      name: fixture.admin.name,
      role: fixture.admin.role,
      isActive: fixture.admin.isActive,
      companyId: company.id,
      password: passwordHash,
    },
  });
  console.log(`Admin listo: ${admin.email}`);

  for (const p of fixture.products) {
    const existing = await prisma.product.findFirst({
      where: { companyId: company.id, name: p.name },
    });
    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: { ...p, companyId: company.id, userId: admin.id },
      });
    } else {
      await prisma.product.create({
        data: { ...p, companyId: company.id, userId: admin.id },
      });
    }
  }
  console.log(`Productos de ejemplo listos: ${fixture.products.length}`);

  console.log("\nListo. Credenciales para entrar al admin:");
  console.log(`  Email:    ${fixture.admin.email}`);
  console.log(`  Password: ${fixture.admin.passwordPlain}`);
}

main()
  .catch((error) => {
    console.error("Error al sembrar datos de revisión:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
