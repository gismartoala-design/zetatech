import type { ReactNode } from 'react';
import type { SiteDocument } from '@shared/website';
import { SiteHeader } from '@shared/SiteRenderer';
import { toPublicImageUrl } from '@/lib/media';
import { DeliveryNotice } from './DeliveryNotice';

/** The announcement and the original animated navbar share one sticky area. */
export function StorefrontNavigation({ theme, cart }: { theme: SiteDocument['theme']; cart: ReactNode }) {
  return <div className="zx-navigation"><DeliveryNotice/><SiteHeader theme={theme} resolveImage={url => toPublicImageUrl(url) || url} cart={cart}/></div>;
}
