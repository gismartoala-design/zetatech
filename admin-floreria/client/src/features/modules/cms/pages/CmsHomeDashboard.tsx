import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import axios from 'axios';
import { useUserStore } from '@/store/use-user-store';
import { ADMIN_API_URL, STOREFRONT_URL } from '@/core/config/public-env';
import { defaultSite, ensureBrandBlock, newBlock, blockLabels, type SiteDocument, type SiteBlock, type SiteItem, type BlockType } from '@site/website';
import './website-editor.css';
import './website-editor-polish.css';
import './website-editor-inline.css';

const api=axios.create({baseURL:ADMIN_API_URL,withCredentials:true,headers:{'X-Site-Editor':'1'}});
type State={revision:number;draft:SiteDocument|null;published:SiteDocument|null;publishedAt?:string;history:{id:string;at:string;document:SiteDocument}[]};
type CatalogProduct={id:string;name:string;price:string;image:string;category:string;isBestSeller:boolean};
const copy=<T,>(value:T):T=>JSON.parse(JSON.stringify(value));
const asset=(url:string)=>url.startsWith('/brand/')?new URL(`${import.meta.env.BASE_URL}${url.slice(1)}`,window.location.origin).href:/^https?:/.test(url)?url:new URL(url,new URL(ADMIN_API_URL,window.location.origin).origin).href;

/** Qué es cada bloque dentro de la portada real, en palabras del negocio. */
const blockHints:Record<BlockType,string>={
  hero:'Primera pantalla: la portada grande con la que abre la tienda.',
  benefits:'Las tarjetas de categorías. Si no editas los elementos, se muestran solas tus categorías reales del catálogo.',
  products:'La vitrina de productos. Eliges categoría, cantidad o productos concretos.',
  image:'Sección con imagen grande a un lado y texto al otro.',
  brands:'Cinta de marcas en movimiento. Sube el logo de cada marca; la que no tenga logo aparece con su nombre escrito.',
  faq:'Preguntas frecuentes desplegables.',
  gallery:'Cuadrícula de imágenes con título y texto.',
  text:'Bloque de texto suelto.',
  contact:'Bloque de contacto.',
};
/** Secciones con diseño propio en la tienda: ignoran espaciado, alineación y animación. */
const sceneTypes:BlockType[]=['hero','benefits','products','image','brands'];

function Field({label,value,onChange,type='text',min,max,hint}:{label:string;value:string|number;onChange:(v:string)=>void;type?:string;min?:number;max?:number;hint?:string}) {
  return <label className="we-field">{label}<input type={type} value={value} min={min} max={max} onChange={e=>onChange(e.target.value)}/>{hint&&<small className="we-hint">{hint}</small>}</label>;
}
function Group({title,children}:{title:string;children:ReactNode}) {
  return <section className="we-group"><h3>{title}</h3>{children}</section>;
}

