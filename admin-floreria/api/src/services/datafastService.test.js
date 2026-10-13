const assert = require('node:assert/strict');
const { datafastConfig, approvedDatafastPayment, createDatafastCheckout, confirmDatafastPayment } = require('./datafastService');
const { quoteStorefrontOrder } = require('./storefrontQuote');

async function main() {
  const settings = { datafastEnvironment:'sandbox', datafastEntityId:'fixture', datafastToken:'fixture', datafastMid:'fixture', datafastTid:'fixture', datafastPserv:'fixture', datafastRisk:'fixture', datafastVatRate:'0' };
  assert.equal(datafastConfig({}, {}).ready, false);
  assert.equal(datafastConfig(settings, {}).ready, true);
  assert.equal(datafastConfig({...settings,datafastEnvironment:'live'}, {}).ready, false);
  assert.equal(datafastConfig({...settings,datafastEnvironment:'live',datafastCertified:'true'}, {}).ready, true);
  const order = { orderNumber:'ZETATECH-fixture',total:43 };
  const approved = { result:{code:'000.000.000'},paymentType:'DB',currency:'USD',amount:'43.00',merchantTransactionId:order.orderNumber };
  assert.equal(approvedDatafastPayment(approved,order,'live'),true);
  assert.equal(approvedDatafastPayment({...approved,amount:'1.00'},order,'live'),false);
  assert.equal(approvedDatafastPayment({...approved,currency:'EUR'},order,'live'),false);
  assert.equal(approvedDatafastPayment({...approved,merchantTransactionId:'another-order'},order,'live'),false);
  assert.equal(approvedDatafastPayment({...approved,result:{code:'000.200.100'}},order,'live'),false);
  assert.equal(approvedDatafastPayment({...approved,result:{code:'000.100.112'}},order,'live'),false);
  assert.equal(approvedDatafastPayment({...approved,resultDetails:{Response:'05'}},order,'live'),false);

  const company={id:'company',name:'Zetatech',settings:{acceptOrders:true,paymentSettings:{...settings,shippingSectorRates:[{sector:'Urdesa',cost:3}]}}};
  const product={id:'p1',name:'Audífonos',price:20,stock:3,hasVariants:false,variants:[]};
  const db={company:{findMany:async()=>[company],findFirst:async()=>company},product:{findMany:async()=>[product]}};
  const payload={items:[{productId:'p1',quantity:2,price:0.01}],total:0.02,sector:'Urdesa',senderName:'Cliente Prueba',senderEmail:'fixture@example.invalid',senderPhone:'0991234567',senderDocument:'0912345678',senderDocumentType:'CEDULA',receiverName:'Cliente Prueba',exactAddress:'Calle de prueba 1',billingAddress:'Calle de prueba 1',billingCountry:'EC',customerIp:'127.0.0.1'};
  const quote=await quoteStorefrontOrder(db,payload);
  assert.equal(quote.total,43); assert.equal(quote.items[0].price,20);
  await assert.rejects(()=>quoteStorefrontOrder(db,{...payload,items:[{productId:'p1',quantity:2},{productId:'p1',quantity:2}]}),/disponibilidad/);
  await assert.rejects(()=>quoteStorefrontOrder(db,{...payload,items:[{productId:'p1',quantity:1.5}]}),/Cantidad/);
  const oldFetch=global.fetch; const oldPinned=process.env.STOREFRONT_COMPANY_ID;
  delete process.env.STOREFRONT_COMPANY_ID;
  const emailPath=require.resolve('./emailService');const oldEmail=require.cache[emailPath];
  let notices=0, updates=0, stored, remoteCalls=0;
  require.cache[emailPath]={id:emailPath,filename:emailPath,loaded:true,exports:{sendOrderConfirmation:async()=>{notices++;return {success:true};},sendNewOrderAlert:async()=>({success:true})}};
  try{
    global.fetch=async(url,options)=>{remoteCalls++;assert.equal(options.headers.Authorization,'Bearer fixture');const params=new URLSearchParams(options.body);assert.equal(params.get('amount'),'43.00');assert.equal(params.get('testMode'),'EXTERNAL');return new Response(JSON.stringify({result:{code:'000.200.100'},id:'checkout-fixture-12345'}),{status:200});};
    db.order={create:async({data})=>{stored={...data,id:'order',orderItems:[{quantity:2,price:20,product:{name:'Audífonos'}}]};return stored;},findUnique:async()=>stored,updateMany:async()=>{updates++;stored.paymentStatus='PAID';return {count:1};}};
    const created=await createDatafastCheckout(db,payload);
    assert.equal(created.orderNumber,stored.orderNumber);assert.equal(stored.total,43);assert.equal(stored.paymentStatus,'PENDING');assert.ok(!JSON.stringify(created).includes('datafastToken'));
    assert.ok(!JSON.stringify(created).includes('Bearer'));
    global.fetch=async()=>{remoteCalls++;return new Response(JSON.stringify({...approved,merchantTransactionId:stored.orderNumber}),{status:200});};
    await assert.rejects(()=>confirmDatafastPayment(db,'https://example.invalid/steal'),/referencia/);
    const confirmed=await confirmDatafastPayment(db,'/v1/checkouts/checkout-fixture-12345/payment');
    assert.equal(confirmed.paymentStatus,'PAID');assert.equal(confirmed.email,payload.senderEmail);
    await confirmDatafastPayment(db,'/v1/checkouts/checkout-fixture-12345/payment');
    assert.equal(updates,1);assert.equal(notices,1);assert.equal(remoteCalls,2);
  }finally{global.fetch=oldFetch;if(oldEmail)require.cache[emailPath]=oldEmail;else delete require.cache[emailPath];if(oldPinned===undefined)delete process.env.STOREFRONT_COMPANY_ID;else process.env.STOREFRONT_COMPANY_ID=oldPinned;}
  console.log('PASS: Datafast configuration gate, production approval, amount/currency/order binding, authoritative prices/stock/shipping, safe resource path, idempotent confirmation and email; no real database, network or SMTP.');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
