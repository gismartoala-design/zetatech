import { useEffect, useRef, useState } from 'react';
import { ChevronDown, Menu, Search, ShoppingBag, X } from 'lucide-react';
import { useLocation } from 'wouter';
import type { SiteDocument } from '@shared/website';
import { BRAND_LOGO } from '@shared/brand';
import { buildCategoryTree, formatCategoryDisplayName, getCategoryPath, splitCategoryPath } from '@shared/catalog';
import { useCategories } from '@/hooks/useCategories';
import { useCart } from '@/context/CartContext';
import { toPublicImageUrl } from '@/lib/media';

/** Public navigation only: the administrator keeps the original editor header. */
export function StorefrontHeader({ theme }: { theme: SiteDocument['theme'] }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [location] = useLocation();
  const root = useRef<HTMLElement>(null);
  const toggle = useRef<HTMLButtonElement>(null);
  const { data: categories = [] } = useCategories(open);
  const { cartItemCount, setIsCartOpen } = useCart();
  const tree = buildCategoryTree(categories);
  useEffect(() => { setOpen(false); }, [location]);
  useEffect(() => {
    const scroll = () => setScrolled(window.scrollY > 24);
    scroll();
    window.addEventListener('scroll', scroll, { passive: true });
    return () => window.removeEventListener('scroll', scroll);
  }, []);
  useEffect(() => {
    if (!open) return;
    const dismiss = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') { setOpen(false); toggle.current?.focus(); } };
    document.addEventListener('pointerdown', dismiss);
    document.addEventListener('keydown', escape);
    return () => { document.removeEventListener('pointerdown', dismiss); document.removeEventListener('keydown', escape); };
  }, [open]);
  return <div className="zx-header-dock">
    <a className="zx-skip-link" href="#storefront-content">Saltar al contenido</a>
    <header ref={root} className="zx-header" data-scrolled={scrolled}>
      <div className="zx-header-row">
        <a href="/" className="zx-logo" aria-label={`${theme.brand}: inicio`}><img src={toPublicImageUrl(theme.logo || BRAND_LOGO) || BRAND_LOGO} alt={theme.brand} width="244" height="60" /></a>
        <nav className="zx-desktop-links" aria-label="Navegación principal">{theme.links.map((link, index) => <a key={index} href={link.href.startsWith('#') ? `/${link.href}` : link.href} aria-current={link.href === location ? 'page' : undefined}>{link.label}</a>)}</nav>
        <div className="zx-header-tools">
          <button ref={toggle} type="button" className="zx-menu-toggle" aria-expanded={open} aria-controls="storefront-menu" onClick={() => setOpen(value => !value)}>{open ? <X size={19} /> : <Menu size={19} />}<span>Categorías</span><ChevronDown size={14} /></button>
          <button type="button" className="zx-cart-toggle" onClick={() => { setOpen(false); setIsCartOpen(true); }} aria-label={`${theme.cartLabel}: ${cartItemCount} productos`}><ShoppingBag size={19} /><span>{theme.cartLabel}</span><b>{cartItemCount}</b></button>
        </div>
      </div>
      <div className="zx-search-row"><form action="/shop" role="search" className="zx-search"><label className="sr-only" htmlFor="storefront-search">Buscar productos</label><Search size={18} aria-hidden="true" /><input id="storefront-search" name="q" type="search" placeholder="¿Qué estás buscando?" maxLength={120} /><button type="submit">Buscar</button></form><span className="zx-nav-delivery">Guayaquil · Envío gratis en 24 h</span></div>
      {open && <div id="storefront-menu" className="zx-menu-panel">
        <nav className="zx-mobile-links" aria-label="Secciones">{theme.links.map((link, i) => <a key={i} href={link.href.startsWith('#') ? `/${link.href}` : link.href} onClick={() => setOpen(false)}>{link.label}</a>)}</nav>
        <div className="zx-menu-heading"><strong>Explora por categoría</strong><a href="/shop">Ver todo ↗</a></div>
        <nav aria-label="Categorías y subcategorías" className="zx-menu-categories">{tree.length ? tree.map(category => <div key={category.name}><a className="zx-menu-parent" href={getCategoryPath(category.name)} onClick={() => setOpen(false)}>{formatCategoryDisplayName(category.name)}</a>{category.children.map(child => <a key={child} href={getCategoryPath(child)} onClick={() => setOpen(false)}>{formatCategoryDisplayName(splitCategoryPath(child).child)}</a>)}</div>) : <a href="/shop">Explorar todos los productos →</a>}</nav>
      </div>}
    </header>
  </div>;
}
