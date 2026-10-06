import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();

const db = new PrismaClient();

async function main() {
  console.log("Creating admin user...");

  // Obtener credenciales del .env
  const adminEmail = (process.env.ADMIN_EMAIL || "admin@difiori.com.ec").toLowerCase();
  const adminPassword = process.env.ADMIN_PASSWORD || "Difiori2024!";

  // Crear o buscar la compañía
  let company = await db.company.findFirst();
  if (!company) {
    company = await db.company.create({
      data: {
        name: "Difiori Floristería",
        slug: "difiori",
        email: adminEmail,
      },
    });
    console.log("✅ Company created:", company.name);
  }

  // Hash de la contraseña
  const hashedPassword = await bcrypt.hash(adminPassword, 12);

  // Crear el usuario admin
  await db.users.upsert({
    where: { email: adminEmail },
    update: {},
    create: {
      companyId: company.id,
      email: adminEmail,
      name: "Admin Difiori",
      password: hashedPassword,
      role: "ADMIN",
      isActive: true,
    },
  });

  console.log("✅ Admin user created or already exists:", adminEmail);
}

main()
  .catch((e) => {
    console.error("Error seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
