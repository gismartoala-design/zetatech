export const PAYMENT_METHOD_OPTIONS = [
  {id:'Datafast',name:'Datafast / tarjetas',description:'Tarjetas mediante el formulario seguro de Datafast.'},
  {id:'PayPal',name:'PayPal',description:'Pago internacional desde tu cuenta o tarjeta.'},
  {id:'Payphone',name:'PayPhone',description:'Pasarela PayPhone, disponible si conservas esta integración.'},
  {id:'Banco',name:'Transferencia bancaria',description:'El cliente recibe las instrucciones y adjunta su comprobante.'},
  {id:'Zelle',name:'Zelle',description:'Pago con las instrucciones que configures para Zelle.'},
  {id:'Contra entrega',name:'Pago contra entrega',description:'El cliente paga al recibir y obtiene su guía de pedido.'},
] as const;
export type StorePaymentMethod = typeof PAYMENT_METHOD_OPTIONS[number]['id'];
export const DEFAULT_ENABLED_METHODS:StorePaymentMethod[]=['Datafast','PayPal','Banco','Zelle','Contra entrega'];
export function enabledPaymentMethods(value:unknown):StorePaymentMethod[] {
  if(!Array.isArray(value))return [...DEFAULT_ENABLED_METHODS];
  return PAYMENT_METHOD_OPTIONS.map(m=>m.id).filter(id=>value.includes(id));
}
