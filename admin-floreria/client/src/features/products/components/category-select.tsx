import {useEffect,useState} from 'react';
import {Button} from '@/shared/components/ui/button';
import {Input} from '@/shared/components/ui/input';
import service from '@/core/api/service';
import {toast} from 'sonner';

export default function CategorySelect({value,suggestions,onChange}:{value:string;suggestions:string[];onChange:(value:string)=>void}) {
  const [categories,setCategories]=useState<string[]>([]);
  const [creating,setCreating]=useState(false);
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
  const distinct=new Map<string,string>();
  for(const name of [...(value?[value]:[]),...categories,...suggestions]) {
    const key=name.normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase();
    if(key&&!distinct.has(key))distinct.set(key,name);
  }
  const choices=[...distinct.values()].sort((a,b)=>a.localeCompare(b,'es'));
  const create=async()=>{
    if(!name.trim())return;
    setSaving(true);setError('');
    try {
      const r=await service.post('/products/categories',{name:name.trim()});
      const selected=r.data.data.name;
      setCategories(items=>[...new Set([...items,selected])]);onChange(selected);setCreating(false);setName('');toast.success(r.data.message);
    }catch(e){setError((e as {response?:{data?:{message?:string}}}).response?.data?.message||'No se pudo crear la categoría. Intenta nuevamente.');}
    finally{setSaving(false);}
  };
  return <div className="space-y-3 rounded-xl border border-border bg-muted/20 p-4">
    <div className="flex items-center justify-between gap-3"><label htmlFor="product-category" className="text-sm font-semibold">Categoría</label><Button type="button" variant="outline" size="sm" disabled={saving} onClick={()=>{setCreating(v=>!v);setError('');}}>+ Crear categoría</Button></div>
    <select id="product-category" value={value} onChange={e=>onChange(e.target.value)} required disabled={saving} className="h-11 w-full rounded-md border border-gray-300 bg-white px-3 text-sm text-gray-900">
      <option value="" disabled>{loading?'Cargando categorías…':choices.length?'Selecciona una categoría':'Crea tu primera categoría'}</option>
      {choices.map(item=><option key={item} value={item}>{item}</option>)}
    </select>
    {creating&&<div className="space-y-3 rounded-lg border bg-background p-3"><label htmlFor="new-product-category" className="text-sm font-medium">Nombre de la nueva categoría</label><Input id="new-product-category" value={name} maxLength={120} placeholder="Ej.: Audio, Gaming o Accesorios" disabled={saving} onChange={e=>setName(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();void create();}}}/><div className="flex gap-2"><Button type="button" className="bg-emerald-700 text-white hover:bg-emerald-800" disabled={saving||!name.trim()} onClick={()=>void create()}>{saving?'Creando…':'Crear y seleccionar'}</Button><Button type="button" variant="ghost" disabled={saving} onClick={()=>{setCreating(false);setName('');}}>Cancelar</Button></div></div>}
    {error&&<p role="alert" className="text-sm text-red-600">{error} <button type="button" className="underline" disabled={loading} onClick={()=>void load()}>Volver a cargar</button></p>}
    <p className="text-xs text-muted-foreground">Las categorías se guardan para reutilizarlas en otros productos. Las que tengan productos activos aparecerán en el catálogo.</p>
  </div>;
}