/** La tienda real, en vivo, recibiendo el borrador por postMessage. */
function PreviewFrame({document:doc,selected,width,fill,onSelect}:{document:SiteDocument;selected:string;width:string;fill?:boolean;onSelect:(id:string)=>void}) {
  const frameRef=useRef<HTMLIFrameElement>(null);
  const ready=useRef(false);
  const [loaded,setLoaded]=useState(false);
  const docRef=useRef(doc);docRef.current=doc;
  const selectedRef=useRef(selected);selectedRef.current=selected;
  const post=useCallback((message:unknown)=>{frameRef.current?.contentWindow?.postMessage(message,STOREFRONT_URL||'*');},[]);
  useEffect(()=>{
    const onMessage=(event:MessageEvent)=>{
      if (event.source!==frameRef.current?.contentWindow) return;
      if (event.data?.type==='zetatech-preview-ready') {
        ready.current=true;setLoaded(true);
        post({type:'zetatech-editor-doc',document:docRef.current});
        post({type:'zetatech-editor-highlight',blockId:selectedRef.current});
      }
      if (event.data?.type==='zetatech-editor-select'&&typeof event.data.blockId==='string') onSelect(event.data.blockId);
    };
    window.addEventListener('message',onMessage);
    return ()=>window.removeEventListener('message',onMessage);
  },[onSelect,post]);
  useEffect(()=>{if(ready.current)post({type:'zetatech-editor-doc',document:doc});},[doc,post]);
  useEffect(()=>{if(ready.current)post({type:'zetatech-editor-highlight',blockId:selected});},[selected,post]);
  return <>
    {!loaded&&<p className="we-preview-loading">Abriendo la tienda…</p>}
    <iframe ref={frameRef} title="Vista previa de la tienda" src={`${STOREFRONT_URL}/?editor=1`} style={fill?{width,height:'100%',border:0,background:'white'}:{width,height:850,border:0,background:'white'}}/>
  </>;
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
  const [products,setProducts]=useState<CatalogProduct[]>([]);
  const dirty=JSON.stringify(doc)!==saved;
  const block=doc.blocks.find(b=>b.id===selected);
  useEffect(()=>{api.get('/cms/website').then(r=>{setState(r.data.data);const d=ensureBrandBlock(r.data.data.draft||r.data.data.published||copy(defaultSite));setDoc(d);setSaved(JSON.stringify(d));}).catch(()=>setError('No se pudo abrir el editor. Verifica tu sesión y la conexión con el servidor.'));},[]);
  useEffect(()=>{api.get('/cms/website/products').then(r=>setProducts(r.data.data)).catch(()=>setMessage('No se pudo cargar el catálogo para la vista previa.'));},[]);
  useEffect(()=>{const fn=(e:BeforeUnloadEvent)=>{if(dirty){e.preventDefault();e.returnValue='';}};window.addEventListener('beforeunload',fn);return()=>window.removeEventListener('beforeunload',fn);},[dirty]);
  useEffect(()=>{const fn=()=>{if(!document.fullscreenElement)setFocusMode(false);};document.addEventListener('fullscreenchange',fn);return()=>document.removeEventListener('fullscreenchange',fn);},[]);
  const selectFromPreview=useCallback((blockId:string)=>setSelected(blockId),[]);
  async function toggleFocusMode(){
    if(focusMode){setFocusMode(false);if(document.fullscreenElement)await document.exitFullscreen().catch(()=>{});return;}
    setFocusMode(true);
    try{await previewRef.current?.requestFullscreen();}catch{/* el modo visual de pantalla completa ya quedó activo */}
  }
  // `edit` acepta una funcion para que un cambio que ocurre despues de esperar
  // al servidor (subir una imagen) parta del documento actual y no de la copia
  // que tenia el componente cuando empezo la subida.
  type Change=SiteDocument|((d:SiteDocument)=>SiteDocument);
  const edit=(next:Change)=>{setHistory(h=>[...h.slice(-29),copy(doc)]);setFuture([]);setDoc(d=>typeof next==='function'?next(d):next);setMessage('');};
  const patchBlock=(d:SiteDocument,patch:Partial<SiteBlock>):SiteDocument=>({...d,blocks:d.blocks.map(b=>b.id===selected?{...b,...patch}:b)});
  const patchItem=(d:SiteDocument,index:number,patch:Partial<SiteItem>):SiteDocument=>({...d,blocks:d.blocks.map(b=>b.id===selected?{...b,items:b.items.map((x,n)=>n===index?{...x,...patch}:x)}:b)});
  const updateBlock=(patch:Partial<SiteBlock>)=>edit(d=>patchBlock(d,patch));
  const theme=(patch:Partial<SiteDocument['theme']>)=>edit(d=>({...d,theme:{...d.theme,...patch}}));
  const move=(id:string,index:number)=>{const blocks=[...doc.blocks];const current=blocks.findIndex(b=>b.id===id);if(current<0||index<0||index>=blocks.length)return;const [item]=blocks.splice(current,1);blocks.splice(index,0,item);edit({...doc,blocks});};
  async function persist(action:'save'|'publish'|'restore',versionId?:string){
    if(!state)return;
    if(action==='restore'&&dirty&&!window.confirm('Hay cambios sin guardar. ¿Reemplazarlos con esta versión?'))return;
    setBusy(true);setError('');
    try{const r=await api.post(`/cms/website/${action}`,{revision:state.revision,document:doc,versionId});setState(r.data.data);setDoc(r.data.data.draft);setSaved(JSON.stringify(r.data.data.draft));setMessage(action==='publish'?'Sitio publicado. La tienda mostrará esta versión.':action==='restore'?'Versión recuperada como borrador. Publícala cuando esté lista.':'Borrador guardado. La tienda publicada no ha cambiado.');}
    catch(e){setError(axios.isAxiosError(e)?e.response?.data?.message||'No se pudo guardar. Tus cambios siguen en el editor.':'No se pudo guardar.');}finally{setBusy(false);}
  }
  /** Sube una imagen a la biblioteca. Con `set` ademas la deja puesta en el
   *  campo desde el que se subio, en un solo paso del historial: subir el logo
   *  de una marca y tener que volver a buscarlo en una lista era el paso que
   *  sobraba. El servidor solo acepta JPG, PNG y WebP, y lo comprueba por los
   *  bytes del archivo, no por su nombre. */
  async function upload(file?:File,set?:(d:SiteDocument,url:string)=>SiteDocument){
    if(!file)return;
    if(!['image/jpeg','image/png','image/webp'].includes(file.type)||file.size>5*1024*1024){setError('Usa JPG, PNG o WebP de hasta 5 MB.');return;}
    setBusy(true);setError('');
    try{
      const form=new FormData();form.append('file',file);
      const r=await api.post('/cms/website/media',form);
      const url:string=r.data.url;
      if(!url)throw new Error();
      edit(d=>{const next={...d,media:Array.from(new Set([...d.media,url]))};return set?set(next,url):next;});
      setMessage(set?'Imagen subida y puesta en su campo. Guarda el borrador para conservarla.':'Imagen subida. Selecciónala en el bloque y guarda el borrador.');
    }catch{setError('No se pudo subir la imagen.');}finally{setBusy(false);}
  }
  const imageField=(label:string,value:string,set:(d:SiteDocument,url:string)=>SiteDocument,hint?:string)=><div className="we-image-field">
    <Field label={label} value={value} onChange={v=>edit(d=>set(d,v))} hint={hint}/>
    <div className="we-image-tools">
      <label className="we-upload">{busy?'Subiendo…':'Subir imagen'}<input type="file" accept="image/jpeg,image/png,image/webp" disabled={busy||doc.media.length>=100} onChange={e=>{upload(e.target.files?.[0],set);e.target.value='';}}/></label>
      <select aria-label={`Biblioteca: ${label}`} value="" onChange={e=>{const url=e.target.value;if(url)edit(d=>set(d,url));}}><option value="">Elegir de la biblioteca…</option>{doc.media.map((url,i)=><option key={url} value={url}>Imagen {i+1} · {url.split('/').pop()}</option>)}</select>
      {value&&<button type="button" onClick={()=>edit(d=>set(d,''))}>Quitar</button>}
    </div>
    {value&&<img className="we-image-preview" src={asset(value)} alt=""/>}
  </div>;
  type ItemLabels={group?:string;title:string;text?:string;image?:string;imageHint?:string;add:string;addLabel?:string};
  const itemsEditor=(current:SiteBlock,labels:ItemLabels,withImage:boolean,withLink:boolean)=><Group title={labels.group||'Elementos'}>
    {current.items.map((item,i)=><div className="we-item" key={i}>
      <Field label={labels.title} value={item.title} onChange={v=>edit(d=>patchItem(d,i,{title:v}))}/>
      {labels.text&&<label className="we-field">{labels.text}<textarea rows={2} value={item.text} onChange={e=>{const text=e.target.value;edit(d=>patchItem(d,i,{text}));}}/></label>}
      {withImage&&imageField(labels.image||'Imagen',item.image,(d,url)=>patchItem(d,i,{image:url}),labels.imageHint)}
      {withLink&&<Field label="Enlace" value={item.href} onChange={v=>edit(d=>patchItem(d,i,{href:v}))} hint="Ej: /categoria/smartwatches"/>}
      <button onClick={()=>updateBlock({items:current.items.filter((_,n)=>n!==i)})}>Eliminar</button>
    </div>)}
    <button disabled={current.items.length>=12} onClick={()=>updateBlock({items:[...current.items,{title:labels.add,text:'',image:'',href:'/shop'}]})}>{labels.addLabel||'Agregar elemento'}</button>
  </Group>;

  return <div className="we-editor"><header className="we-toolbar"><div><h1>Editor de Zetatech</h1><small>{dirty?'Cambios sin guardar':'Cambios guardados'} · {state?.publishedAt?`Última publicación: ${new Date(state.publishedAt).toLocaleString('es-EC')}`:'Sin publicar'}</small></div><div className="we-actions"><button disabled={!history.length||busy} onClick={()=>{setFuture(f=>[copy(doc),...f]);setDoc(history[history.length-1]);setHistory(h=>h.slice(0,-1));}}>Deshacer</button><button disabled={!future.length||busy} onClick={()=>{setHistory(h=>[...h,copy(doc)]);setDoc(future[0]);setFuture(f=>f.slice(1));}}>Rehacer</button><button disabled={busy||!state} onClick={()=>persist('save')}>Guardar borrador</button><button className="we-primary" disabled={busy||!state} onClick={()=>persist('publish')}>{busy?'Procesando…':'Publicar'}</button></div></header>
    {message&&<p role="status" className="we-message">{message}</p>}{error&&<p role="alert" className="we-error">{error}</p>}
    <div className="we-layout">
      <aside className="we-panel"><button onClick={()=>setSelected('appearance')}>Apariencia y navegación</button><h2>Secciones</h2><p>Haz clic en una sección de la vista previa para editarla. Arrastra aquí para cambiar el orden en que aparecen.</p>{doc.blocks.map((b,i)=><div key={b.id} className={`we-block-row ${selected===b.id?'we-selected':''}`} draggable onDragStart={()=>setDrag(b.id)} onDragOver={e=>e.preventDefault()} onDrop={()=>move(drag,i)}><button onClick={()=>setSelected(b.id)}>{b.hidden?'◌':'●'} {b.title||blockLabels[b.type]}<small>{blockLabels[b.type]}</small></button><div><button aria-label={`Subir ${b.title}`} disabled={i===0} onClick={()=>move(b.id,i-1)}>↑</button><button aria-label={`Bajar ${b.title}`} disabled={i===doc.blocks.length-1} onClick={()=>move(b.id,i+1)}>↓</button></div></div>)}
        <label className="we-field">Agregar sección<select value="" disabled={doc.blocks.length>=40} onChange={e=>{const b=newBlock(e.target.value as BlockType,crypto.randomUUID());edit({...doc,blocks:[...doc.blocks,b]});setSelected(b.id);}}><option value="">Seleccionar…</option>{Object.entries(blockLabels).map(([value,label])=><option key={value} value={value}>{label}</option>)}</select></label>
        <h2>Biblioteca</h2><input aria-label="Subir imagen" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy||doc.media.length>=100} onChange={e=>{upload(e.target.files?.[0]);e.target.value='';}}/><div className="we-library">{doc.media.map(url=><img key={url} src={asset(url)} alt={url.split('/').pop()}/>)}</div>
        <h2>Versiones publicadas</h2>{state?.history.map(h=><button key={h.id} disabled={busy} onClick={()=>persist('restore',h.id)}>Recuperar {new Date(h.at).toLocaleString('es-EC')}</button>)}</aside>

      <section ref={previewRef} className={`we-preview${focusMode?' we-preview-focus':''}`}><div className="we-actions"><button onClick={()=>setWidth('100%')}>Escritorio</button><button onClick={()=>setWidth('768px')}>Tablet</button><button onClick={()=>setWidth('390px')}>Móvil</button><span>Tienda real · los cambios se ven al instante</span><button className="we-focus-toggle" onClick={toggleFocusMode}>{focusMode?'✕ Salir de pantalla completa':'⛶ Pantalla completa'}</button></div>
        <PreviewFrame document={doc} selected={selected} width={width} fill={focusMode} onSelect={selectFromPreview}/></section>

      <aside className="we-panel we-properties"><h2>{selected==='appearance'?'Apariencia del sitio':blockLabels[block?.type||'text']}</h2>{selected==='appearance'?<>
        <Group title="Marca">
          <Field label="Nombre de la marca" value={doc.theme.brand} onChange={v=>theme({brand:v})}/>
          <Field label="Descripción SEO" value={doc.theme.description} onChange={v=>theme({description:v})}/>
          {imageField('Logo',doc.theme.logo,(d,url)=>({...d,theme:{...d.theme,logo:url}}))}{imageField('Favicon',doc.theme.favicon,(d,url)=>({...d,theme:{...d.theme,favicon:url}}))}
        </Group>
        <Group title="Menú y pie">
          <Field label="Texto del carrito" value={doc.theme.cartLabel} onChange={v=>theme({cartLabel:v})}/>
          <Field label="Texto del acceso al catálogo" value={doc.theme.searchLabel} onChange={v=>theme({searchLabel:v})}/>
          <Field label="Texto del pie" value={doc.theme.footer} onChange={v=>theme({footer:v})}/>
          {doc.theme.links.map((l,i)=><div className="we-item" key={i}><Field label="Etiqueta" value={l.label} onChange={v=>theme({links:doc.theme.links.map((x,n)=>n===i?{...x,label:v}:x)})}/><Field label="Destino" value={l.href} onChange={v=>theme({links:doc.theme.links.map((x,n)=>n===i?{...x,href:v}:x)})}/><button onClick={()=>theme({links:doc.theme.links.filter((_,n)=>n!==i)})}>Eliminar enlace</button></div>)}
          <button disabled={doc.theme.links.length>=8} onClick={()=>theme({links:[...doc.theme.links,{label:'Nuevo enlace',href:'/shop'}]})}>Agregar enlace</button>
        </Group>
        <Group title="Estilo">
          <label className="we-field">Tipografía<select value={doc.theme.font} onChange={e=>theme({font:e.target.value as SiteDocument['theme']['font']})}><option value="system">Sans / moderna</option><option value="serif">Serif / editorial</option><option value="mono">Mono / tecnológica</option></select></label>
          <Field label="Tamaño de letra" type="number" min={14} max={22} value={doc.theme.fontSize} onChange={v=>theme({fontSize:Number(v)})}/>
          <Field label="Redondeado" type="number" min={0} max={32} value={doc.theme.radius} onChange={v=>theme({radius:Number(v)})}/>
          {(['accent','background','foreground'] as const).map((key,i)=><Field key={key} type="color" label={['Color de la marca','Fondo','Texto'][i]} value={doc.theme[key]} onChange={v=>theme({[key]:v})}/>)}
        </Group>
      </>:block&&<>
        <p className="we-hint">{blockHints[block.type]}</p>
        <Group title="Contenido">
          <label className="we-check"><input type="checkbox" checked={!block.hidden} onChange={e=>updateBlock({hidden:!e.target.checked})}/> Mostrar esta sección en la tienda</label>
          <Field label="Etiqueta superior" value={block.eyebrow??''} onChange={v=>updateBlock({eyebrow:v})} hint="La línea pequeña en mayúsculas encima del título."/>
          <Field label="Título" value={block.title} onChange={v=>updateBlock({title:v})}/>
          <label className="we-field">Texto<textarea rows={4} value={block.text} onChange={e=>updateBlock({text:e.target.value})}/></label>
        </Group>

        {(block.type==='hero'||block.type==='image')&&<Group title="Imagen">
          {imageField('Imagen',block.image,(d,url)=>patchBlock(d,{image:url}))}
          {imageField('Imagen para celular (opcional)',block.mobileImage,(d,url)=>patchBlock(d,{mobileImage:url}))}
          <Field label="Descripción de la imagen" value={block.alt} onChange={v=>updateBlock({alt:v})} hint="Para buscadores y lectores de pantalla."/>
          {block.type==='image'&&<label className="we-field">Acercamiento al pasar el cursor ({block.zoom.toFixed(2)}×)<input type="range" min={1} max={1.2} step={.01} value={block.zoom} onChange={e=>updateBlock({zoom:Number(e.target.value)})}/></label>}
        </Group>}

        {block.type==='hero'&&<Group title="Producto de la portada">
          <label className="we-field">Producto destacado<select value={block.productIds[0]||''} onChange={e=>updateBlock({productIds:e.target.value?[e.target.value]:[]})}><option value="">Usar la imagen de arriba</option>{products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
          <p className="we-hint">Si eliges un producto, la portada muestra su foto, su precio y su enlace en vez de la imagen.</p>
        </Group>}

        {block.type!=='faq'&&<Group title="Botón">
          <Field label="Texto del botón" value={block.button} onChange={v=>updateBlock({button:v})} hint="Déjalo vacío para no mostrar botón."/>
          <Field label="Destino del botón" value={block.href} onChange={v=>updateBlock({href:v})} hint="Ej: /shop o /categoria/audio-y-video"/>
        </Group>}

        {block.type==='products'&&<Group title="Qué productos mostrar">
          <Field label="Categoría (vacío: todas)" value={block.category} onChange={v=>updateBlock({category:v})}/>
          <Field label="Cantidad" type="number" min={1} max={12} value={block.limit} onChange={v=>updateBlock({limit:Number(v)})}/>
          <label className="we-check"><input type="checkbox" checked={block.featured} onChange={e=>updateBlock({featured:e.target.checked})}/> Solo destacados</label>
          <label className="we-field">Productos concretos (opcional)<select multiple size={6} value={block.productIds} onChange={e=>updateBlock({productIds:Array.from(e.target.selectedOptions,o=>o.value).slice(0,12)})}>{products.map(p=><option key={p.id} value={p.id}>{p.name}</option>)}</select></label>
          <button onClick={()=>updateBlock({productIds:[]})}>Usar selección automática</button>
        </Group>}

        {block.type==='benefits'&&itemsEditor(block,{title:'Categoría',text:'Texto breve',add:'Nueva categoría'},true,true)}
        {block.type==='brands'&&itemsEditor(block,{group:'Marcas y sus logos',title:'Nombre de la marca',image:'Logo',imageHint:'PNG con fondo transparente se ve mejor sobre el fondo oscuro. Sin logo se muestra el nombre escrito.',add:'Nueva marca',addLabel:'Agregar marca'},true,true)}
        {block.type==='gallery'&&itemsEditor(block,{title:'Título',text:'Texto',add:'Nuevo elemento'},true,true)}
        {block.type==='faq'&&itemsEditor(block,{group:'Preguntas',title:'Pregunta',text:'Respuesta',add:'Nueva pregunta',addLabel:'Agregar pregunta'},false,false)}

        {block.type!=='hero'&&<Group title="Colores">
          <Field label="Fondo" type="color" value={block.background} onChange={v=>updateBlock({background:v})}/>
          <Field label="Texto" type="color" value={block.foreground} onChange={v=>updateBlock({foreground:v})}/>
        </Group>}

        {!sceneTypes.includes(block.type)&&<Group title="Diseño">
          <Field label="Espaciado vertical" type="number" min={16} max={120} value={block.padding} onChange={v=>updateBlock({padding:Number(v)})}/>
          <label className="we-field">Alineación<select value={block.align} onChange={e=>updateBlock({align:e.target.value as SiteBlock['align']})}><option value="left">Izquierda</option><option value="center">Centro</option></select></label>
          <label className="we-field">Animación de entrada<select value={block.motion} onChange={e=>updateBlock({motion:e.target.value as SiteBlock['motion']})}>{['none','fade','zoom','slide'].map((v,i)=><option key={v} value={v}>{['Ninguna','Desvanecer','Zoom','Desplazar'][i]}</option>)}</select></label>
          <Field label="Duración (ms)" type="number" min={100} max={2000} value={block.duration} onChange={v=>updateBlock({duration:Number(v)})}/>
        </Group>}

        <Group title="Esta sección">
          <button disabled={doc.blocks.length>=40} onClick={()=>{const b={...copy(block),id:crypto.randomUUID()};edit({...doc,blocks:[...doc.blocks,b]});setSelected(b.id);}}>Duplicar</button>
          <button onClick={()=>{edit({...doc,blocks:doc.blocks.filter(b=>b.id!==selected)});setSelected('appearance');}}>Eliminar</button>
        </Group>
      </>}</aside>
    </div></div>;
}
