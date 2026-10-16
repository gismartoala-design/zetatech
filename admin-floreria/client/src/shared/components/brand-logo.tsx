import { BRAND_LOGO } from '@site/brand';

export function BrandLogo({className='h-12 w-auto max-w-full'}:{className?:string}) {
  return <img src={`${import.meta.env.BASE_URL}${BRAND_LOGO.slice(1)}`} alt="ZettaTech · Tienda de tecnología" width="244" height="60" className={className}/>;
}
