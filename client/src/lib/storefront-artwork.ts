import type { Product } from '@/data/mock';
import { toPublicImageUrl } from '@/lib/media';

// Presentation-only derivatives. Never replace the original inventory image or
// attach this cutout to a different product after an administrator changes it.
const cutoutsBySource: Record<string, string> = {
  '1792202388007-otebook-asus-vivobook-15-x1504vap-c38128.png': '/assets/storefront/asus-vivobook-cutout.png',
  '1792202655021-notebook-hp-ci3-100u-1.2ghz-8gb-512gb-ssd-cod.-it-c92pxla-abm.png': '/assets/storefront/hp-laptop-cutout.png',
};

function sourceFile(source: string): string {
  try {
    const url = new URL(source, 'https://storefront.invalid');
    const original = url.pathname === '/image-proxy' ? url.searchParams.get('url') : null;
    return decodeURIComponent(new URL(original || source, 'https://storefront.invalid').pathname.split('/').pop() || '');
  } catch { return ''; }
}

export function getStorefrontProductImage(product: Pick<Product, 'image'>): string {
  const cutout = cutoutsBySource[sourceFile(product.image)];
  return cutout ? toPublicImageUrl(cutout) || cutout : product.image;
}

export function getCategoryArtwork(title: string): string {
  const name = title.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  const file = /audio|audifon|auricular/.test(name) ? 'audio-cutout.png'
    : /wearable|reloj|smartwatch|band/.test(name) ? 'wearables-cutout.png'
    : /computador|laptop|notebook|portatil/.test(name) ? 'asus-vivobook-cutout.png'
    : 'accessories-cutout.png';
  return toPublicImageUrl(`/assets/storefront/${file}`) || `/assets/storefront/${file}`;
}
