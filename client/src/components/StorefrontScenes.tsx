import { useEffect, useRef, useState, type CSSProperties } from 'react';
import type { SiteBlock } from '@shared/website';
import type { Product } from '@/data/mock';
import { areSameCategory, getProductPath, getStockLabel } from '@shared/catalog';
import { toPublicImageUrl } from '@/lib/media';
import { getCategoryArtwork, getStorefrontProductImage } from '@/lib/storefront-artwork';

export function EnergyOrbit({ className = '' }: { className?: string }) {
  return <svg className={`zx-orbit ${className}`} viewBox="0 0 800 800" fill="none" aria-hidden="true">
    <ellipse cx="400" cy="400" rx="310" ry="230" transform="rotate(-35 400 400)" stroke="currentColor" strokeWidth="1" opacity=".22" />
    <ellipse cx="400" cy="400" rx="290" ry="320" transform="rotate(35 400 400)" stroke="currentColor" strokeWidth="1" opacity=".12" />
    <path d="M151 578C35 413 197 136 434 151C671 166 748 357 632 565C553 707 317 720 211 621" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    <circle cx="151" cy="578" r="6" fill="currentColor" />
  </svg>;
}

function SceneImage({ src, alt, priority = false, fallbackSrc }: { src: string; alt: string; priority?: boolean; fallbackSrc?: string }) {
  const [failed, setFailed] = useState<string[]>([]);
  useEffect(() => setFailed([]), [src, fallbackSrc]);
  const current = src && !failed.includes(src) ? src : fallbackSrc && !failed.includes(fallbackSrc) ? fallbackSrc : '';
  if (!current) return <div className="zx-image-fallback"><span aria-hidden="true">↗</span><span>{alt || 'Tecnología que conecta'}</span></div>;
  return <img src={current} alt={alt} loading={priority ? 'eager' : 'lazy'} decoding="async" fetchPriority={priority ? 'high' : 'auto'} onError={() => setFailed(previous => [...previous, current])} />;
}

/** Progressive enhancement: content stays visible without JS or scroll effects. */
export function useSceneMotion(structureKey: string) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const preference = window.matchMedia('(prefers-reduced-motion: reduce)');
    let cleanup = () => {};
    const setup = () => {
      cleanup();
      if (preference.matches) return;
      const scenes = Array.from(root.querySelectorAll<HTMLElement>('[data-zx-reveal]'));
      if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entries => entries.forEach(entry => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).dataset.zxVisible = 'true';
            observer.unobserve(entry.target);
          }
        }), { threshold: .08 });
        scenes.forEach(scene => {
          if (scene.getBoundingClientRect().top > window.innerHeight) {
            scene.dataset.zxVisible = 'false';
            observer.observe(scene);
          }
        });
        cleanup = () => {
          observer.disconnect();
          scenes.forEach(scene => delete scene.dataset.zxVisible);
        };
      }
    };
    setup();
    preference.addEventListener('change', setup);
    return () => { cleanup(); preference.removeEventListener('change', setup); };
  }, [structureKey]);
  return ref;
}

