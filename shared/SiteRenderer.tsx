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
export interface CarouselProduct {
  id: string; name: string; price: string; image: string; href: string;
  description?: string; onAdd?: () => void; addLabel?: string; linkLabel?: string; badge?: string;
}
export function ProductCarousel({products,resolveImage=(url)=>url}:{products:CarouselProduct[];resolveImage?:(url:string)=>string}) {
  const trackRef=useRef<HTMLDivElement>(null);
  const [active,setActive]=useState(0);
  const activeRef=useRef(0);
  const pausedRef=useRef(false);
  useEffect(()=>{activeRef.current=active},[active]);
  useEffect(()=>{
    const track=trackRef.current;
    if (!track) return;
    // Sin este relleno lateral, el primer y el último elemento nunca llegan a
    // quedar centrados (el navegador no deja desplazar más allá del final),
    // así que "siguiente" se quedaba intentando llegar a una posición
    // imposible una y otra vez.
    const updatePadding=()=>{
      const first=track.children[0] as HTMLElement|undefined;
      if (!first) return;
      const pad=Math.max(16,(track.clientWidth-first.offsetWidth)/2);
      track.style.paddingLeft=`${pad}px`;
      track.style.paddingRight=`${pad}px`;
    };
    let raf=0;
    const apply=()=>{
      const mid=track.scrollLeft+track.clientWidth/2;
      let bestIndex=0,bestDist=Infinity;
      Array.from(track.children).forEach((node,i)=>{
        const item=node as HTMLElement;
        const center=item.offsetLeft+item.offsetWidth/2;
        const d=Math.max(-1,Math.min(1,(center-mid)/(track.clientWidth/2||1)));
        item.style.setProperty('--d',String(d));
        const dist=Math.abs(center-mid);
        if (dist<bestDist) {bestDist=dist;bestIndex=i;}
      });
      setActive(bestIndex);
    };
    const onScroll=()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(apply);};
    const onResize=()=>{updatePadding();apply();};
    updatePadding();
    apply();
    track.addEventListener('scroll',onScroll,{passive:true});
    window.addEventListener('resize',onResize);
    return ()=>{track.removeEventListener('scroll',onScroll);window.removeEventListener('resize',onResize);cancelAnimationFrame(raf);};
  },[products.length]);
  const goTo=(index:number)=>{
    const track=trackRef.current;
    if (!track || !track.children.length) return;
    const count=track.children.length;
    const wrapped=((index%count)+count)%count;
    const item=track.children[wrapped] as HTMLElement;
    track.scrollTo({left:item.offsetLeft-(track.clientWidth-item.offsetWidth)/2,behavior:'smooth'});
  };
  // Avance automático con transición suave; se pausa si alguien pasa el
  // cursor, toca o enfoca el carrusel, y se desactiva por completo con
  // preferencia de movimiento reducido.
  useEffect(()=>{
    const track=trackRef.current;
    const reduceMotion=typeof window!=='undefined'&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (!track || reduceMotion || products.length<2) return;
    const id=window.setInterval(()=>{if (!pausedRef.current) goTo(activeRef.current+1);},4500);
    const pause=()=>{pausedRef.current=true;};
    const resume=()=>{pausedRef.current=false;};
    track.addEventListener('pointerenter',pause);
    track.addEventListener('pointerleave',resume);
    track.addEventListener('pointerdown',pause);
    track.addEventListener('focusin',pause);
    track.addEventListener('focusout',resume);
    return ()=>{
      window.clearInterval(id);
      track.removeEventListener('pointerenter',pause);
      track.removeEventListener('pointerleave',resume);
      track.removeEventListener('pointerdown',pause);
      track.removeEventListener('focusin',pause);
      track.removeEventListener('focusout',resume);
    };
  },[products.length]);
  if (!products.length) return null;
  return <div className="zt-carousel">
    <span className="zt-carousel-blob zt-carousel-blob-a" aria-hidden="true"/>
    <span className="zt-carousel-blob zt-carousel-blob-b" aria-hidden="true"/>
    <button type="button" className="zt-carousel-nav zt-carousel-prev" aria-label="Producto anterior" onClick={()=>goTo(active-1)}>‹</button>
    <div className="zt-spotlight-track" ref={trackRef}>{products.map(p=>
      <article className="zt-spotlight-slide" key={p.id}>
        <div className="zt-spotlight-copy">
          {p.badge&&<span className="zt-spotlight-badge">{p.badge}</span>}
          <h3>{p.name}</h3>
          {p.description&&<p>{p.description}</p>}
          <strong className="zt-spotlight-price">{p.price}</strong>
          <div className="zt-spotlight-actions">
            {p.onAdd&&<button type="button" className="zt-button" onClick={p.onAdd}>{p.addLabel||'Añadir al carrito'}</button>}
            <a className="zt-spotlight-link" href={p.href}>{p.linkLabel||'Ver detalles'} <span aria-hidden="true">↗</span></a>
          </div>
        </div>
        <div className="zt-spotlight-media"><img src={resolveImage(p.image)} alt={p.name} loading="lazy"/></div>
      </article>
    )}</div>
    <button type="button" className="zt-carousel-nav zt-carousel-next" aria-label="Siguiente producto" onClick={()=>goTo(active+1)}>›</button>
    {products.length>1&&<div className="zt-carousel-dots" role="tablist" aria-label="Seleccionar producto">{products.map((p,i)=><button key={p.id} type="button" role="tab" aria-selected={active===i} aria-label={`Ir a ${p.name}`} className={`zt-carousel-dot${active===i?' zt-carousel-dot-active':''}`} onClick={()=>goTo(i)}/>)}</div>}
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
