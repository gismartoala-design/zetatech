import { useQuery } from '@tanstack/react-query';
import type { Product } from '@/data/mock';
import { resolveApiUrl } from '@/lib/api';
import { toPublicImageUrl } from '@/lib/media';
import { normalizeStock } from '@shared/catalog';

export async function fetchStorefrontProducts(baseUrl?: string): Promise<Product[]> {
  const response = await fetch(resolveApiUrl('/api/external/website/products', baseUrl));
  if (!response.ok) throw new Error('No se pudo cargar el catálogo');
  const { data } = await response.json();
  return data.map((product: Product) => ({
    ...product,
    stock: normalizeStock(product.stock),
    image: toPublicImageUrl(product.image) || '',
    deliveryTime: '',
    size: '',
    includes: product.description || '',
  }));
}

// Shared query key: the visual story and the catalogue use the same real data.
export function useStorefrontProducts() {
  return useQuery<Product[]>({
    queryKey: ['website', 'products'],
    queryFn: () => fetchStorefrontProducts(),
    staleTime: 30000,
    retry: 1,
  });
}
