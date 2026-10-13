/**
 * Crea o actualiza el administrador inicial de Zetatech.
 * Requiere ADMIN_EMAIL, ADMIN_PASSWORD y DATABASE_URL en el .env.
 */
require("dotenv").config();
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function createAdminUser() {
  const adminEmail = String(process.env.ADMIN_EMAIL || "").trim().toLowerCase();
  const adminPassword = String(process.env.ADMIN_PASSWORD || "");

  if (!process.env.DATABASE_URL) throw new Error("Falta DATABASE_URL en el .env");
  if (!adminEmail || !adminPassword) throw new Error("Faltan ADMIN_EMAIL o ADMIN_PASSWORD en el .env");
  if (adminPassword.length < 8) throw new Error("ADMIN_PASSWORD debe tener al menos 8 caracteres");

  let company = await prisma.company.findFirst({ orderBy: { createdAt: "asc" } });
  if (!company) {
    company = await prisma.company.create({ data: { name: "Zetatech", slug: "zetatech", email: adminEmail } });
    console.log("Compañía Zetatech creada.");
  }

  const password = await bcrypt.hash(adminPassword, 12);
  const admin = await prisma.users.upsert({
    where: { email: adminEmail },
    update: { password, isActive: true, role: "ADMIN", companyId: company.id },
    create: {
      companyId: company.id,
      email: adminEmail,
      name: "Administrador Zetatech",
      password,
      role: "ADMIN",
      isActive: true,
    },
    select: { id: true, email: true, role: true, isActive: true },
  });

  console.log(`Administrador listo: ${admin.email} (${admin.role})`);
  console.log("La contraseña se tomó del .env y no se imprime por seguridad.");
}

createAdminUser()
  .catch((error) => {
    console.error("No se pudo crear el administrador:", error.message);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
