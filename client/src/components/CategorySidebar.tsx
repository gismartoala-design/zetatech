import {useState} from 'react';
import {Link,useLocation} from 'wouter';
import {useCategories} from '@/hooks/useCategories';
import {cn} from '@/lib/utils';
import {ChevronDown,Filter} from 'lucide-react';
import {BEST_SELLERS_CATEGORY_NAME,buildCategoryTree,formatCategoryDisplayName,getCategoryPath,splitCategoryPath,areSameCategory} from '@shared/catalog';

interface CategorySidebarProps {
  activeCategory?:string|null;
  setActiveCategory?:(category:string|null)=>void;
  variant?:'filter'|'link';
  enabled?:boolean;
}
export function CategorySidebar({activeCategory=null,setActiveCategory,variant='filter',enabled=true}:CategorySidebarProps) {
  const [isOpen,setIsOpen]=useState(false);
  const [,setLocation]=useLocation();
  const {data=[],isLoading,isError,refetch}=useCategories(enabled);
  const tree=buildCategoryTree(data.filter(name=>!areSameCategory(name,BEST_SELLERS_CATEGORY_NAME)));
  const select=(name:string|null)=>{
    setIsOpen(false);
    if(variant==='filter')setActiveCategory?.(name);
    else setLocation((name?getCategoryPath(name):'/shop')+'#product-list');
  };
  const choice=(name:string|null,child=false)=>{
    const label=name?formatCategoryDisplayName(child?splitCategoryPath(name).child:name):'Todos los productos';
    const active=name?Boolean(activeCategory&&areSameCategory(activeCategory,name)):!activeCategory;
    const className=cn('block w-full rounded-lg px-3 py-3 text-left text-sm transition-colors hover:bg-accent/10',child&&'border-l border-accent/20 pl-5 text-foreground/75',active?'bg-accent/10 font-semibold text-accent':'text-foreground');
    return variant==='filter'?<button type="button" className={className} aria-pressed={active} onClick={()=>select(name)}>{label}</button>:<Link href={(name?getCategoryPath(name):'/shop')+'#product-list'} className={className} aria-current={active?'page':undefined} onClick={e=>{e.preventDefault();select(name);}}>{label}</Link>;
  };
  return <div className="w-full lg:w-72">
    <button type="button" className="mb-3 flex w-full items-center justify-between rounded-xl border border-border bg-white px-5 py-4 text-sm font-semibold lg:hidden" aria-expanded={isOpen} aria-controls="catalog-category-tree" onClick={()=>setIsOpen(value=>!value)}><span className="flex items-center gap-2"><Filter className="h-4 w-4 text-accent"/>{activeCategory?formatCategoryDisplayName(activeCategory):'Categorías y subcategorías'}</span><ChevronDown className={cn('h-4 w-4 transition-transform',isOpen&&'rotate-180')}/></button>
    <nav id="catalog-category-tree" aria-label="Categorías y subcategorías" className={cn('surface-card max-h-[70vh] overflow-y-auto p-5 lg:block',!isOpen&&'hidden')}>
      <h2 className="mb-4 font-sans text-lg font-semibold">Categorías</h2>
      {!enabled||isLoading?<p role="status" className="text-sm">Cargando categorías…</p>:isError?<p role="alert" className="text-sm">No se pudieron cargar. <button type="button" className="underline" onClick={()=>void refetch()}>Reintentar</button></p>:<ul className="space-y-1">
        <li>{choice(null)}</li><li>{choice(BEST_SELLERS_CATEGORY_NAME)}</li>
        {tree.map(root=><li key={root.name} className="border-t border-border/50 pt-1">{choice(root.name)}{root.children.length>0&&<ul aria-label={'Subcategorías de '+root.name} className="ml-4">{root.children.map(child=><li key={child}>{choice(child,true)}</li>)}</ul>}</li>)}
      </ul>}
    </nav>
  </div>;
}
