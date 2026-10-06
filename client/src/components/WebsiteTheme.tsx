import { useEffect } from 'react';
import { useWebsite } from '@/hooks/useWebsite';
import { defaultSite } from '@shared/website';
import { siteFonts } from '@shared/SiteRenderer';
import { toPublicImageUrl } from '@/lib/media';
export function WebsiteTheme(){
  const {data}=useWebsite();
  const theme=(data||defaultSite).theme;
  useEffect(()=>{
    const root=document.documentElement;
    const values:Record<string,string>={'--color-accent':theme.accent,'--color-background':theme.background,'--color-foreground':theme.foreground,'--font-sans':siteFonts[theme.font],'--font-serif':siteFonts[theme.font],'--radius':`${theme.radius}px`};
    const before=Object.fromEntries(Object.keys(values).map(k=>[k,root.style.getPropertyValue(k)]));
    const fontSize=root.style.fontSize;
    Object.entries(values).forEach(([k,v])=>root.style.setProperty(k,v));root.style.fontSize=`${theme.fontSize}px`;
    let favicon:HTMLLinkElement|null=null;
    if(theme.favicon){favicon=document.createElement('link');favicon.rel='icon';favicon.href=toPublicImageUrl(theme.favicon)||theme.favicon;document.head.appendChild(favicon);}
    return()=>{Object.entries(before).forEach(([k,v])=>v?root.style.setProperty(k,v):root.style.removeProperty(k));root.style.fontSize=fontSize;favicon?.remove();};
  },[theme]);
  return null;
}
