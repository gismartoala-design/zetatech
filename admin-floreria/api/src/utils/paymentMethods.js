const ALL_METHODS=['Coordinar con ventas','Datafast','PayPal','Payphone','Banco','Zelle','Contra entrega'];
const DEFAULT_METHODS=['Coordinar con ventas','Datafast','PayPal','Banco','Zelle','Contra entrega'];
function configuredPaymentMethods(settings={}) {
  let methods=Array.isArray(settings?.enabledMethods)?ALL_METHODS.filter(name=>settings.enabledMethods.includes(name)):[...DEFAULT_METHODS];
  // Existing active stores gain the new assisted option. An empty list still
  // disables checkout, and saving the selection explicitly can turn it off.
  if(methods.length&&settings?.assistedCheckoutEnabled!==false&&!methods.includes('Coordinar con ventas'))methods.unshift('Coordinar con ventas');
  if(settings?.assistedCheckoutEnabled===false)methods=methods.filter(name=>name!=='Coordinar con ventas');
  return methods;
}
function enabledPaymentMethods(settings={}) {
  let methods=configuredPaymentMethods(settings);
  if(process.env.PAYPHONE_ENABLED==='false')methods=methods.filter(name=>name!=='Payphone');
  if(process.env.PAYPHONE_ENABLED==='true'&&require('../services/payphoneConfig').getActivePayphoneCredentials(settings).configured&&!methods.includes('Payphone'))methods.push('Payphone');
  return methods;
}
function assertPaymentMethodEnabled(settings,method) {
  if(!ALL_METHODS.includes(method)){const e=new Error('Selecciona un método de pago válido.');e.statusCode=400;throw e;}
  if(!enabledPaymentMethods(settings).includes(method)){const e=new Error('Este método de pago fue desactivado. Actualiza el checkout y selecciona otro.');e.statusCode=409;throw e;}
}
function validateEnabledMethods(value) {
  if(!Array.isArray(value)||value.some(name=>!ALL_METHODS.includes(name))){const e=new Error('La selección de métodos de pago no es válida.');e.statusCode=400;throw e;}
  return [...new Set(value)];
}
module.exports={configuredPaymentMethods,enabledPaymentMethods,assertPaymentMethodEnabled,validateEnabledMethods};
