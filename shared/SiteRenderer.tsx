import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { type SiteBlock, type SiteDocument } from './website';
import './website.css';
export const siteFonts = {system:'Inter, system-ui, sans-serif',serif:'Georgia, serif',mono:'ui-monospace, monospace'};
export function SiteHeader({theme:t,cart,resolveImage=(url)=>url}:{theme:SiteDocument['theme'];cart?:ReactNode;resolveImage?:(url:string)=>string}) {
  const [scrolled,setScrolled]=useState(false);
  useEffect(()=>{
    const onScroll=()=>setScrolled(window.scrollY>8);
    onScroll();
    window.addEventListener('scroll',onScroll,{passive:true});
    return ()=>window.removeEventListener('scroll',onScroll);
  },[]);
  return <header className="zt-header" data-scrolled={scrolled}><a href="/" className="zt-brand">{t.logo?<img src={resolveImage(t.logo)} alt={t.brand}/>:<><span className="zt-mark">Z</span>{t.brand}</>}</a><nav aria-label="Navegación principal">{t.links.map((l,i)=><a key={i} href={l.href.startsWith('#')?`/${l.href}`:l.href}>{l.label}</a>)}</nav><div className="zt-header-actions"><a href="/shop" aria-label={t.searchLabel}>{t.searchLabel}</a>{cart}</div></header>;
}
function AnimatedBlock({block,children}:{block:SiteBlock;children:ReactNode}) {
  const ref = useRef<HTMLElement>(null);
  useEffect(()=>{
    const el=ref.current;
    if (!el || typeof IntersectionObserver==='undefined' || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    // Lo que ya está a la vista en la primera pintura (el hero, típicamente)
    // se queda tal cual: ocultarlo un instante para luego revelarlo producía
    // un parpadeo (blur/opacity) apenas cargaba la página.
    const rect=el.getBoundingClientRect();
    const alreadyVisible=rect.top<window.innerHeight*0.92&&rect.bottom>0;
    if (alreadyVisible) return;
    el.dataset.reveal='waiting';
    const observer = new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){el.dataset.reveal='visible';observer.disconnect();}},{threshold:0.08});
    observer.observe(el);return ()=>observer.disconnect();
  },[block.motion]);
  return <section ref={ref} id={block.id} className={`zt-block zt-${block.type}`} data-motion={block.motion} style={{background:block.background,color:block.foreground,textAlign:block.align,padding:`${block.padding}px clamp(20px, 5vw, 72px)`,'--zt-duration':`${block.duration}ms`,'--zt-zoom':block.zoom} as CSSProperties}>{children}</section>;
}
export function SiteRenderer({document,renderProducts,cart,resolveImage=(url)=>url,preview=false}:{document:SiteDocument;renderProducts?:(block:SiteBlock)=>ReactNode;cart?:ReactNode;resolveImage?:(url:string)=>string;preview?:boolean}) {
  const t=document.theme;
  return <div className="zt-site" style={{'--zt-accent':t.accent,'--zt-radius':`${t.radius}px`,fontFamily:siteFonts[t.font],fontSize:t.fontSize,background:t.background,color:t.foreground} as CSSProperties} onClick={preview?e=>{if((e.target as HTMLElement).closest('a'))e.preventDefault();}:undefined}>
    <SiteHeader theme={t} cart={cart} resolveImage={resolveImage}/>
    <main>{document.blocks.filter(b=>!b.hidden).map(b=><AnimatedBlock key={b.id} block={b}>
      {(b.type==='hero'||b.type==='image')?<div className="zt-feature"><div className="zt-copy"><h1 hidden={b.type!=='hero'}>{b.title}</h1>{b.type!=='hero'&&<h2>{b.title}</h2>}<p>{b.text}</p>{b.button&&<a className="zt-button" href={b.href||'/shop'}>{b.button}<span aria-hidden="true">↗</span></a>}</div>{b.image&&<picture>{b.mobileImage&&<source media="(max-width: 640px)" srcSet={resolveImage(b.mobileImage)}/>}<img src={resolveImage(b.image)} alt={b.alt} loading={b.type==='hero'?'eager':'lazy'}/></picture>}</div>:<>
      <div className="zt-heading"><h2>{b.title}</h2>{b.text&&<p>{b.text}</p>}</div>
      {b.type==='products'&&renderProducts?.(b)}
      {(b.type==='benefits'||b.type==='gallery')&&<div className="zt-tiles">{b.items.map((item,i)=><article key={i}>{item.image&&<img src={resolveImage(item.image)} alt={item.title} loading="lazy"/>}<h3>{item.title}</h3><p>{item.text}</p>{item.href&&<a href={item.href}>{item.title} ↗</a>}</article>)}</div>}
      {b.type==='faq'&&b.items.map((item,i)=><details key={i}><summary>{item.title}</summary><p>{item.text}</p></details>)}
      {b.button&&b.type!=='faq'&&<a className="zt-button" href={b.href||'/shop'}>{b.button} ↗</a>}
      </>}
    </AnimatedBlock>)}</main><footer className="zt-footer"><strong>{t.brand}</strong><p>{t.footer}</p>{t.links.map((l,i)=><a key={i} href={l.href}>{l.label}</a>)}</footer>
  </div>;
}
