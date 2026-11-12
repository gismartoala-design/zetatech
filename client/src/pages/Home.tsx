import { SiteRenderer } from '@shared/SiteRenderer';
import { defaultSite, ensureBrandBlock, type SiteBlock } from '@shared/website';
import { useWebsite } from '@/hooks/useWebsite';
import { Seo } from '@/components/Seo';
import { toPublicImageUrl } from '@/lib/media';
import { isProductInCategory } from '@shared/catalog';
import { useStorefrontProducts } from '@/hooks/useStorefrontProducts';
import { CategoryScene, EditorialScene, ProductJourney, useSceneMotion } from '@/components/StorefrontScenes';
import {StorefrontNavigation} from '@/components/StorefrontNavigation';
import { ProductCard } from '@/components/ProductCard';
import { useCart } from '@/context/CartContext';
import { StorefrontBrands } from '@/components/StorefrontBrands';
import { arrangeStorefrontBlocks } from '@/lib/storefront-layout';
function Products({block}:{block:SiteBlock}) {
  const {data=[],isLoading,isError,refetch}=useStorefrontProducts();
  if(isLoading)return <div className="zx-home-grid" aria-busy="true" aria-label="Cargando productos">{[0,1,2,3].map(i=><div className="product-skeleton" key={i}/>)}</div>;
  if(isError)return <div role="status"><p>No pudimos cargar los productos. Intenta nuevamente en unos momentos.</p><button type="button" onClick={()=>void refetch()}>Volver a cargar</button></div>;
  const eligible=data.filter(p=>(!block.category||isProductInCategory(p.category,block.category))&&(!block.featured||p.isBestSeller));
  const products=(block.productIds.length?block.productIds.flatMap(id=>eligible.filter(p=>p.id===id)):eligible).slice(0,block.limit);
  if(!products.length)return <p>Próximamente encontrarás productos en esta colección.</p>;
  return <div className="zx-home-grid">{products.map(product=><ProductCard key={product.id} product={product}/>)}</div>;
}
export default function Home(){
  const {data}=useWebsite();
  const source=ensureBrandBlock(data||defaultSite);
  const document={...source,blocks:arrangeStorefrontBlocks(source.blocks)};
  const {data:products=[]}=useStorefrontProducts();
  const {cartItemCount,setIsCartOpen}=useCart();
  const sceneRef=useSceneMotion(document.blocks.map(block=>`${block.id}:${block.type}:${block.hidden}`).join('|'));
  return <div ref={sceneRef}><Seo title={`${document.theme.brand} | Tecnología`} description={document.theme.description} path="/"/><SiteRenderer document={document} className="zx-storefront" header={<StorefrontNavigation theme={document.theme} cart={<button onClick={()=>setIsCartOpen(true)}>{document.theme.cartLabel} ({cartItemCount})</button>}/>} showSplash={false} resolveImage={url=>toPublicImageUrl(url)||url} renderBlock={block=>{
    // Only an explicitly selected hero product may replace the fixed campaign.
    if(block.type==='hero')return <ProductJourney block={block} product={block.productIds[0]?products.find(product=>product.id===block.productIds[0]):undefined}/>;
    if(block.type==='benefits')return <CategoryScene block={block} products={products}/>;
    if(block.type==='brands')return <StorefrontBrands block={block}/>;
    if(block.type==='image')return <EditorialScene block={block} index={document.blocks.filter(item=>item.type==='image').findIndex(item=>item.id===block.id)}/>;
    return undefined;
  }} renderProducts={block=><Products block={block}/>}/></div>;
}
