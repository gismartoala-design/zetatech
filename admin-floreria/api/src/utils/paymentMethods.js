const ALL_METHODS=['Datafast','PayPal','Payphone','Banco','Zelle','Contra entrega'];
const DEFAULT_METHODS=['Datafast','PayPal','Banco','Zelle','Contra entrega'];
function enabledPaymentMethods(settings={}) {
  return Array.isArray(settings?.enabledMethods)?ALL_METHODS.filter(name=>settings.enabledMethods.includes(name)):[...DEFAULT_METHODS];
}
function assertPaymentMethodEnabled(settings,method) {
  if(!ALL_METHODS.includes(method)){const e=new Error('Selecciona un método de pago válido.');e.statusCode=400;throw e;}
  if(!enabledPaymentMethods(settings).includes(method)){const e=new Error('Este método de pago fue desactivado. Actualiza el checkout y selecciona otro.');e.statusCode=409;throw e;}
}
function validateEnabledMethods(value) {
  if(!Array.isArray(value)||value.some(name=>!ALL_METHODS.includes(name))){const e=new Error('La selección de métodos de pago no es válida.');e.statusCode=400;throw e;}
  return [...new Set(value)];
}
module.exports={enabledPaymentMethods,assertPaymentMethodEnabled,validateEnabledMethods};
