import { useEffect, useState, type ReactNode } from 'react';
import type { SiteDocument } from '@shared/website';
import { SiteHeader } from '@shared/SiteRenderer';
import { toPublicImageUrl } from '@/lib/media';
import { DeliveryNotice } from './DeliveryNotice';

/** Full announcement at the top; compact black caption inside the floating bar. */
export function StorefrontNavigation({ theme, cart }: { theme: SiteDocument['theme']; cart: ReactNode }) {
  const [scrolled,setScrolled]=useState(false);
  useEffect(()=>{
    const update=()=>setScrolled(window.scrollY>24);
    update();
    window.addEventListener('scroll',update,{passive:true});
    return ()=>window.removeEventListener('scroll',update);
  },[]);
  return <div className="zx-navigation" data-scrolled={scrolled}><div className="zx-delivery-strip" aria-hidden={scrolled}><DeliveryNotice/></div><SiteHeader theme={theme} resolveImage={url => toPublicImageUrl(url) || url} brandCaption={<div hidden={!scrolled}><DeliveryNotice inline/></div>} cart={cart}/></div>;
}
