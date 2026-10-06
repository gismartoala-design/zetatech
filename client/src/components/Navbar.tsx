import type { CSSProperties } from 'react';
import { useWebsite } from '@/hooks/useWebsite';
import { useCart } from '@/context/CartContext';
import { defaultSite } from '@shared/website';
import { SiteHeader, siteFonts } from '@shared/SiteRenderer';
import { toPublicImageUrl } from '@/lib/media';
export function Navbar(){
  const {data}=useWebsite();const t=(data||defaultSite).theme;
  const {cartItemCount,setIsCartOpen}=useCart();
  return <div className="zt-site" style={{position:'fixed',top:'var(--closed-store-banner-height, 0px)',width:'100%',zIndex:50,'--zt-accent':t.accent,'--zt-radius':`${t.radius}px`,fontFamily:siteFonts[t.font],fontSize:t.fontSize} as CSSProperties}><SiteHeader theme={t} resolveImage={url=>toPublicImageUrl(url)||url} cart={<button onClick={()=>setIsCartOpen(true)}>{t.cartLabel} ({cartItemCount})</button>}/></div>;
}
