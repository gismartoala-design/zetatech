import { getNumericPriceValue } from './catalog';

export function comparePrices(price: string, originalPrice?: string | null) {
  const current=Number(getNumericPriceValue(price)),previous=Number(getNumericPriceValue(originalPrice));
  const active=current>0&&previous>current;
  return {active,percent:active?Math.round((previous-current)/previous*100):0};
}
export function PriceDisplay({price,originalPrice,className=''}:{price:string;originalPrice?:string|null;className?:string}) {
  const offer=comparePrices(price,originalPrice);
  return <div className={`zt-pricing ${className}`}>
    {offer.active&&<span className="zt-pricing-before"><small>Antes</small><del>{originalPrice}</del></span>}
    <span className="zt-pricing-current"><small>{offer.active?'Ahora':'Precio'}</small><strong>{price}</strong></span>
    {offer.active&&<span className="zt-pricing-saving">{offer.percent>0?`−${offer.percent}%`:'Oferta'}</span>}
  </div>;
}
