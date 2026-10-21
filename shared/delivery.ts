export const LOCAL_DELIVERY_CITY='Guayaquil';
export const LOCAL_DELIVERY_MESSAGE='Envío gratis en Guayaquil · Entrega en 24 horas';
const normalize=(value:string)=>value.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
export function resolveDelivery(city:string,sector:string,rates:{sector:string;cost:number}[]) {
  if(normalize(city)==='guayaquil')return {cost:0,matchedSector:sector.trim(),isMatched:Boolean(sector.trim()),isAvailable:true};
  const rate=rates.find(item=>normalize(item.sector)===normalize(sector));
  return {cost:rate?.cost||0,matchedSector:rate?.sector||'',isMatched:Boolean(rate),isAvailable:Boolean(rate)};
}
