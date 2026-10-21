import {useEffect,useState} from 'react';
import {Button} from '@/shared/components/ui/button';
import {Input} from '@/shared/components/ui/input';
import service from '@/core/api/service';
import {toast} from 'sonner';
import {buildCategoryTree,splitCategoryPath,areSameCategory} from '@site/catalog';

export default function CategorySelect({value,suggestions,onChange}:{value:string;suggestions:string[];onChange:(value:string)=>void}) {
  const [categories,setCategories]=useState<string[]>([]);
  const [creating,setCreating]=useState<'parent'|'child'|null>(null);
  const [name,setName]=useState('');
  const [loading,setLoading]=useState(true);
  const [saving,setSaving]=useState(false);
  const [error,setError]=useState('');
  const load=async()=>{
    setLoading(true);setError('');
    try{const r=await service.get('/products/categories');setCategories(r.data.data);}
    catch{setError('No se pudo cargar la lista de categorías.');}
    finally{setLoading(false);}
  };
  useEffect(()=>{void load();},[]);
  const tree=buildCategoryTree([...categories,...suggestions,...(value?[value]:[])]);
  const selected=splitCategoryPath(value);
  const parent=tree.find(root=>areSameCategory(root.name,selected.parent));
  const create=async()=>{
    if(!name.trim())return;
    setSaving(true);setError('');
    try {
      const r=await service.post('/products/categories',{name:name.trim(),...(creating==='child'?{parent:selected.parent}:{})});
      const choice=r.data.data.name;
      setCategories(items=>[...new Set([...items,choice])]);onChange(choice);setCreating(null);setName('');toast.success(r.data.message);
    }catch(e){setError((e as {response?:{data?:{message?:string}}}).response?.data?.message||'No se pudo guardar la categoría.');}
    finally{setSaving(false);}
  };
  const selectClass='h-11 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900';
  return <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2"><label htmlFor="product-category" className="text-sm font-semibold">Categoría principal *</label>
        <select id="product-category" value={parent?.name||''} required disabled={saving} className={selectClass} onChange={e=>{onChange(e.target.value);setCreating(null);setName('');}}>
          <option value="">{loading?'Cargando…':'Selecciona una categoría'}</option>{tree.map(root=><option key={root.name} value={root.name}>{root.name}</option>)}
        </select>
        <Button type="button" variant="outline" size="sm" disabled={saving} onClick={()=>{setCreating('parent');setName('');}}>+ Crear categoría</Button>
      </div>
      <div className="space-y-2"><label htmlFor="product-subcategory" className="text-sm font-semibold">Subcategoría</label>
        <select id="product-subcategory" value={parent?.name&&selected.child?parent.children.find(child=>areSameCategory(child,value))||'':''} disabled={saving||!parent} className={selectClass} onChange={e=>onChange(e.target.value||parent?.name||'')}>
          <option value="">Sin subcategoría</option>{parent?.children.map(child=><option key={child} value={child}>{splitCategoryPath(child).child}</option>)}
        </select>
        <Button type="button" variant="outline" size="sm" disabled={saving||!parent} onClick={()=>{setCreating('child');setName('');}}>+ Crear subcategoría</Button>
      </div>
    </div>
    {creating&&<div className="space-y-2 rounded-lg border border-border p-3"><label htmlFor="new-category-name" className="text-sm">{creating==='child'?'Nueva subcategoría de '+selected.parent:'Nueva categoría principal'}</label><div className="flex gap-2"><Input id="new-category-name" maxLength={120} placeholder={creating==='child'?'Ej: Laptops':'Ej: Computadoras'} value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();void create();}}}/><Button type="button" disabled={saving||!name.trim()} onClick={()=>void create()}>{saving?'Guardando…':'Crear y seleccionar'}</Button></div><button type="button" className="text-xs underline" onClick={()=>setCreating(null)}>Cancelar</button></div>}
    {error&&<p role="alert" className="text-sm text-red-600">{error} <button type="button" onClick={()=>void load()} className="underline">Reintentar</button></p>}
    <p className="text-xs text-muted-foreground">Ejemplo: Computadoras › Laptops. La subcategoría es opcional; los productos existentes conservan su categoría.</p>
  </div>;
}
