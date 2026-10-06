require("dotenv").config();
const { db: prisma } = require("../src/lib/prisma");

async function main() {
  await prisma.$executeRawUnsafe(`
    ALTER TABLE "public"."orders"
      ADD COLUMN IF NOT EXISTS "paymentProofImageUrl" TEXT,
      ADD COLUMN IF NOT EXISTS "paymentProofFileName" TEXT,
      ADD COLUMN IF NOT EXISTS "paymentProofStatus" TEXT DEFAULT 'PENDING',
      ADD COLUMN IF NOT EXISTS "paymentProofUploadedAt" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "paymentVerifiedAt" TIMESTAMP(3),
      ADD COLUMN IF NOT EXISTS "paymentVerifiedBy" TEXT,
      ADD COLUMN IF NOT EXISTS "paymentVerificationNotes" TEXT;
  `);

  await prisma.$executeRawUnsafe(`
    UPDATE "public"."orders"
    SET
      "paymentProofImageUrl" = COALESCE(
        "paymentProofImageUrl",
        NULLIF(TRIM(SUBSTRING("orderNotes" FROM 'Comprobante URL: ([^|]+)')), '')
      ),
      "paymentProofFileName" = COALESCE(
        "paymentProofFileName",
        NULLIF(TRIM(SUBSTRING("orderNotes" FROM 'Comprobante Archivo: ([^|]+)')), '')
      ),
      "paymentProofStatus" = COALESCE("paymentProofStatus", 'UPLOADED'),
      "paymentProofUploadedAt" = COALESCE("paymentProofUploadedAt", "updatedAt")
    WHERE "orderNotes" ILIKE '%Comprobante URL:%';
  `);

  const columns = await prisma.$queryRawUnsafe(`
    SELECT column_name, data_type, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'orders'
      AND column_name IN (
        'paymentProofImageUrl',
        'paymentProofFileName',
        'paymentProofStatus',
        'paymentProofUploadedAt',
        'paymentVerifiedAt',
        'paymentVerifiedBy',
        'paymentVerificationNotes'
      )
    ORDER BY column_name;
  `);

  console.table(columns);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
