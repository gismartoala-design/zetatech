import { SiteRenderer, ProductCarousel, type CarouselProduct } from '@shared/SiteRenderer';
import { defaultSite, ensureBrandBlock, type SiteBlock } from '@shared/website';
import { useWebsite } from '@/hooks/useWebsite';
import { Seo } from '@/components/Seo';
import { useCart } from '@/context/CartContext';
import { useCompany } from '@/hooks/useCompany';
import { useToast } from '@/hooks/use-toast';
import { toPublicImageUrl } from '@/lib/media';
import { areSameCategory, getProductPath, getStockLabel } from '@shared/catalog';
import { useStorefrontProducts } from '@/hooks/useStorefrontProducts';
import { CategoryScene, EditorialScene, ProductJourney, useSceneMotion } from '@/components/StorefrontScenes';
import '@/styles/storefront-experience.css';
function Products({block}:{block:SiteBlock}) {
  const {data=[],isLoading,isError,refetch}=useStorefrontProducts();
  const {addItem,setIsCartOpen}=useCart();
  const {data:company}=useCompany();
  const {toast}=useToast();
  const acceptOrders=company?.settings?.acceptOrders!==false;
  if(isLoading)return <p role="status">Cargando productos…</p>;
  if(isError)return <div role="status"><p>No pudimos cargar los productos. Intenta nuevamente en unos momentos.</p><button type="button" onClick={()=>void refetch()}>Volver a cargar</button></div>;
  const eligible=data.filter(p=>(!block.category||areSameCategory(p.category,block.category))&&(!block.featured||p.isBestSeller));
  const products=(block.productIds.length?block.productIds.flatMap(id=>eligible.filter(p=>p.id===id)):eligible).slice(0,block.limit);
  if(!products.length)return <p>Próximamente encontrarás productos en esta colección.</p>;
  const items:CarouselProduct[]=products.map(product=>({
    id:product.id,name:product.name,price:product.price,image:product.image,
    description:product.description,href:getProductPath(product),addLabel:'Añadir al carrito',stockLabel:getStockLabel(product.stock),originalPrice:product.originalPrice,discountPercent:product.discountPercent,
    onAdd:product.stock===0?undefined:()=>{
      if(!acceptOrders){toast({title:'Tienda cerrada temporalmente',description:'Por ahora no estamos recibiendo nuevos pedidos.',duration:4000});return;}
      addItem(product);setIsCartOpen(true);
    },
  }));
  return <ProductCarousel products={items}/>;
}
export default function Home(){
  const {data}=useWebsite();
  const document=ensureBrandBlock(data||defaultSite);
  const {cartItemCount,setIsCartOpen}=useCart();
  const {data:products=[]}=useStorefrontProducts();
  const sceneRef=useSceneMotion(document.blocks.map(block=>`${block.id}:${block.type}:${block.hidden}`).join('|'));
  const productBlock=document.blocks.find(block=>block.type==='products'&&!block.hidden);
  const eligible=products.filter(product=>product.image&&product.stock!==0&&(!productBlock?.category||areSameCategory(product.category,productBlock.category))&&(!productBlock?.featured||product.isBestSeller)&&(!productBlock?.productIds.length||productBlock.productIds.includes(product.id)));
  const protagonist=(productBlock?.productIds.length?eligible.find(product=>product.id===productBlock.productIds[0]):undefined)||eligible.find(product=>product.isBestSeller)||eligible[0];
  return <div ref={sceneRef}><Seo title={`${document.theme.brand} | Tecnología`} description={document.theme.description} path="/"/><SiteRenderer document={document} className="zx-storefront" showSplash resolveImage={url=>toPublicImageUrl(url)||url} renderBlock={block=>{
    if(block.type==='hero')return <ProductJourney block={block} product={protagonist}/>;
    if(block.type==='benefits')return <CategoryScene block={block} products={products}/>;
    if(block.type==='image')return <EditorialScene block={block} index={document.blocks.filter(item=>item.type==='image').findIndex(item=>item.id===block.id)}/>;
    return undefined;
  }} renderProducts={block=><Products block={block}/>} cart={<button onClick={()=>setIsCartOpen(true)}>{document.theme.cartLabel} ({cartItemCount})</button>}/></div>;
}
