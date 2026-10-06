export type BlockType = 'hero' | 'text' | 'image' | 'benefits' | 'products' | 'gallery' | 'faq' | 'contact';
export interface SiteItem { title: string; text: string; image: string; href: string }
export interface SiteBlock {
  id: string; type: BlockType; hidden: boolean; title: string; text: string;
  image: string; mobileImage: string; alt: string; href: string; button: string;
  background: string; foreground: string; align: 'left' | 'center';
  motion: 'none' | 'fade' | 'zoom' | 'slide'; duration: number; zoom: number; padding: number;
  category: string; featured: boolean; limit: number; productIds: string[]; items: SiteItem[];
}
export interface SiteDocument {
  version: 1;
  media: string[];
  theme: {
    brand: string; description: string; footer: string; cartLabel: string; searchLabel: string;
    logo: string; favicon: string; font: 'system' | 'serif' | 'mono'; fontSize: number; radius: number;
    accent: string; background: string; foreground: string; links: { label: string; href: string }[];
  };
  blocks: SiteBlock[];
}
export const blockLabels: Record<BlockType,string> = { hero: 'Portada', text: 'Texto', image: 'Imagen con texto', benefits: 'Beneficios', products: 'Productos', gallery: 'Galería', faq: 'Preguntas frecuentes', contact: 'Contacto' };
export function newBlock(type: BlockType, id: string): SiteBlock {
  return { id,type,hidden:false,title:blockLabels[type],text:'',image:'',mobileImage:'',alt:'',href:'/shop',button:'Explorar',background:'#ffffff',foreground:'#101614',align:'left',motion:'zoom',duration:650,zoom:1.06,padding:48,category:'',featured:false,limit:4,productIds:[],items:[] };
}
export const defaultSite: SiteDocument = {
  version:1, media:['/assets/zetatech-hero.png','/assets/zetatech-audio.jpg','/assets/zetatech-watch.jpg'],
  theme: { brand:'Zetatech', description:'Tecnología para trabajar, crear y disfrutar.', footer:'Zetatech · Tecnología para tu día a día',cartLabel:'Carrito',searchLabel:'Explorar catálogo', logo:'',favicon:'',font:'system',fontSize:16,radius:12,accent:'#188b42',background:'#f5f7f6',foreground:'#101614',links:[{label:'Tienda',href:'/shop'},{label:'Audio',href:'#audio'},{label:'Wearables',href:'#relojes'},{label:'Contacto',href:'/contacto'}] },
  blocks: [
    {...newBlock('hero','portada'),title:'Tu mundo. Más conectado.',text:'Descubre tecnología que se mueve contigo. Audio, wearables y accesorios para llevar tu día al siguiente nivel.',image:'/assets/zetatech-hero.png',alt:'Audífonos y accesorios tecnológicos',button:'Descubrir la tienda',background:'#0a0d0c',foreground:'#ffffff',padding:80},
    {...newBlock('benefits','beneficios'),title:'Encuentra lo que va contigo',items:[{title:'Audio',text:'Dale un nuevo sonido a tu día.',image:'',href:'#audio'},{title:'Wearables',text:'Tecnología que te acompaña.',image:'',href:'#relojes'},{title:'Accesorios',text:'Completa tu espacio.',image:'',href:'/shop'}]},
    {...newBlock('products','productos'),title:'Descubre nuestro catálogo',button:'Ver todos los productos'},
    {...newBlock('image','audio'),title:'Dale play a tu mundo.',text:'Explora nuestra selección de audio y encuentra tu próximo compañero de música.',image:'/assets/zetatech-audio.jpg',alt:'Audífonos JBL azules',background:'#e8edfb',button:'Explorar audio'},
    {...newBlock('image','relojes'),title:'Cada momento cuenta.',text:'Descubre wearables para acompañar tu ritmo.',image:'/assets/zetatech-watch.jpg',alt:'Reloj inteligente rosa',background:'#fff0e8',button:'Explorar wearables'},
    {...newBlock('faq','preguntas'),title:'Antes de elegir',items:[{title:'¿Dónde encuentro los detalles de un producto?',text:'Consulta la ficha de cada producto para ver sus características y disponibilidad.',image:'',href:''}]},
  ],
};