export function ProductJourney({ block, product }: { block: SiteBlock; product?: Product }) {
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const motion = window.matchMedia('(min-width: 901px) and (prefers-reduced-motion: no-preference)');
    let frame = 0;
    let previousProgress = -1;
    const update = () => {
      frame = 0;
      const rect = root.getBoundingClientRect();
      const progress = motion.matches ? Math.max(0, Math.min(1, -rect.top / Math.max(1, rect.height - window.innerHeight))) : 0;
      if (progress !== previousProgress) {
        root.style.setProperty('--zx-progress', String(progress));
        previousProgress = progress;
      }
    };
    const schedule = () => { if (!frame) frame = requestAnimationFrame(update); };
    update();
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    motion.addEventListener('change', schedule);
    return () => {
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      motion.removeEventListener('change', schedule);
      cancelAnimationFrame(frame);
    };
  }, [product?.id]);
  const src = product ? getStorefrontProductImage(product) : toPublicImageUrl(block.image) || '';
  const href = product ? getProductPath(product) : block.href || '/shop';
  return <section ref={ref} id={block.id} className={`zx-journey${product ? ' zx-journey-product' : ''}`} aria-label="Descubre ZettaTech">
    <div className="zx-journey-grid" aria-hidden="true" />
    <div className="zx-stage-rail"><div className="zx-stage">
      <EnergyOrbit />
      <div className="zx-product-halo" aria-hidden="true" />
      <div className="zx-product-visual"><SceneImage src={src} alt={product?.name || block.alt} priority /></div>
      <span className="zx-stage-caption">{product?.category || 'Diseñado para tu día a día'}<span aria-hidden="true"> ↗</span></span>
      <span className="zx-stage-coordinate" aria-hidden="true">ZT / CONECTA</span>
    </div></div>
    <div className="zx-scene zx-scene-intro">
      <div className="zx-scene-copy">
        <span className="zx-eyebrow"><i aria-hidden="true" /> Tecnología que va contigo</span>
        <h1>{block.title}</h1>
        {block.text && <p>{block.text}</p>}
        <a className="zt-button zx-primary" href={block.href || '/shop'}>{block.button || 'Explorar la tienda'}<span aria-hidden="true">↗</span></a>
        <a className="zx-scroll-cue" href={`#${block.id}-detalle`}><span aria-hidden="true">↓</span> Sigue la conexión</a>
      </div>
      <span className="zx-scene-number" aria-hidden="true">01 — DESCUBRE</span>
    </div>
    <div id={`${block.id}-detalle`} className="zx-scene zx-scene-detail">
      <div className="zx-scene-copy" data-zx-reveal>
        <span className="zx-eyebrow">02 / Un poco más cerca</span>
        <h2>{product ? product.name : 'La tecnología se vive. No solo se mira.'}</h2>
        <p>{product ? 'Conoce sus detalles, consulta su disponibilidad y encuentra tu próxima conexión.' : 'Explora audio, wearables y accesorios. Encuentra lo que acompaña tu ritmo, tu espacio y tu forma de disfrutar.'}</p>
        {product && <div className="zx-product-facts">
          <div><span>Precio actual</span><strong>{product.price}</strong>{product.originalPrice && <span className="zx-offer"><del>{product.originalPrice}</del>{product.discountPercent ? ` −${product.discountPercent}%` : ' Oferta'}</span>}</div>
          <div><span>Disponibilidad</span><strong className="zx-stock">{getStockLabel(product.stock)}</strong></div>
        </div>}
        <a className="zx-text-link" href={href}>{product ? 'Ver el producto' : 'Encuentra tu próxima conexión'} <span aria-hidden="true">↗</span></a>
      </div>
      <span className="zx-scene-number" aria-hidden="true">02 — CONECTA</span>
    </div>
    <div className="zx-journey-exit" aria-hidden="true"><span /></div>
  </section>;
}

export function CategoryScene({ block, products }: { block: SiteBlock; products: Product[] }) {
  return <section id={block.id} className="zx-categories zx-section" style={{ background: block.background, color: block.foreground }}>
    <div className="zx-section-heading" data-zx-reveal><span className="zx-eyebrow">03 / Elige tu mundo</span><h2>{block.title}</h2>{block.text && <p>{block.text}</p>}</div>
    <div className="zx-category-grid">{block.items.map((item, index) => {
      const matchingProduct = products.find(product => areSameCategory(product.category, item.title) && product.image);
      const artwork = getCategoryArtwork(item.title);
      const matchingCutout = matchingProduct && getStorefrontProductImage(matchingProduct);
      const image = toPublicImageUrl(item.image) || (matchingCutout && matchingCutout !== matchingProduct?.image ? matchingCutout : artwork);
      return <a className="zx-category" key={`${item.title}-${index}`} href={item.href || '/shop'} data-zx-reveal>
        <div className="zx-category-top"><span>{String(index + 1).padStart(2, '0')}</span><span className="zx-round-arrow" aria-hidden="true">↗</span></div>
        <div className="zx-category-art" aria-hidden="true"><SceneImage src={image || artwork} fallbackSrc={artwork} alt="" /></div>
        <div className="zx-category-copy"><h3>{item.title}</h3>{item.text && <p>{item.text}</p>}</div>
      </a>;
    })}</div>
  </section>;
}

export function EditorialScene({ block, index }: { block: SiteBlock; index: number }) {
  return <section id={block.id} className={`zx-editorial zx-section ${index % 2 ? 'zx-editorial-reverse' : ''}`} style={{ background: block.background, color: block.foreground, '--zx-editorial-zoom': block.zoom } as CSSProperties}>
    <div className="zx-editorial-art" data-zx-reveal><EnergyOrbit /><picture>{block.mobileImage && <source media="(max-width: 640px)" srcSet={toPublicImageUrl(block.mobileImage) || block.mobileImage} />}<SceneImage src={toPublicImageUrl(block.image) || ''} alt={block.alt || block.title} /></picture><span className="zx-art-tag" aria-hidden="true">ZT / {String(index + 1).padStart(2, '0')}</span></div>
    <div className="zx-editorial-copy" data-zx-reveal><span className="zx-eyebrow">Conecta con lo que te mueve</span><h2>{block.title}</h2>{block.text && <p>{block.text}</p>}{block.button && <a className="zx-text-link" href={block.href || '/shop'}>{block.button} <span aria-hidden="true">↗</span></a>}</div>
  </section>;
}
