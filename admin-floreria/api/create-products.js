/**
 * Script para crear todos los productos en PostgreSQL
 * Basado en los productos del archivo mock.ts
 */

require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const PRODUCTS_DATA = [
  {
    name: "Ramo de Rosas Rojas Premium",
    description: "Elegante ramo de 24 rosas rojas frescas de exportación, envueltas en papel decorativo y lazo de seda. Ideal para expresar amor profundo.",
    category: "Ramos de rosas",
    price: 45.00,
    image: "/assets/product1.png",
    stock: 15,
    isActive: true,
    featured: true,
    isLimited: false,
    priceIncludesTax: true,
    hasVariants: false
  },
  {
    name: "Arreglo Primaveral Mixto",
    description: "Combinación vibrante de lirios, margaritas y claveles en tonos pasteles. Una explosión de frescura para cualquier ocasión.",
    category: "Flores mixtas",
    price: 38.00,
    image: "/assets/banner_collage.jpg",
    stock: 12,
    isActive: true,
    featured: true,
    isLimited: false,
    priceIncludesTax: true,
    hasVariants: false
  },
  {
    name: "Cesta Sorpresa Gourmet",
    description: "Completo desayuno que incluye café premium, croissants recién horneados, ensalada de frutas frescas, jugo de naranja y un mini bouquet decorativo.",
    category: "Desayunos sorpresa",
    price: 55.00,
    image: "/assets/banner_collage.jpg",
    stock: 8,
    isActive: true,
    featured: true,
    isLimited: false,
    priceIncludesTax: true,
    hasVariants: false
  },
  {
    name: "Caja de Rosas Bouquet Royal",
    description: "Caja de lujo con 12 rosas seleccionadas y follaje decorativo. Un regalo sofisticado y duradero.",
    category: "Amor y aniversario",
    price: 32.00,
    image: "/assets/banner_collage.jpg",
    stock: 20,
    isActive: true,
    featured: false,
    isLimited: false,
    priceIncludesTax: true,
    hasVariants: false
  },
  {
    name: "Vino & Flores Selection",
    description: "Caja de regalo que incluye una botella de vino tinto Cabernet Sauvignon y un pequeño arreglo de flores complementario.",
    category: "Regalos con vino",
    price: 65.00,
    image: "/assets/banner_collage.jpg",
    stock: 5,
    isActive: true,
    featured: false,
    isLimited: false,
    priceIncludesTax: true,
    hasVariants: false
  },
  {
    name: "Bouquet Cumpleaños Alegre",
    description: "Arreglo colorido con globos metalizados y flores mixtas. La mejor forma de desear un feliz día.",
    category: "Cumpleaños",
    price: 40.00,
    image: "/assets/banner_collage.jpg",
    stock: 10,
    isActive: true,
    featured: false,
    isLimited: false,
    priceIncludesTax: true,
    hasVariants: false
  }
];

async function createProducts() {
  try {
    console.log('🌸 Creando productos en la base de datos...\n');

    // Obtener la compañía y usuario admin
    const company = await prisma.company.findFirst();
    if (!company) {
      throw new Error('No se encontró ninguna compañía. Ejecuta primero create-admin.js');
    }

    const adminUser = await prisma.users.findFirst({
      where: { role: 'ADMIN' }
    });
    if (!adminUser) {
      throw new Error('No se encontró usuario admin. Ejecuta primero create-admin.js');
    }

    console.log(`✅ Compañía: ${company.name}`);
    console.log(`✅ Usuario admin: ${adminUser.email}\n`);

    let createdCount = 0;
    let skippedCount = 0;

    for (const productData of PRODUCTS_DATA) {
      try {
        // Verificar si el producto ya existe
        const existingProduct = await prisma.product.findFirst({
          where: { name: productData.name }
        });

        if (existingProduct) {
          console.log(`⏭️  Producto ya existe: ${productData.name}`);
          skippedCount++;
          continue;
        }

        // Crear el producto
        const product = await prisma.product.create({
          data: {
            ...productData,
            userId: adminUser.id,
            companyId: company.id,
          },
        });

        console.log(`✅ Producto creado: ${product.name} - $${product.price}`);
        createdCount++;

      } catch (error) {
        console.error(`❌ Error creando producto ${productData.name}:`, error.message);
      }
    }

    console.log(`\n🎉 ¡Productos creados exitosamente!`);
    console.log(`   📦 Nuevos productos: ${createdCount}`);
    console.log(`   ⏭️  Productos omitidos: ${skippedCount}`);
    console.log(`   📊 Total productos: ${createdCount + skippedCount}`);

  } catch (error) {
    console.error('❌ Error general:', error.message);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createProducts();
