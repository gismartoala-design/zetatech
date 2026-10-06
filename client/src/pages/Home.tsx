import { SiteRenderer, ProductCarousel, type CarouselProduct } from '@shared/SiteRenderer';
import { defaultSite, type SiteBlock } from '@shared/website';
import { useWebsite } from '@/hooks/useWebsite';
import { useQuery } from '@tanstack/react-query';
import { resolveApiUrl } from '@/lib/api';
import { INITIAL_PRODUCTS, type Product } from '@/data/mock';
import { Seo } from '@/components/Seo';
import { useCart } from '@/context/CartContext';
import { useCompany } from '@/hooks/useCompany';
import { useToast } from '@/hooks/use-toast';
import { toPublicImageUrl } from '@/lib/media';
import { getProductPath } from '@shared/catalog';
import { DEFAULT_COMPANY } from '@/lib/site';
function Products({block}:{block:SiteBlock}) {
  const {data=[],isLoading,isError}=useQuery<Product[]>({queryKey:['website','products'],queryFn:async()=>{
    const response=await fetch(resolveApiUrl('/api/external/website/products'));
    if(!response.ok)throw new Error('No se pudo cargar el catálogo');
    const {data}=await response.json();return data.map((p:Product)=>({...p,image:toPublicImageUrl(p.image)||'',deliveryTime:'',size:'',includes:p.description||''}));
  },staleTime:30000,retry:1});
  const {addItem,setIsCartOpen}=useCart();
  const {data:company}=useCompany();
  const {toast}=useToast();
  const acceptOrders=company?.settings?.acceptOrders!==false;
  if(isLoading)return <p role="status">Cargando productos…</p>;
  // Mientras el catálogo real no responde o todavía no tiene productos, se
  // muestran ejemplos para que la portada nunca luzca vacía o rota; se
  // marcan como tal y su acción lleva a WhatsApp en vez de simular una
  // compra de algo que no existe en el inventario real.
  const usingExamples=isError||!data.length;
  const source=usingExamples?INITIAL_PRODUCTS:data;
  const eligible=source.filter(p=>(!block.category||p.category===block.category)&&(!block.featured||p.isBestSeller));
  const products=(block.productIds.length&&!usingExamples?block.productIds.flatMap(id=>eligible.filter(p=>p.id===id)):eligible).slice(0,block.limit);
  if(!products.length)return <p>Próximamente encontrarás productos en esta colección.</p>;
  const items:CarouselProduct[]=products.map(product=>usingExamples?{
    id:product.id,name:product.name,price:product.price,image:product.image,
    description:product.description,badge:'Ejemplo',linkLabel:'Preguntar por WhatsApp',
    href:`https://wa.me/${DEFAULT_COMPANY.phoneDigits}?text=${encodeURIComponent(`Hola, me interesa ${product.name}. ¿Está disponible?`)}`,
  }:{
    id:product.id,name:product.name,price:product.price,image:product.image,
    description:product.description,href:getProductPath(product),addLabel:'Añadir al carrito',
    onAdd:()=>{
      if(!acceptOrders){toast({title:'Tienda cerrada temporalmente',description:'Por ahora no estamos recibiendo nuevos pedidos.',duration:4000});return;}
      addItem(product);setIsCartOpen(true);
    },
  });
  return <ProductCarousel products={items}/>;
}
export default function Home(){
  const {data}=useWebsite();
  const document=data||defaultSite;
  const {cartItemCount,setIsCartOpen}=useCart();
  return <><Seo title={`${document.theme.brand} | Tecnología`} description={document.theme.description} path="/"/><SiteRenderer document={document} resolveImage={url=>toPublicImageUrl(url)||url} renderProducts={block=><Products block={block}/>} cart={<button onClick={()=>setIsCartOpen(true)}>{document.theme.cartLabel} ({cartItemCount})</button>}/></>;
}
