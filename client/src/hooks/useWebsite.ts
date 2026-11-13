import { useQuery } from '@tanstack/react-query';
import { resolveApiUrl } from '@/lib/api';
import { useEditorDocument } from '@/lib/site-editor';
import { defaultSite, type SiteDocument } from '@shared/website';
export async function fetchWebsite(baseUrl?:string):Promise<SiteDocument> {
    const response=await fetch(resolveApiUrl('/api/external/website',baseUrl),{cache:'no-store'});
    if (!response.ok) throw new Error('No se pudo cargar el sitio');
    const result=await response.json();
    return result.data || defaultSite;
}
export function useWebsite() {
  const query=useQuery<SiteDocument>({queryKey:['website','published'],queryFn:()=>fetchWebsite(),staleTime:0,refetchInterval:30000,refetchOnWindowFocus:true,retry:1});
  // En la vista previa del editor manda el borrador que envía el panel.
  const draft=useEditorDocument();
  return draft?{...query,data:draft}:query;
}
