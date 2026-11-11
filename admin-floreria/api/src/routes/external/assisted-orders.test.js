const assert=require('node:assert/strict');
const fs=require('node:fs');
const nodemailer=require('nodemailer');
const sent=[];let failCustomer=false,created=0;
nodemailer.createTransport=()=>({verify:async()=>true,sendMail:async mail=>{if(failCustomer&&mail.to==='buyer@example.invalid')throw new Error('Fixture SMTP failure');sent.push(mail);return {messageId:'fixture-message'};}});
const company={id:'fixture-company',name:'ZettaTech',email:'shop@example.invalid',phone:'0990000000',settings:{acceptOrders:true,paymentSettings:{enabledMethods:['Banco'],ownerNotificationEmail:'sales@example.invalid'}}};
const product={id:'fixture-product',name:'Laptop de prueba',price:80,stock:10,hasVariants:false,variants:[],discounts_products:[],image:''};
global.prisma={company:{findMany:async()=>[company]},product:{findMany:async()=>[product],findFirst:async()=>product},$transaction:async work=>work({$queryRaw:async sql=>{assert.ok(sql.values.includes('PENDING'));assert.ok(!sql.values.includes('PAID'));created++;return [{id:'fixture-order',orderNumber:'ZETATECH-FIXTURE-'+created,createdAt:new Date('2026-01-01T12:00:00Z')}];},orderItem:{createMany:async({data})=>{assert.equal(data[0].quantity,2);assert.equal(data[0].price,80);}}})};
const loggerPath=require.resolve('../../utils/logger');require.cache[loggerPath]={id:loggerPath,filename:loggerPath,loaded:true,exports:{businessLog:()=>{},businessError:()=>{}}};
const router=require('./store-orders');
const create=router.stack.find(layer=>layer.route?.path==='/'&&layer.route.methods.post).route.stack[0].handle;
const payload={paymentMethod:'Coordinar con ventas',items:[{productId:product.id,quantity:2,price:999}],total:1,senderName:'Comprador de prueba',senderEmail:'buyer@example.invalid',senderPhone:'0990000000',receiverName:'Receptor de prueba',receiverPhone:'0990000000',phone:'0990000000',deliveryCity:'Guayaquil',sector:'Centro',exactAddress:'Dirección de prueba 123'};
async function submit(body=payload){let status=200,result;await create({body:structuredClone(body)},{status(value){status=value;return this;},json(value){result=value;return this;}});return {status,result};}
(async()=>{
  const first=await submit();assert.equal(first.status,201);assert.equal(first.result.data.total,160);assert.equal(first.result.data.paymentStatus,'PENDING');assert.equal(first.result.data.ownerNotificationSent,true);assert.equal(first.result.data.customerNotificationSent,true);
  assert.equal(sent.length,2);assert.equal(sent[0].to,'sales@example.invalid');assert.equal(sent[1].to,'buyer@example.invalid');
  const receipt=Buffer.from(first.result.data.receipt.base64,'base64');assert.equal(receipt.subarray(0,5).toString(),'%PDF-');
  for(const mail of sent){const attachment=mail.attachments.find(file=>file.contentType==='application/pdf');assert.ok(attachment);assert.deepEqual(attachment.content,receipt);}
  fs.writeFileSync('/tmp/zettatech-receipt-fixture.pdf',receipt);
  failCustomer=true;const second=await submit();assert.equal(second.status,201);assert.equal(second.result.data.customerNotificationSent,false);assert.equal(second.result.data.ownerNotificationSent,true);assert.ok(second.result.data.receipt.base64,'An email failure keeps the private PDF download available');
  const before=created;assert.equal((await submit({...payload,senderEmail:''})).status,400);assert.equal(created,before);
  company.settings.paymentSettings.assistedCheckoutEnabled=false;assert.equal((await submit()).status,409);assert.equal(created,before);
  const {buildOrderReceipt}=require('../../services/orderReceipt');
  const many=await buildOrderReceipt({orderNumber:'ZETATECH-MANY',customerName:'Comprador',total:4800,subtotal:4800,paymentStatus:'PENDING',items:Array.from({length:60},(_,i)=>({productName:`Artículo ${i+1}: características de tecnología y accesorios`.repeat(3),quantity:1,price:80}))});fs.writeFileSync('/tmp/zettatech-receipt-many-fixture.pdf',many);
  console.log('PASS: assisted order uses authoritative prices, stays unpaid, sends matching private PDFs to customer/configured seller, survives SMTP failure and respects disable switch. Mock database and SMTP only.');
})().catch(error=>{console.error(error);process.exitCode=1;});
