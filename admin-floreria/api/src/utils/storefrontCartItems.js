const { resolvePublicMediaUrl } = require("./publicMediaUrl");

function normalizeProductName(value = "") {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[|,.;:()\-_/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function buildProductNameCandidates(value = "") {
  const normalized = normalizeProductName(value);
  if (!normalized) return [];

  const candidates = new Set([normalized]);
  const parts = normalized.split(" ").filter(Boolean);

  if (parts.length >= 4) {
    candidates.add(parts.slice(0, 6).join(" "));
    candidates.add(parts.slice(0, 5).join(" "));
    candidates.add(parts.slice(0, 4).join(" "));
  }

  const withoutCommonWords = parts.filter(
    (part) => !["para", "con", "de", "del", "la", "el", "en", "y"].includes(part)
  );
  if (withoutCommonWords.length >= 3) {
    candidates.add(withoutCommonWords.slice(0, 5).join(" "));
    candidates.add(withoutCommonWords.slice(0, 4).join(" "));
  }

  return Array.from(candidates).filter(Boolean);
}

function scoreProductNameMatch(sourceName = "", candidateName = "") {
  const source = normalizeProductName(sourceName);
  const candidate = normalizeProductName(candidateName);
  if (!source || !candidate) return 0;
  if (source === candidate) return 1000;
  if (candidate.includes(source) || source.includes(candidate)) return 700;

  const sourceParts = new Set(source.split(" ").filter(Boolean));
  const candidateParts = new Set(candidate.split(" ").filter(Boolean));

  let overlap = 0;
  for (const part of sourceParts) {
    if (candidateParts.has(part)) overlap += 1;
  }

  if (overlap === 0) return 0;

  const coverage = overlap / Math.max(sourceParts.size, 1);
  const precision = overlap / Math.max(candidateParts.size, 1);

  return Math.round((coverage * 0.7 + precision * 0.3) * 100);
}

async function findBestProductByName(prisma, productName) {
  const candidates = buildProductNameCandidates(productName);
  let bestProduct = null;
  let bestScore = 0;

  for (const candidate of candidates) {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
        name: { contains: candidate, mode: "insensitive" },
      },
      select: { id: true, image: true, name: true },
      take: 15,
    });

    for (const product of products) {
      const score = scoreProductNameMatch(productName, product.name);
      if (score > bestScore) {
        bestScore = score;
        bestProduct = product;
      }
    }

    if (bestScore >= 700) {
      return bestProduct;
    }
  }

  if (bestProduct) {
    return bestProduct;
  }

  const fallbackProducts = await prisma.product.findMany({
    where: { isActive: true },
    select: { id: true, image: true, name: true },
    take: 100,
  });

  for (const product of fallbackProducts) {
    const score = scoreProductNameMatch(productName, product.name);
    if (score > bestScore) {
      bestScore = score;
      bestProduct = product;
    }
  }

  return bestScore >= 45 ? bestProduct : null;
}

function parseStorefrontMoney(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : 0;

  const normalized = String(value ?? "")
    .trim()
    .replace(/[^0-9,.-]+/g, "")
    .replace(",", ".");
  const amount = Number(normalized);
  return Number.isFinite(amount) ? amount : 0;
}

function normalizeStorefrontItems(rawItems, fallbackItem = {}) {
  const incomingItems = Array.isArray(rawItems) ? rawItems : [];
  const fallbackItems = incomingItems.length > 0
    ? incomingItems
    : [fallbackItem].filter(Boolean);

  return fallbackItems
    .map((item) => {
      const source = item && typeof item === "object" ? item : {};
      const productSource =
        source.product && typeof source.product === "object" ? source.product : {};

      const quantity = Number(source.quantity ?? 1);
      const productId = String(
        source.productId || productSource.id || ""
      ).trim();
      const productName = String(
        source.productName || source.name || productSource.name || ""
      ).trim();
      const productImage = String(
        source.productImage || source.image || productSource.image || ""
      ).trim();
      const variantName = String(
        source.variantName || productSource.variantName || ""
      ).trim();
      const price = parseStorefrontMoney(
        source.price ?? productSource.price ?? fallbackItem.productPrice
      );

      if (!productName || !Number.isFinite(quantity) || quantity <= 0) {
        return null;
      }

      return {
        productId: productId || null,
        productName,
        productImage: resolvePublicMediaUrl(productImage) || productImage || null,
        variantName: variantName || null,
        quantity,
        price,
      };
    })
    .filter(Boolean);
}

async function hydrateStorefrontItems(prisma, items) {
  return Promise.all(
    (Array.isArray(items) ? items : []).map(async (item) => {
      if (item.productId) {
        const product = await prisma.product.findFirst({
          where: {
            id: String(item.productId),
            isActive: true,
          },
          select: { id: true, image: true, name: true },
        });

        if (product) {
          return {
            ...item,
            productId: product.id,
            productImage: resolvePublicMediaUrl(product.image || item.productImage) || null,
            productName: item.productName || product.name || "Producto DIFIORI",
          };
        }
      }

      if (!item.productName) {
        return {
          ...item,
          productId: null,
        };
      }

      const product = await findBestProductByName(prisma, item.productName);

      return {
        ...item,
        productId: product?.id || null,
        productImage: resolvePublicMediaUrl(product?.image || item.productImage) || null,
        productName: item.productName || product?.name || "Producto DIFIORI",
      };
    })
  );
}

module.exports = {
  parseStorefrontMoney,
  normalizeStorefrontItems,
  hydrateStorefrontItems,
};
