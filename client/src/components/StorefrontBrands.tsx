import { useState } from 'react';
import { Pause, Play } from 'lucide-react';
import type { SiteBlock } from '@shared/website';
import { toPublicImageUrl } from '@/lib/media';

export function StorefrontBrands({ block }: { block: SiteBlock }) {
  const [paused, setPaused] = useState(false);
  const [failed, setFailed] = useState<string[]>([]);
  if (!block.items.length) return null;
  return <section id={block.id} className="zx-brands zx-section" style={{ background: block.background, color: block.foreground }}>
    <div className="zx-brands-heading"><div><span className="zx-eyebrow">Tu próxima conexión</span><h2>{block.title}</h2>{block.text && <p>{block.text}</p>}</div><button type="button" className="zx-brand-pause" aria-pressed={paused} onClick={() => setPaused(value => !value)}>{paused ? <Play size={15}/> : <Pause size={15}/>}<span>{paused ? 'Reanudar' : 'Pausar'}</span></button></div>
    <div className="zx-brands-window"><div className="zx-brands-belt" data-paused={paused}>{[0,1].map(copy => <div className="zx-brands-set" key={copy} aria-hidden={copy === 1 ? true : undefined} inert={copy === 1 ? true : undefined}>{block.items.map((item, i) => <a className="zx-brand-tile" href={item.href || '/shop'} key={i} tabIndex={copy === 1 ? -1 : undefined} aria-label={`Ver ${item.title}`}>
      {item.image && !failed.includes(item.image) ? <img src={toPublicImageUrl(item.image) || item.image} alt={item.title} width="150" height="60" loading="lazy" onError={() => setFailed(previous => [...previous, item.image])}/> : <strong>{item.title}</strong>}
    </a>)}</div>)}</div></div>
  </section>;
}
