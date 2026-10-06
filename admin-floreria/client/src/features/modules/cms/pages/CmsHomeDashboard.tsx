import { useEffect, useRef, useState, type ReactNode } from 'react';
import axios from 'axios';
import { createPortal } from 'react-dom';
import { useUserStore } from '@/store/use-user-store';
import { ADMIN_API_URL } from '@/core/config/public-env';
import { SiteRenderer } from '@site/SiteRenderer';
import { defaultSite, newBlock, blockLabels, type SiteDocument, type SiteBlock, type BlockType } from '@site/website';
import siteCss from '@site/website.css?inline';
import './website-editor.css';

const api=axios.create({baseURL:ADMIN_API_URL,withCredentials:true,headers:{'X-Site-Editor':'1'}});
type State={revision:number;draft:SiteDocument|null;published:SiteDocument|null;publishedAt?:string;history:{id:string;at:string;document:SiteDocument}[]};
const copy=<T,>(value:T):T=>JSON.parse(JSON.stringify(value));
const asset=(url:string)=>/^https?:/.test(url)?url:new URL(url,new URL(ADMIN_API_URL,window.location.origin).origin).href;
function Frame({children,width,fill}:{children:ReactNode;width:string;fill?:boolean}) {
  const [body,setBody]=useState<HTMLElement|null>(null);
  return <iframe title="Vista previa privada del sitio" style={fill?{width,height:'100%',border:0,background:'white'}:{width,height:850,border:0,background:'white'}} srcDoc={'<!doctype html><html><head><style>body{margin:0}button,input{font:inherit}a{cursor:pointer}</style></head><body></body></html>'} onLoad={e=>setBody(e.currentTarget.contentDocument?.body||null)}>{body&&createPortal(<><style>{siteCss}</style>{children}</>,body)}</iframe>;
}
function Field({label,value,onChange,type='text',min,max}:{label:string;value:string|number;onChange:(v:string)=>void;type?:string;min?:number;max?:number}) {
  return <label className="we-field">{label}<input type={type} value={value} min={min} max={max} onChange={e=>onChange(e.target.value)}/></label>;
}
export default function CmsHomeDashboard(){
  const user=useUserStore(s=>s.user);
  if(user?.role!=='ADMIN')return <div className="p-8"><h1>Acceso restringido</h1><p>Solo el administrador de la empresa puede editar y publicar su sitio web.</p></div>;
  return <WebsiteEditor/>;
}
function WebsiteEditor(){
  const [state,setState]=useState<State|null>(null);
  const [doc,setDoc]=useState<SiteDocument>(copy(defaultSite));
  const [saved,setSaved]=useState('');
  const [selected,setSelected]=useState('appearance');
  const [busy,setBusy]=useState(false);
  const [message,setMessage]=useState('');
  const [error,setError]=useState('');
  const [width,setWidth]=useState('100%');
  const [focusMode,setFocusMode]=useState(false);
  const previewRef=useRef<HTMLElement>(null);
  const [history,setHistory]=useState<SiteDocument[]>([]);
  const [future,setFuture]=useState<SiteDocument[]>([]);
  const [drag,setDrag]=useState('');
  const [products,setProducts]=useState<{id:string;name:string;price:string;image:string;category:string;isBestSeller:boolean}[]>([]);
  const dirty=JSON.stringify(doc)!==saved;
  const block=doc.blocks.find(b=>b.id===selected);
  useEffect(()=>{api.get('/cms/website').then(r=>{setState(r.data.data);const d=r.data.data.draft||r.data.data.published||copy(defaultSite);setDoc(d);setSaved(JSON.stringify(d));}).catch(()=>setError('No se pudo abrir el editor. Verifica tu sesión y la conexión con el servidor.'));},[]);
  useEffect(()=>{api.get('/cms/website/products').then(r=>setProducts(r.data.data)).catch(()=>setMessage('No se pudo cargar el catálogo para la vista previa.'));},[]);
  useEffect(()=>{const fn=(e:BeforeUnloadEvent)=>{if(dirty){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',fn);return()=>window.removeEventListener('beforeunload',fn);},[dirty]);
  useEffect(()=>{const fn=()=>{if(!document.fullscreenElement)setFocusMode(false);};document.addEventListener('fullscreenchange',fn);return()=>document.removeEventListener('fullscreenchange',fn);},[]);
  async function toggleFocusMode(){
    if(focusMode){setFocusMode(false);if(document.fullscreenElement)await document.exitFullscreen().catch(()=>{});return;}
    setFocusMode(true);
    try{await previewRef.current?.requestFullscreen();}catch{/* el modo visual de pantalla completa ya quedó activo */}
  }
  const edit=(next:SiteDocument)=>{setHistory(h=>[...h.slice(-29),copy(doc)]);setFuture([]);setDoc(next);setMessage('');};
  const updateBlock=(patch:Partial<SiteBlock>)=>edit({...doc,blocks:doc.blocks.map(b=>b.id===selected?{...b,...patch}:b)});
  const theme=(patch:Partial<SiteDocument['theme']>)=>edit({...doc,theme:{...doc.theme,...patch}});
  const move=(id:string,index:number)=>{const blocks=[...doc.blocks];const current=blocks.findIndex(b=>b.id===id);if(current<0||index<0||index>=blocks.length)return;const [item]=blocks.splice(current,1);blocks.splice(index,0,item);edit({...doc,blocks});};
  async function persist(action:'save'|'publish'|'restore',versionId?:string){
    if(!state)return;
    if(action==='restore'&&dirty&&!window.confirm('Hay cambios sin guardar. ¿Reemplazarlos con esta versión?'))return;
    setBusy(true);setError('');
    try{const r=await api.post(`/cms/website/${action}`,{revision:state.revision,document:doc,versionId});setState(r.data.data);setDoc(r.data.data.draft);setSaved(JSON.stringify(r.data.data.draft));setMessage(action==='publish'?'Sitio publicado. La tienda mostrará esta versión.':action==='restore'?'Versión recuperada como borrador. Publícala cuando esté lista.':'Borrador guardado. La tienda publicada no ha cambiado.');}
    catch(e){setError(axios.isAxiosError(e)?e.response?.data?.message||'No se pudo guardar. Tus cambios siguen en el editor.':'No se pudo guardar.');}finally{setBusy(false);}
  }
  async function upload(file?:File){
    if(!file)return;if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024){setError('Usa JPG, PNG o WebP de hasta 5 MB.');return;}
    setBusy(true);setError('');try{const form=new FormData();form.append('file',file);const r=await api.post('/cms/website/media',form);if(!r.data.url)throw new Error();edit({...doc,media:Array.from(new Set([...doc.media,r.data.url]))});setMessage('Imagen subida. Selecciónala en el bloque y guarda el borrador.');}catch{setError('No se pudo subir la imagen.');}finally{setBusy(false);}
  }
  const imageField=(label:string,value:string,onChange:(v:string)=>void)=><div><Field label={label} value={value} onChange={onChange}/><select aria-label={`Biblioteca: ${label}`} value="" onChange={e=>onChange(e.target.value)}><option value="">Elegir de la biblioteca…</option>{doc.media.map((url,i)=><option key={url} value={url}>Imagen {i+1} · {url.split('/').pop()}</option>)}</select></div>;
  return <div className="we-editor"><header className="we-toolbar"><div><h1>Editor de Zetatech</h1><small>{dirty?'Cambios sin guardar':'Cambios guardados'} · {state?.publishedAt?`Última publicación: ${new Date(state.publishedAt).toLocaleString('es-EC')}`:'Sin publicar'}</small></div><div className="we-actions"><button disabled={!history.length||busy} onClick={()=>{setFuture(f=>[copy(doc),...f]);setDoc(history[history.length-1]);setHistory(h=>h.slice(0,-1));}}>Deshacer</button><button disabled={!future.length||busy} onClick={()=>{setHistory(h=>[...h,copy(doc)]);setDoc(future[0]);setFuture(f=>f.slice(1));}}>Rehacer</button><button disabled={busy||!state} onClick={()=>persist('save')}>Guardar borrador</button><button className="we-primary" disabled={busy||!state} onClick={()=>persist('publish')}>{busy?'Procesando…':'Publicar'}</button></div></header>
    {message&&<p role="status" className="we-message">{message}</p>}{error&&<p role="alert" className="we-error">{error}</p>}
    <div className="we-layout"><aside className="we-panel"><button onClick={()=>setSelected('appearance')}>Apariencia y navegación</button><h2>Bloques</h2><p>Arrastra para ordenar o usa las flechas.</p>{doc.blocks.map((b,i)=><div key={b.id} className={`we-block-row ${selected===b.id?'we-selected':''}`} draggable onDragStart={()=>setDrag(b.id)} onDragOver={e=>e.preventDefault()} onDrop={()=>move(drag,i)}><button onClick={()=>setSelected(b.id)}>{b.hidden?'◌':'●'} {b.title||blockLabels[b.type]}</button><div><button aria-label={`Subir ${b.title}`} disabled={i===0} onClick={()=>move(b.id,i-1)}>↑</button><button aria-label={`Bajar ${b.title}`} disabled={i===doc.blocks.length-1} onClick={()=>move(b.id,i+1)}>↓</button></div></div>)}<label className="we-field">Agregar bloque<select value="" disabled={doc.blocks.length>=40} onChange={e=>{const b=newBlock(e.target.value as BlockType,crypto.randomUUID());edit({...doc,blocks:[...doc.blocks,b]});setSelected(b.id);}}><option value="">Seleccionar…</option>{Object.entries(blockLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label><h2>Biblioteca</h2><input aria-label="Subir imagen" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy||doc.media.length>=100} onChange={e=>{upload(e.target.files?.[0]);e.target.value='';}}/><div className="we-library">{doc.media.map(url=><img key={url} src={asset(url)} alt={url.split('/').pop()}/>)}</div><h2>Versiones publicadas</h2>{state?.history.map(h=><button key={h.id} disabled={busy} onClick={()=>persist('restore',h.id)}>Recuperar {new Date(h.at).toLocaleString('es-EC')}</button>)}</aside>
    <section ref={previewRef} className={`we-preview${focusMode?' we-preview-focus':''}`}><div className="we-actions"><button onClick={()=>setWidth('100%')}>Escritorio</button><button onClick={()=>setWidth('768px')}>Tablet</button><button onClick={()=>setWidth('390px')}>Móvil</button><span>Vista previa privada</span><button className="we-focus-toggle" onClick={toggleFocusMode}>{focusMode?'✕ Salir de pantalla completa':'⛶ Pantalla completa'}</button></div><Frame width={width} fill={focusMode}><SiteRenderer document={doc} preview resolveImage={asset} cart={<button>{doc.theme.cartLabel}</button>} renderProducts={b=>{const list=products.filter(p=>(!b.productIds.length||b.productIds.includes(p.id))&&(!b.category||p.category===b.category)&&(!b.featured||p.isBestSeller)).slice(0,b.limit);return <div className="zt-product-grid">{list.map(p=><article key={p.id}>{p.image&&<img src={asset(p.image)} alt={p.name} style={{width:'100%',aspectRatio:'1',objectFit:'cover'}}/>}<h3>{p.name}</h3><p>{p.price}</p></article>)}{!list.length&&<p>No hay productos que coincidan. Administra el catálogo desde Productos.</p>}</div>;}}/></Frame></section>
    <aside className="we-panel we-properties"><h2>{selected==='appearance'?'Apariencia del sitio':blockLabels[block?.type||'text']}</h2>{selected==='appearance'?<>
      <Field label="Nombre de la marca" value={doc.theme.brand} onChange={v=>theme({brand:v})}/><Field label="Descripción SEO" value={doc.theme.description} onChange={v=>theme({description:v})}/><Field label="Texto del pie" value={doc.theme.footer} onChange={v=>theme({footer:v})}/><Field label="Texto del carrito" value={doc.theme.cartLabel} onChange={v=>theme({cartLabel:v})}/><Field label="Texto del acceso al catálogo" value={doc.theme.searchLabel} onChange={v=>theme({searchLabel:v})}/>
      {imageField('Logo',doc.theme.logo,v=>theme({logo:v}))}{imageField('Favicon',doc.theme.favicon,v=>theme({favicon:v}))}
      <label className="we-field">Tipografía<select value={doc.theme.font} onChange={e=>theme({font:e.target.value as SiteDocument['theme']['font']})}><option value="system">Sans / moderna</option><option value="serif">Serif / editorial</option><option value="mono">Mono / tecnológica</option></select></label>
      <Field label="Tamaño de letra" type="number" min={14} max={22} value={doc.theme.fontSize} onChange={v=>theme({fontSize:Number(v)})}/><Field label="Redondeado" type="number" min={0} max={32} value={doc.theme.radius} onChange={v=>theme({radius:Number(v)})}/>{(['accent','background','foreground'] as const).map((key,i)=><Field key={key} type="color" label={['Color de botones','Fondo','Texto'][i]} value={doc.theme[key]} onChange={v=>theme({[key]:v})}/>)}
      <h3>Enlaces del menú y pie</h3>{doc.theme.links.map((l,i)=><div key={i}><Field label="Etiqueta" value={l.label} onChange={v=>theme({links:doc.theme.links.map((x,n)=>n===i?{...x,label:v}:x)})}/><Field label="Destino" value={l.href} onChange={v=>theme({links:doc.theme.links.map((x,n)=>n===i?{...x,href:v}:x)})}/><button onClick={()=>theme({links:doc.theme.links.filter((_,n)=>n!==i)})}>Eliminar enlace</button></div>)}<button disabled={doc.theme.links.length>=8} onClick={()=>theme({links:[...doc.theme.links,{label:'Nuevo enlace',href:'/shop'}]})}>Agregar enlace</button>
    </>:block&&<>
      <label><input type="checkbox" checked={!block.hidden} onChange={e=>updateBlock({hidden:!e.target.checked})}/> Mostrar bloque</label><Field label="Título" value={block.title} onChange={v=>updateBlock({title:v})}/><label className="we-field">Texto<textarea rows={5} value={block.text} onChange={e=>updateBlock({text:e.target.value})}/></label>
      {imageField('Imagen',block.image,v=>updateBlock({image:v}))}{imageField('Imagen móvil',block.mobileImage,v=>updateBlock({mobileImage:v}))}<Field label="Descripción de imagen" value={block.alt} onChange={v=>updateBlock({alt:v})}/><Field label="Texto del botón" value={block.button} onChange={v=>updateBlock({button:v})}/><Field label="Destino del botón" value={block.href} onChange={v=>updateBlock({href:v})}/>
      <Field label="Fondo" type="color" value={block.background} onChange={v=>updateBlock({background:v})}/><Field label="Color de texto" type="color" value={block.foreground} onChange={v=>updateBlock({foreground:v})}/><Field label="Espaciado vertical" type="number" min={16} max={120} value={block.padding} onChange={v=>updateBlock({padding:Number(v)})}/><label className="we-field">Alineación<select value={block.align} onChange={e=>updateBlock({align:e.target.value as SiteBlock['align']})}><option value="left">Izquierda</option><option value="center">Centro</option></select></label>
      <label className="we-field">Animación de entrada<select value={block.motion} onChange={e=>updateBlock({motion:e.target.value as SiteBlock['motion']})}>{['none','fade','zoom','slide'].map((v,i)=><option key={v} value={v}>{['Ninguna','Desvanecer','Zoom','Desplazar'][i]}</option>)}</select></label><Field label="Duración (ms)" type="number" min={100} max={2000} value={block.duration} onChange={v=>updateBlock({duration:Number(v)})}/><label className="we-field">Zoom al pasar el cursor ({block.zoom.toFixed(2)}×)<input type="range" min={1} max={1.2} step={.01} value={block.zoom} onChange={e=>updateBlock({zoom:Number(e.target.value)})}/></label>
      {block.type==='products'&&<><Field label="Categoría (vacío: todas)" value={block.category} onChange={v=>updateBlock({category:v})}/><Field label="Cantidad" type="number" min={1} max={12} value={block.limit} onChange={v=>updateBlock({limit:Number(v)})}/><label><input type="checkbox" checked={block.featured} onChange={e=>updateBlock({featured:e.target.checked})}/> Solo destacados</label><label className="we-field">Productos concretos (opcional)<select multiple value={block.productIds} onChange={e=>updateBlock({productIds:Array.from(e.target.selectedOptions,o=>o.value).slice(0,12)})}>{products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label><button onClick={()=>updateBlock({productIds:[]})}>Usar selección automática</button></>}
      {['benefits','gallery','faq'].includes(block.type)&&<><h3>Elementos</h3>{block.items.map((item,i)=><div key={i}><Field label="Título del elemento" value={item.title} onChange={v=>updateBlock({items:block.items.map((x,n)=>n===i?{...x,title:v}:x)})}/><Field label="Texto del elemento" value={item.text} onChange={v=>updateBlock({items:block.items.map((x,n)=>n===i?{...x,text:v}:x)})}/>{imageField('Imagen del elemento',item.image,v=>updateBlock({items:block.items.map((x,n)=>n===i?{...x,image:v}:x)}))}<Field label="Enlace" value={item.href} onChange={v=>updateBlock({items:block.items.map((x,n)=>n===i?{...x,href:v}:x)})}/><button onClick={()=>updateBlock({items:block.items.filter((_,n)=>n!==i)})}>Eliminar elemento</button></div>)}<button disabled={block.items.length>=12} onClick={()=>updateBlock({items:[...block.items,{title:'Nuevo elemento',text:'',image:'',href:''}]})}>Agregar elemento</button></>}
      <hr/><button disabled={doc.blocks.length>=40} onClick={()=>{const b={...copy(block),id:crypto.randomUUID()};edit({...doc,blocks:[...doc.blocks,b]});setSelected(b.id);}}>Duplicar bloque</button><button onClick={()=>{edit({...doc,blocks:doc.blocks.filter(b=>b.id!==selected)});setSelected('appearance');}}>Eliminar bloque</button>
    </>}</aside></div></div>;
}
