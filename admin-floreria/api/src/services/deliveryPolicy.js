const normalize=value=>String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/\s+/g,' ').trim();
function shippingForDelivery(payload,rates) {
  const city=normalize(payload.deliveryCity);
  if(city==='guayaquil')return 0;
  const configured=Array.isArray(rates)?rates:[];
  const rate=configured.find(item=>normalize(item.sector)===normalize(payload.sector));
  // Legacy clients retain their previous sector calculation. New clients must
  // have an explicit configured route outside the local free-delivery zone.
  if((city||configured.length)&&!rate){const error=new Error('Selecciona un sector con cobertura para envíos fuera de Guayaquil.');error.statusCode=400;throw error;}
  const cost=rate?(rate.cost===null||rate.cost===''||typeof rate.cost==='boolean'?NaN:Number(rate.cost)):0;
  if(!Number.isFinite(cost)||cost<0){const error=new Error('El costo de envío no está configurado correctamente.');error.statusCode=503;throw error;}
  return Math.round(cost*100)/100;
}
module.exports={shippingForDelivery};
