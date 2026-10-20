import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { type SiteBlock, type SiteDocument } from './website';
import './website.css';
import { BRAND_LOGO } from './brand';
export const siteFonts = {system:'Inter, system-ui, sans-serif',serif:'Georgia, serif',mono:'ui-monospace, monospace'};
function InlineEditable({value,tag,blockId,field,editor}:{value:string;tag:'h1'|'h2'|'p';blockId:string;field:'title'|'text';editor?:boolean}) {
  const Tag=tag;
  return <Tag className={editor?'zt-inline-editable':undefined} contentEditable={editor} suppressContentEditableWarning={editor} onBlur={editor?event=>window.parent.postMessage({type:'zetatech-editor-text',blockId,field,value:event.currentTarget.textContent||''},'*'):undefined}>{value}</Tag>;
}
// Mascota de marca: saluda una vez por sesión antes de que se vea la tienda,
// con los colores de la marca activa. No bloquea el renderizado real (el
// contenido ya está debajo, servido por SSR) ni molesta en cada visita: se
// marca en sessionStorage y respeta preferencia de movimiento reducido.
function BrandMascot({className}:{className?:string}) {
  return <svg className={className} viewBox="0 0 240 300" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <ellipse cx="120" cy="286" rx="52" ry="8" fill="#000" opacity=".28"/>
    <rect x="86" y="238" width="22" height="46" rx="10" className="zt-mascot-dark"/>
    <rect x="132" y="238" width="22" height="46" rx="10" className="zt-mascot-dark"/>
    <rect x="80" y="270" width="34" height="20" rx="9" fill="var(--zt-accent)"/>
    <rect x="126" y="270" width="34" height="20" rx="9" fill="var(--zt-accent)"/>
    <g className="zt-mascot-arm-l"><rect x="52" y="158" width="26" height="78" rx="13" className="zt-mascot-dark"/></g>
    <rect x="70" y="140" width="100" height="116" rx="42" className="zt-mascot-dark"/>
    <rect x="117" y="150" width="6" height="92" rx="3" fill="var(--zt-accent)" opacity=".85"/>
    <path d="M100 148 L92 176" stroke="var(--zt-accent)" strokeWidth="5" strokeLinecap="round"/>
    <path d="M140 148 L148 176" stroke="var(--zt-accent)" strokeWidth="5" strokeLinecap="round"/>
    <path d="M120 176 l14 11 -5 16 h-18 l-5 -16 z" fill="var(--zt-accent)"/>
    <g className="zt-mascot-arm-r">
      <rect x="156" y="104" width="26" height="78" rx="13" className="zt-mascot-dark"/>
      <circle cx="169" cy="100" r="15" className="zt-mascot-dark"/>
    </g>
    <path d="M58 110 C58 58 86 26 120 26 C154 26 182 58 182 110 C182 146 166 150 155 150 L85 150 C74 150 58 146 58 110 Z" className="zt-mascot-dark"/>
    <circle cx="120" cy="106" r="54" className="zt-mascot-face"/>
    <ellipse cx="100" cy="104" rx="9" ry="13" className="zt-mascot-eye"/>
    <ellipse cx="140" cy="104" rx="9" ry="13" className="zt-mascot-eye"/>
  </svg>;
}
function BrandSplash({brand}:{brand:string}) {
  const [phase,setPhase]=useState<'idle'|'visible'|'leaving'|'hidden'>('idle');
  useEffect(()=>{
    if (typeof window==='undefined') return;
    const reduceMotion=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (sessionStorage.getItem('zt-splash-seen')||reduceMotion) {setPhase('hidden');return;}
    setPhase('visible');
    const leave=window.setTimeout(()=>setPhase('leaving'),1900);
    const hide=window.setTimeout(()=>{setPhase('hidden');try{sessionStorage.setItem('zt-splash-seen','1');}catch{/* almacenamiento no disponible: no pasa nada, se repite la próxima vez */}},2420);
    return ()=>{window.clearTimeout(leave);window.clearTimeout(hide);};
  },[]);
  if (phase==='idle'||phase==='hidden') return null;
  return <div className={`zt-splash${phase==='leaving'?' zt-splash-leaving':''}`} role="presentation" aria-hidden="true">
    <div className="zt-splash-stage">
      <BrandMascot className="zt-splash-mascot"/>
      <strong className="zt-splash-word">{brand}</strong>
    </div>
  </div>;
}
export function SiteHeader({theme:t,cart,resolveImage=(url)=>url}:{theme:SiteDocument['theme'];cart?:ReactNode;resolveImage?:(url:string)=>string}) {
  const [scrolled,setScrolled]=useState(false);
  useEffect(()=>{
    const onScroll=()=>setScrolled(window.scrollY>24);
    onScroll();
    window.addEventListener('scroll',onScroll,{passive:true});
    return ()=>window.removeEventListener('scroll',onScroll);
  },[]);
  return <div className="zt-header-dock"><header className="zt-header" data-scrolled={scrolled}><a href="/" className="zt-brand"><img src={resolveImage(t.logo||BRAND_LOGO)} alt={t.brand} width="244" height="60"/></a><nav aria-label="Navegación principal">{t.links.map((l,i)=><a key={i} href={l.href.startsWith('#')?`/${l.href}`:l.href}>{l.label}</a>)}</nav><div className="zt-header-actions"><a href="/shop" aria-label={t.searchLabel}>{t.searchLabel}</a>{cart}</div></header></div>;
}
function AnimatedBlock({block,children,editor,onSelect}:{block:SiteBlock;children:ReactNode;editor?:boolean;onSelect?:(id:string)=>void}) {
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
  return <section ref={ref} id={block.id} className={`zt-block zt-${block.type}${editor?' zt-editor-block':''}`} data-editor-block={editor?'true':undefined} data-block-id={block.id} data-motion={block.motion} onClick={editor?event=>{if((event.target as HTMLElement).closest('a,button,input,textarea,select'))return;onSelect?.(block.id);if(!onSelect)window.parent.postMessage({type:'zetatech-editor-select',blockId:block.id},'*')}:undefined} style={{background:block.background,color:block.foreground,textAlign:block.align,padding:`${block.padding}px clamp(20px, 5vw, 72px)`,'--zt-duration':`${block.duration}ms`,'--zt-zoom':block.zoom} as CSSProperties}>{editor&&<span className="zt-editor-label">{block.title||block.type}</span>}{children}</section>;
}
export interface CarouselProduct {
  id: string; name: string; price: string; image: string; href: string;
  description?: string; onAdd?: () => void; addLabel?: string; linkLabel?: string; badge?: string; stockLabel?: string; originalPrice?: string | null; discountPercent?: number;
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
          {p.originalPrice&&<div className="zt-spotlight-offer"><del>{p.originalPrice}</del><span>Oferta · -{p.discountPercent}%</span></div>}
          <strong className="zt-spotlight-price">{p.price}</strong>
          {p.stockLabel&&<span className="zt-spotlight-stock">{p.stockLabel}</span>}
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
export function BrandCarousel({items,resolveImage=(url)=>url}:{items:SiteBlock['items'];resolveImage?:(url:string)=>string}) {
  if (!items.length) return null;
  return <div className="zt-brands-carousel" aria-label="Marcas disponibles en Zetatech">
    <div className="zt-brands-viewport">
      <div className="zt-brands-track">
        {[0,1].map(copy=><div className="zt-brands-group" key={copy} aria-hidden={copy===1?true:undefined}>
          {items.map((item,index)=><a className="zt-brand-card" href={item.href||'/shop'} key={`${item.title}-${index}`} tabIndex={copy===1?-1:0} aria-label={`Ver ${item.title}`}>
            {item.image?<img className="zt-brand-image" src={resolveImage(item.image)} alt={item.title} loading="lazy"/>:<strong className="zt-brand-wordmark">{item.title}</strong>}
            {item.text&&<small>{item.text}</small>}
          </a>)}
        </div>)}
      </div>
    </div>
  </div>;
}
export function SiteRenderer({document,renderProducts,cart,resolveImage=(url)=>url,preview=false,editor=preview,onSelectBlock}:{document:SiteDocument;renderProducts?:(block:SiteBlock)=>ReactNode;cart?:ReactNode;resolveImage?:(url:string)=>string;preview?:boolean;editor?:boolean;onSelectBlock?:(id:string)=>void}) {
  const t=document.theme;
  return <div className="zt-site" style={{'--zt-accent':t.accent,'--zt-radius':`${t.radius}px`,fontFamily:siteFonts[t.font],fontSize:t.fontSize,background:t.background,color:t.foreground} as CSSProperties} onClick={preview?e=>{if((e.target as HTMLElement).closest('a'))e.preventDefault();}:undefined}>
    {!preview&&<BrandSplash brand={t.brand}/>}
    <SiteHeader theme={t} cart={cart} resolveImage={resolveImage}/>
    <main>{document.blocks.filter(b=>!b.hidden).map(b=><AnimatedBlock key={b.id} block={b} editor={editor} onSelect={onSelectBlock}>
      {(b.type==='hero'||b.type==='image')?<div className="zt-feature"><div className="zt-copy">{b.type==='hero'?<InlineEditable tag="h1" value={b.title} blockId={b.id} field="title" editor={editor}/>:<InlineEditable tag="h2" value={b.title} blockId={b.id} field="title" editor={editor}/>}<InlineEditable tag="p" value={b.text} blockId={b.id} field="text" editor={editor}/>{b.button&&<a className="zt-button" href={b.href||'/shop'}>{b.button}<span aria-hidden="true">↗</span></a>}</div>{b.image&&<picture>{b.mobileImage&&<source media="(max-width: 640px)" srcSet={resolveImage(b.mobileImage)}/>}<img src={resolveImage(b.image)} alt={b.alt} loading={b.type==='hero'?'eager':'lazy'}/></picture>}</div>:<>
      <div className="zt-heading"><InlineEditable tag="h2" value={b.title} blockId={b.id} field="title" editor={editor}/>{b.text&&<InlineEditable tag="p" value={b.text} blockId={b.id} field="text" editor={editor}/>}</div>
      {b.type==='products'&&renderProducts?.(b)}
      {b.type==='brands'&&<BrandCarousel items={b.items} resolveImage={resolveImage}/>} 
      {(b.type==='benefits'||b.type==='gallery')&&<div className="zt-tiles">{b.items.map((item,i)=><article key={i}>{item.image&&<img src={resolveImage(item.image)} alt={item.title} loading="lazy"/>}<h3>{item.title}</h3><p>{item.text}</p>{item.href&&<a href={item.href}>{item.title} ↗</a>}</article>)}</div>}
      {b.type==='faq'&&b.items.map((item,i)=><details key={i}><summary>{item.title}</summary><p>{item.text}</p></details>)}
      {b.button&&b.type!=='faq'&&<a className="zt-button" href={b.href||'/shop'}>{b.button} ↗</a>}
      </>}
    </AnimatedBlock>)}</main><footer className="zt-footer"><a href="/" aria-label={`${t.brand}: inicio`}><img className="zt-footer-logo" src={resolveImage(t.logo||BRAND_LOGO)} alt={t.brand} width="280" height="69" loading="lazy"/></a><p>{t.footer}</p>{t.links.map((l,i)=><a key={i} href={l.href}>{l.label}</a>)}</footer>
  </div>;
}
