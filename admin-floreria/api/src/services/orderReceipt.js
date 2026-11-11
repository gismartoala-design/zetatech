const PDFDocument = require('pdfkit');
const path = require('node:path');
const {existsSync} = require('node:fs');
const {parseStorefrontMoney} = require('../utils/storefrontCartItems');

const money = value => `$${parseStorefrontMoney(value).toFixed(2)}`;
const clean = value => String(value ?? '').replace(/[\x00-\x08\x0B\x0C\x0E-\x1F]/g,'').slice(0,4000);

/** Private receipt buffer: never upload customer details to public storage. */
function buildOrderReceipt(order) {
  return new Promise((resolve,reject)=>{
    const doc=new PDFDocument({size:'A4',margin:44,info:{Title:`Pedido ${clean(order.orderNumber)}`,Author:clean(order.companyName || 'ZettaTech')}});
    const chunks=[];
    doc.on('data',chunk=>chunks.push(chunk));doc.on('end',()=>resolve(Buffer.concat(chunks)));doc.on('error',reject);
    try {
      const width=doc.page.width-88;
      const room=height=>{if(doc.y+height>doc.page.height-60)doc.addPage();};
      const line=(label,value)=>{if(!value)return;room(48);doc.font('Helvetica-Bold').fontSize(10).fillColor('#193c29').text(label);doc.font('Helvetica').fillColor('#263c30').text(clean(value),{width,lineGap:2});doc.moveDown(.5);};
      const logo=path.join(__dirname,'../assets/zettatech-logo.png');
      if(existsSync(logo))doc.image(logo,44,36,{fit:[170,65]});
      doc.y=116;doc.font('Helvetica-Bold').fontSize(21).fillColor('#176333').text('Muchas gracias por tu compra');
      doc.moveDown(.4).fontSize(13).text(`Comprobante de pedido ${clean(order.orderNumber)}`);
      doc.moveDown(.6).font('Helvetica').fontSize(10).fillColor('#263c30');
      const paid=order.paymentStatus==='PAID';
      doc.text(paid?'Pago aprobado. Coordinaremos contigo la entrega.':'Pedido registrado, pendiente de pago. Nuestro equipo de ventas te contactará por teléfono o WhatsApp para coordinar la entrega y el pago.',{width,lineGap:3});
      doc.moveDown();
      line('Fecha',order.createdAt);line('Comprador',order.customerName);line('Correo',order.customerEmail);line('Celular',order.customerPhone);
      line('Recibe',order.billingContactName || order.receiverName);line('Dirección de entrega',order.billingPrincipalAddress || order.exactAddress);
      line('Forma de pago',order.paymentMethod || order.paymentLabel || (paid?'Pago aprobado':'A coordinar'));
      room(50);doc.moveDown(.3).font('Helvetica-Bold').fontSize(12).text('Detalle de tu pedido');doc.moveDown(.5);
      for(const item of order.items || []){
        const name=clean(item.productName || item.name || 'Producto');
        const quantity=Number(item.quantity)||1;
        const price=parseStorefrontMoney(item.price ?? item.unitPrice);
        const title=`${quantity} x ${name}${item.variantName?` (${clean(item.variantName)})`:''}`;
        doc.font('Helvetica').fontSize(10);
        room(Math.min(200,doc.heightOfString(title,{width:width-100}))+45);
        const y=doc.y;doc.text(title,44,y,{width:width-100,lineGap:2});
        const bottom=doc.y;doc.font('Helvetica-Bold').text(money(price*quantity),44+width-100,y,{width:100,align:'right'});
        doc.y=Math.max(bottom,doc.y)+4;doc.font('Helvetica').fontSize(9).fillColor('#526557').text(`Precio unitario: ${money(price)}`,44,doc.y,{width});
        doc.moveDown(.8).fillColor('#263c30');
      }
      room(160);doc.moveDown(.5);
      line(parseStorefrontMoney(order.couponDiscountAmount)>0?'Subtotal con descuento aplicado':'Subtotal',money(order.subtotal));line('Envío',money(order.shipping));
      if(parseStorefrontMoney(order.tax)>0)line('Impuestos',money(order.tax));
      doc.font('Helvetica-Bold').fontSize(15).fillColor('#176333').text(`Total del pedido: ${money(order.total)}`);
      doc.moveDown(.4).fontSize(11).text(paid?'Saldo pendiente: $0.00':`Pendiente de pago: ${money(order.total)}`);
      doc.moveDown().font('Helvetica').fontSize(9).fillColor('#526557').text('Este documento acredita el registro del pedido. No es una factura fiscal ni una guía de transporte. La entrega y el pago se coordinan con ventas.',{width,lineGap:3});
      doc.moveDown();line('Contacto de la tienda',[order.companyName || 'ZettaTech',order.companyEmail,order.companyPhone].filter(Boolean).join(' · '));
      doc.end();
    }catch(error){doc.destroy();reject(error);}
  });
}
async function orderReceiptAttachment(order) {
  return {filename:`pedido-${String(order.orderNumber || 'zettatech').replace(/[^a-zA-Z0-9_-]/g,'-')}.pdf`,content:order.receiptBuffer || await buildOrderReceipt(order),contentType:'application/pdf'};
}
module.exports={buildOrderReceipt,orderReceiptAttachment};
