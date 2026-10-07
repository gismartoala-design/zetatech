// Crea la empresa y el usuario administrador inicial en la base configurada
// en admin-floreria/api/.env. Es idempotente: si ya existen, no los duplica
// ni pisa la contraseña actual.
//
// Uso: node scripts/bootstrap-company.js

require("dotenv").config();
const bcrypt = require("bcryptjs");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const COMPANY = {
  name: "Zetatech",
  slug: "zetatech",
  email: "hello@zetatech.ec",
  isActive: true,
  isSetup: true,
  allowedDomains: [
    "localhost:3000",
    "localhost:5000",
    "zetatech-591566273209.europe-west1.run.app",
  ],
};

async function main() {
  const adminEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "";
  if (!adminEmail || !adminPassword) {
    throw new Error("Faltan ADMIN_EMAIL y/o ADMIN_PASSWORD en el .env");
  }

  let company = await prisma.company.findUnique({ where: { slug: COMPANY.slug } });
  if (company) {
    console.log(`Empresa ya existente: ${company.name} (${company.id})`);
  } else {
    company = await prisma.company.create({ data: COMPANY });
    console.log(`Empresa creada: ${company.name} (${company.id})`);
  }

  const existingAdmin = await prisma.users.findUnique({ where: { email: adminEmail } });
  if (existingAdmin) {
    console.log(`Admin ya existente: ${existingAdmin.email} (rol ${existingAdmin.role})`);
  } else {
    const admin = await prisma.users.create({
      data: {
        email: adminEmail,
        name: "Administrador",
        password: await bcrypt.hash(adminPassword, 12),
        role: "ADMIN",
        isActive: true,
        companyId: company.id,
      },
    });
    console.log(`Admin creado: ${admin.email}`);
  }

  console.log(`\nSTOREFRONT_COMPANY_ID=${company.id}`);
}

main()
  .catch((error) => {
    console.error("Error en el bootstrap:", error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
