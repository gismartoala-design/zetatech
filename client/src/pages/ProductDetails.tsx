import React, { useState } from "react";
import "./product-details.css";
import { Link, useLocation } from "wouter";
import { MessageSquare, Plus, Truck, ShieldCheck, Clock, ShoppingBag, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { getResponsiveImageSrcSet } from "@/lib/media";
import { useProducts } from "@/hooks/useProducts";
import { useCompany } from "@/hooks/useCompany";
import { useCart } from "@/context/CartContext";
import { useToast } from "@/hooks/use-toast";
import { Seo } from "@/components/Seo";
import { buildGaItem, trackGaEvent } from "@/lib/analytics";
import { trackFacebookEvent } from "@/lib/facebook-pixel";
import { DEFAULT_COMPANY, absoluteUrl, canonicalUrl } from "@/lib/site";
import {
  MERCHANT_ORGANIZATION_ID,
  getMerchantOrganizationSchema,
  getMerchantReturnPolicySchema,
  getOfferShippingDetailsSchema,
} from "@/lib/merchant-seo";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  formatCategoryDisplayName,
  getCategoryPath,
  getNumericPriceValue,
  getProductPath,
  getProductSku,
  isProductSlugMatch,
  getStockLabel,
} from "@shared/catalog";

export default function ProductDetails() {
  const [location, setLocation] = useLocation();
  const { data: allProducts = [], isLoading } = useProducts();
  const { data: company } = useCompany();
  const { addItem, buyNow, setIsCartOpen } = useCart();
  const { toast } = useToast();

  const routePath = getCleanRoutePath(location);
  const canonicalMatch = routePath.startsWith("/producto/");
  const legacyMatch = routePath.startsWith("/product/");
  const routeValue = decodeURIComponent(
    routePath.replace(/^\/producto\//, "").replace(/^\/product\//, ""),
  );
  const product = allProducts.find((item) => {
    if (!routeValue) return false;

    if (legacyMatch) {
      return String(item.id) === String(routeValue);
    }

    return isProductSlugMatch(item, routeValue);
  });
  const [selectedImage, setSelectedImage] = useState<string | undefined>(undefined);
  const [isBuying, setIsBuying] = useState(false);

  React.useEffect(() => {
    if (product) setSelectedImage(product.image);
  }, [product]);

  React.useEffect(() => {
    if (!product) return;

    trackGaEvent("view_item", {
      currency: "USD",
      value: getNumericPriceValue(product.price),
      items: [
        buildGaItem({
          id: getProductSku(product),
          name: product.name,
          category: formatCategoryDisplayName(product.category),
          price: getNumericPriceValue(product.price),
        }),
      ],
    });
    trackFacebookEvent("ViewContent", {
      content_ids: [getProductSku(product)],
      content_name: product.name,
      content_category: formatCategoryDisplayName(product.category),
      content_type: "product",
      currency: "USD",
      value: getNumericPriceValue(product.price),
    });
  }, [product]);

  React.useEffect(() => {
    if (!product) return;

    const canonicalPath = getProductPath(product);
    if (routePath !== canonicalPath) {
      setLocation(canonicalPath, { replace: true });
    }
  }, [product, routePath, setLocation]);

  const isStoreClosed = () => {
    if (company?.settings?.acceptOrders !== false) return false;

    toast({
      title: "Tienda cerrada temporalmente",
      description: "Por ahora no estamos recibiendo nuevos pedidos.",
      duration: 4000,
    });
    return true;
  };

  const trackProductAddToCart = () => {
    if (!product) return;

    trackGaEvent("add_to_cart", {
      currency: "USD",
      value: getNumericPriceValue(product.price),
      items: [
        buildGaItem({
          id: getProductSku(product),
          name: product.name,
          category: formatCategoryDisplayName(product.category),
          price: getNumericPriceValue(product.price),
        }),
      ],
    });
    trackFacebookEvent("AddToCart", {
      content_ids: [getProductSku(product)],
      content_name: product.name,
      content_type: "product",
      currency: "USD",
      value: getNumericPriceValue(product.price),
    });
  };

  const handleAddToCart = () => {
    if (!product || product.stock === 0 || isStoreClosed()) return;

    trackProductAddToCart();
    addItem(product);
    setIsCartOpen(true);
  };

  const handleBuyNow = () => {
    if (!product || product.stock === 0 || isBuying || isStoreClosed()) return;

    setIsBuying(true);
    trackProductAddToCart();
    buyNow(product);
    setLocation("/checkout");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Seo
          title="Cargando producto | Zetatech"
          description="Cargando información del producto."
          path={routePath}
          robots="noindex, nofollow"
        />
        <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="page-shell">
        <Seo
          title="Producto no encontrado | Zetatech"
          description="La ficha del producto solicitado no está disponible."
          path={routePath}
          robots="noindex, nofollow"
        />
        <div className="empty-state mx-auto max-w-2xl">
          <h1 className="section-title">Producto no encontrado</h1>
          <p className="section-copy mb-8">La ficha solicitada no está disponible en el catálogo público.</p>
          <Link href="/shop" className="ui-btn-primary">
            Volver al catálogo
          </Link>
        </div>
      </div>
    );
  }

  const priceValue = getNumericPriceValue(product.price);
  const soldOut = product.stock === 0;
  const productSku = getProductSku(product);
  const productPath = getProductPath(product);
  const categoryPath = getCategoryPath(product.category);
  const categoryLabel = formatCategoryDisplayName(product.category);
  const galleryImages = Array.from(
    new Set([product.image, ...(product.additionalImages || [])].filter(Boolean))
  );
  const normalizedDescription = (product.description || "").trim().toLowerCase();
  const normalizedIncludes = (product.includes || "").trim().toLowerCase();
  const normalizedSize = normalizeProductDetailValue(product.size);
  const detailItems = [
    normalizedIncludes && normalizedIncludes !== normalizedDescription
      ? {
          title: "Lo que recibes",
          content: product.includes,
        }
      : null,
    normalizedSize
      ? {
          title: "Dimensiones",
          content: normalizedSize,
        }
      : null,
    product.deliveryTime
      ? {
          title: "Promesa de Entrega",
          content: (
            <p className="flex items-center gap-2 text-sm leading-relaxed text-foreground/70">
              <Clock className="w-4 h-4" /> {product.deliveryTime} (Guayaquil)
            </p>
          ),
        }
      : null,
  ].filter(Boolean) as Array<{
    title: string;
    content: React.ReactNode;
  }>;
  const productSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        "@id": `${canonicalUrl(productPath)}#product`,
        name: product.name,
        description: product.description || `${product.name} con entrega a domicilio en Guayaquil.`,
        sku: productSku,
        mpn: productSku,
        image: galleryImages.map((image) => absoluteUrl(image)),
        category: categoryLabel,
        brand: {
          "@type": "Brand",
          name: "ZETATECH",
        },
        offers: {
          "@type": "Offer",
          url: canonicalUrl(productPath),
          priceCurrency: "USD",
          price: priceValue,
          // Google avisa en Search Console cuando falta: sin fecha de validez
          // puede dejar de mostrar el precio en los resultados de búsqueda.
          priceValidUntil: getPriceValidUntil(),
          ...(product.stock != null ? { availability: `https://schema.org/${soldOut ? "OutOfStock" : "InStock"}` } : {}),
          itemCondition: "https://schema.org/NewCondition",
          shippingDetails: getOfferShippingDetailsSchema(),
          hasMerchantReturnPolicy: getMerchantReturnPolicySchema(),
          seller: {
            "@id": MERCHANT_ORGANIZATION_ID,
          },
        },
      },
      getMerchantOrganizationSchema(),
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          {
            "@type": "ListItem",
            position: 1,
            name: "Inicio",
            item: canonicalUrl("/"),
          },
          {
            "@type": "ListItem",
            position: 2,
            name: "Catálogo",
            item: canonicalUrl("/shop"),
          },
          {
            "@type": "ListItem",
            position: 3,
            name: categoryLabel,
            item: canonicalUrl(categoryPath),
          },
          {
            "@type": "ListItem",
            position: 4,
            name: product.name,
            item: canonicalUrl(productPath),
          },
        ],
      },
    ],
  };
  const selectedImageSrcSet = getResponsiveImageSrcSet(selectedImage, [480, 768, 1024, 1280]);

  return (
    <div className="page-shell">
      <Seo
        title={`${product.name} | Tecnología Zetatech`}
        description={product.description}
        path={productPath}
        image={product.image}
        type="product"
        schema={productSchema}
      />
      <div className="page-container">
        <Breadcrumb className="mb-6 text-xs">
          <BreadcrumbList>
            <BreadcrumbItem>
              <Link href="/" className="transition-colors hover:text-foreground">
                Inicio
              </Link>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <Link href="/shop" className="transition-colors hover:text-foreground">
                Catálogo
              </Link>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <Link href={categoryPath} className="transition-colors hover:text-foreground">
                {categoryLabel}
              </Link>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage>{product.name}</BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div className="grid items-start gap-8 lg:grid-cols-2 lg:gap-12">
          <div className="space-y-8 flex flex-col items-center lg:items-start">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="surface-card relative aspect-square w-full max-w-xl overflow-hidden group bg-white"
            >
              <img
                src={selectedImage}
                srcSet={selectedImageSrcSet}
                className="w-full h-full object-contain object-center p-6 transition-transform duration-700 group-hover:scale-[1.02] cursor-zoom-in"
                alt={product.name}
                loading="eager"
                decoding="async"
                fetchPriority="high"
                sizes="(min-width: 1024px) 50vw, 92vw"
              />
            </motion.div>

            {galleryImages.length > 1 ? (
              <div className="flex gap-4 justify-center lg:justify-start w-full max-w-xl overflow-x-auto pb-4 no-scrollbar">
                {galleryImages.map((img, i) => {
                  const thumbnailSrcSet = getResponsiveImageSrcSet(img, [96, 192, 256]);

                  return (
                    <button
                      key={i}
                      type="button"
                      aria-label={`Ver imagen ${i + 1} de ${product.name}`}
                      onMouseEnter={() => setSelectedImage(img)}
                      onClick={() => setSelectedImage(img)}
                      className={cn(
                        "h-24 w-24 min-w-[6rem] overflow-hidden rounded-2xl border-2 bg-white transition-all hover:scale-105",
                        selectedImage === img ? "border-accent shadow-lg" : "border-primary/10",
                      )}
                    >
                      <img
                        src={img}
                        srcSet={thumbnailSrcSet}
                        className="w-full h-full object-contain object-center p-1"
                        alt={`${product.name} vista ${i + 1}`}
                        loading="lazy"
                        decoding="async"
                        fetchPriority="low"
                        sizes="96px"
                      />
                    </button>
                  );
                })}
              </div>
            ) : null}
          </div>

          <div className="flex flex-col h-full">
            <div className="page-kicker">{categoryLabel}</div>

            <h1 className="product-detail-title">
              {product.name}
            </h1>

            <div className="flex flex-wrap items-center gap-4 mb-5">
              <span className="text-3xl font-bold text-foreground">
                {product.price}
              </span>
              <div className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${soldOut ? "bg-slate-100 text-slate-600" : "bg-accent/10 text-accent"}`} role="status">
                {getStockLabel(product.stock)}
              </div>
            </div>

            {product.description && <details className="product-description-panel" open>
              <summary>Descripción</summary>
              <p className="product-description-strong">{product.description}</p>
            </details>}

            {detailItems.length > 0 ? (
              <details className="product-specifications-panel">
                <summary>Especificaciones y entrega</summary>
                <div className="grid grid-cols-1 gap-4 pt-4 sm:grid-cols-2">
                {detailItems.map((item) => (
                  <div key={item.title} className="space-y-1.5">
                    <h4 className="text-xs font-semibold text-foreground">
                      {item.title}
                    </h4>
                    {typeof item.content === "string" ? (
                      <p className="text-sm leading-relaxed text-foreground/70">
                        {item.content}
                      </p>
                    ) : (
                      item.content
                    )}
                  </div>
                ))}
                </div>
              </details>
            ) : null}

            <div className="product-detail-actions">
              <button type="button" onClick={handleBuyNow} disabled={isBuying || soldOut} className="ui-btn-primary disabled:cursor-not-allowed disabled:opacity-50">
                {isBuying ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <ShoppingBag className="h-5 w-5" />
                )}
                {soldOut ? "Agotado" : isBuying ? "Cargando..." : "Comprar ahora"}
              </button>
              <button type="button" onClick={handleAddToCart} disabled={soldOut} className="ui-btn-secondary disabled:cursor-not-allowed disabled:opacity-50">
                <Plus className="h-5 w-5" /> Agregar al carrito
              </button>
              <a
                href={`https://wa.me/${DEFAULT_COMPANY.phoneDigits}?text=${encodeURIComponent(`Hola, me interesa ${product.name}. ¿Me pueden asesorar?`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="product-detail-whatsapp"
              >
                <MessageSquare className="h-4 w-4" /> Consultar por WhatsApp
              </a>
            </div>

            <div className="mt-6 pt-5 border-t border-foreground/10 flex flex-wrap items-center gap-5 text-xs font-medium text-foreground/60">
              <span className="flex items-center gap-2">
                <Truck className="w-4 h-4" /> Envío Seguro
              </span>
              <span className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> Pago Protegido
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Un año por delante: los precios del catálogo no tienen caducidad propia. */
function getPriceValidUntil() {
  const fecha = new Date();
  fecha.setFullYear(fecha.getFullYear() + 1);
  return fecha.toISOString().slice(0, 10);
}

function getCleanRoutePath(location: string) {
  if (typeof window !== "undefined") {
    return window.location.pathname || "/";
  }

  return String(location || "/").split("?")[0].split("#")[0] || "/";
}

function normalizeProductDetailValue(value?: string | null) {
  const normalized = String(value || "").trim();
  if (!normalized || normalized === "-" || normalized === "—" || normalized.toLowerCase() === "n/a") {
    return "";
  }

  return normalized;
}
