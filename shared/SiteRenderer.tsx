import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { type SiteBlock, type SiteDocument } from './website';
import './website.css';
export const siteFonts = {system:'Inter, system-ui, sans-serif',serif:'Georgia, serif',mono:'ui-monospace, monospace'};
export function SiteHeader({theme:t,cart,resolveImage=(url)=>url}:{theme:SiteDocument['theme'];cart?:ReactNode;resolveImage?:(url:string)=>string}) {
  const [scrolled,setScrolled]=useState(false);
  useEffect(()=>{
    const onScroll=()=>setScrolled(window.scrollY>24);
    onScroll();
    window.addEventListener('scroll',onScroll,{passive:true});
    return ()=>window.removeEventListener('scroll',onScroll);
  },[]);
  const initial=(t.brand||'Z').trim().charAt(0).toUpperCase()||'Z';
  return <div className="zt-header-dock"><header className="zt-header" data-scrolled={scrolled}><a href="/" className="zt-brand">{t.logo?<img src={resolveImage(t.logo)} alt={t.brand}/>:<><span className="zt-mark">{initial}</span>{t.brand}</>}</a><nav aria-label="Navegación principal">{t.links.map((l,i)=><a key={i} href={l.href.startsWith('#')?`/${l.href}`:l.href}>{l.label}</a>)}</nav><div className="zt-header-actions"><a href="/shop" aria-label={t.searchLabel}>{t.searchLabel}</a>{cart}</div></header></div>;
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
  const reduceMotion = typeof window!=='undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Transición al bajar: la portada se hunde y se oscurece ligeramente con el
  // scroll, como una cámara alejándose, hasta despejar paso a la siguiente
  // sección. Puramente visual: no mueve el documento ni afecta el layout.
  useEffect(()=>{
    const el=ref.current;
    if (!el || block.type!=='hero' || reduceMotion) return;
    let raf=0;
    const onScroll=()=>{
      cancelAnimationFrame(raf);
      raf=requestAnimationFrame(()=>{
        const h=el.offsetHeight||1;
        const progress=Math.min(Math.max(window.scrollY/h,0),1);
        el.style.setProperty('--zt-scroll',String(progress));
      });
    };
    onScroll();
    window.addEventListener('scroll',onScroll,{passive:true});
    return ()=>{window.removeEventListener('scroll',onScroll);cancelAnimationFrame(raf);};
  },[block.type,reduceMotion]);
  return <section ref={ref} id={block.id} className={`zt-block zt-${block.type}`} data-motion={block.motion} style={{background:block.background,color:block.foreground,textAlign:block.align,padding:`${block.padding}px clamp(20px, 5vw, 72px)`,'--zt-duration':`${block.duration}ms`,'--zt-zoom':block.zoom} as CSSProperties}>{children}</section>;
}
export function ProductCarousel({children}:{children:ReactNode[]}) {
  const trackRef=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const track=trackRef.current;
    if (!track) return;
    const items=()=>Array.from(track.children) as HTMLElement[];
    let raf=0;
    const apply=()=>{
      const mid=track.scrollLeft+track.clientWidth/2;
      for (const item of items()) {
        const center=item.offsetLeft+item.offsetWidth/2;
        const d=Math.max(-1,Math.min(1,(center-mid)/(track.clientWidth/2||1)));
        item.style.setProperty('--d',String(d));
      }
    };
    const onScroll=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(apply);};
    apply();
    track.addEventListener('scroll',onScroll,{passive:true});
    const onResize=()=>apply();
    window.addEventListener('resize',onResize);
    return ()=>{track.removeEventListener('scroll',onScroll);window.removeEventListener('resize',onResize);cancelAnimationFrame(raf);};
  },[children.length]);
  const scrollBy=(dir:1|-1)=>{
    const track=trackRef.current;
    if (!track) return;
    const items=Array.from(track.children) as HTMLElement[];
    // La distancia real entre tarjetas (incluye el gap de verdad, en vez de
    // asumir uno) para que cada clic avance exactamente un slide.
    const step=items.length>1?items[1].offsetLeft-items[0].offsetLeft:(items[0]?.offsetWidth||280)+24;
    track.scrollBy({left:dir*step,behavior:'smooth'});
  };
  if (!children.length) return null;
  return <div className="zt-carousel">
    <button type="button" className="zt-carousel-nav zt-carousel-prev" aria-label="Producto anterior" onClick={()=>scrollBy(-1)}>‹</button>
    <div className="zt-carousel-track" ref={trackRef}>{children.map((child,i)=><div className="zt-carousel-item" key={i}>{child}</div>)}</div>
    <button type="button" className="zt-carousel-nav zt-carousel-next" aria-label="Siguiente producto" onClick={()=>scrollBy(1)}>›</button>
  </div>;
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
