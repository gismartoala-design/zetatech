import type { CSSProperties } from 'react';
import { ShoppingCart } from 'lucide-react';
import { useWebsite } from '@/hooks/useWebsite';
import { defaultSite } from '@shared/website';
import { siteFonts } from '@shared/SiteRenderer';
import { useCart } from '@/context/CartContext';
import { StorefrontNavigation } from './StorefrontNavigation';

export function Navbar() {
  const { data } = useWebsite();
  const t = (data || defaultSite).theme;
  const { cartItemCount, setIsCartOpen } = useCart();
  return (
    <div
      className="zt-site zx-storefront zx-nav-shell"
      style={{
        position: 'fixed',
        top: 'var(--closed-store-banner-height, 0px)',
        width: '100%',
        zIndex: 50,
        '--zt-accent': t.accent,
        '--zt-radius': `${t.radius}px`,
        fontFamily: siteFonts[t.font],
        fontSize: t.fontSize,
      } as CSSProperties}
    >
      <StorefrontNavigation
        theme={t}
        cart={
          <button
            type="button"
            className="zt-header-icon-btn zt-cart-icon-btn"
            onClick={() => setIsCartOpen(true)}
            aria-label={`${t.cartLabel} (${cartItemCount})`}
            title={t.cartLabel}
          >
            <ShoppingCart size={20} strokeWidth={1.9} />
            {cartItemCount > 0 && <span className="zt-cart-badge">{cartItemCount}</span>}
          </button>
        }
      />
    </div>
  );
}
