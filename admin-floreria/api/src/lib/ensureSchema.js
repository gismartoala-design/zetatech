const { db: prisma } = require("./prisma");

/**
 * Ajustes de esquema que la aplicación necesita para funcionar.
 *
 * Existe porque una columna nueva en `schema.prisma` sin su columna real en la
 * base de datos rompe operaciones enteras: crear un producto devolvía "Error de
 * base de datos" sin decir por qué, mientras listar seguía funcionando (los
 * listados piden columnas concretas; `create` devuelve todas).
 *
 * Solo se aceptan cambios aditivos e idempotentes: añadir columnas opcionales e
 * índices. Nada que borre o transforme datos existentes, para que sea seguro
 * ejecutarlo en cada arranque y con varias instancias a la vez.
 */

const AJUSTES = [
  {
    nombre: "products.sortOrder",
    descripcion: "posición manual de los productos elegida en el panel",
    sentencias: [
      `ALTER TABLE "public"."products" ADD COLUMN IF NOT EXISTS "sortOrder" INTEGER;`,
      `CREATE INDEX IF NOT EXISTS "products_sortOrder_idx" ON "public"."products" ("sortOrder");`,
    ],
  },
  {
    nombre: "customers.cuenta",
    descripcion: "cuenta del portal de clientes: contraseña y correo confirmado",
    sentencias: [
      `ALTER TABLE "public"."customers" ADD COLUMN IF NOT EXISTS "password" TEXT;`,
      `ALTER TABLE "public"."customers" ADD COLUMN IF NOT EXISTS "emailVerifiedAt" TIMESTAMP(3);`,
      `ALTER TABLE "public"."customers" ADD COLUMN IF NOT EXISTS "verificationCodeHash" TEXT;`,
      `ALTER TABLE "public"."customers" ADD COLUMN IF NOT EXISTS "verificationExpiresAt" TIMESTAMP(3);`,
      `ALTER TABLE "public"."customers" ADD COLUMN IF NOT EXISTS "lastLoginAt" TIMESTAMP(3);`,
    ],
  },
];

async function asegurarEsquema({ silencioso = false } = {}) {
  const aplicados = [];

  for (const ajuste of AJUSTES) {
    try {
      for (const sentencia of ajuste.sentencias) {
        await prisma.$executeRawUnsafe(sentencia);
      }
      aplicados.push(ajuste.nombre);
    } catch (error) {
      // Que falle un ajuste no debe impedir que el servidor arranque: se avisa
      // con claridad y el resto de la aplicación sigue funcionando.
      console.error(
        `⚠️  No se pudo preparar ${ajuste.nombre} (${ajuste.descripcion}): ${error.message}`,
      );
    }
  }

  if (!silencioso && aplicados.length > 0) {
    console.log(`✅ Esquema verificado (${aplicados.join(", ")})`);
  }

  return aplicados;
}

module.exports = { asegurarEsquema, AJUSTES };
