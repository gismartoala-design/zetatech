const crypto = require('node:crypto');
const { quoteStorefrontOrder, fail, money } = require('./storefrontQuote');
const { buildStorefrontOrderDetails } = require('../utils/storefrontOrderDetails');

function datafastConfig(settings = {}, env = process.env) {
  const read = (name, key) => String(settings[name] || env[key] || '').trim();
  const environment = read('datafastEnvironment', 'DATAFAST_ENVIRONMENT') || 'sandbox';
  const config = {
    environment,
    origin: environment === 'live' ? 'https://eu-prod.oppwa.com' : 'https://eu-test.oppwa.com',
    token: read('datafastToken', 'DATAFAST_ACCESS_TOKEN'), entityId: read('datafastEntityId', 'DATAFAST_ENTITY_ID'),
    mid: read('datafastMid', 'DATAFAST_MID'), tid: read('datafastTid', 'DATAFAST_TID'),
    pserv: read('datafastPserv', 'DATAFAST_PSERV'), risk: read('datafastRisk', 'DATAFAST_RISK_NAME'),
    vatRate: read('datafastVatRate', 'DATAFAST_VAT_RATE'),
    certified: read('datafastCertified', 'DATAFAST_CERTIFIED') === 'true',
  };
  config.ready = ['sandbox', 'live'].includes(environment) && ['token','entityId','mid','tid','pserv','risk','vatRate'].every(k => config[k] !== '') && Number(config.vatRate) >= 0 && Number(config.vatRate) <= 1 && (environment !== 'live' || config.certified);
  return config;
}

function approvedDatafastPayment(data, order, environment) {
  const approved = data.result?.code === '000.000.000' || (environment === 'sandbox' && ['000.100.110','000.100.112'].includes(data.result?.code));
  return approved && (!data.resultDetails?.Response || data.resultDetails.Response === '00') && data.paymentType === 'DB' && data.currency === 'USD' && data.merchantTransactionId === order.orderNumber && money(data.amount) === money(order.total);
}

async function gateway(config, path, body) {
  const response = await fetch(`${config.origin}${path}`, { method: body ? 'POST' : 'GET', headers: { Authorization: `Bearer ${config.token}`, ...(body ? { 'Content-Type': 'application/x-www-form-urlencoded' } : {}) }, body: body?.toString(), signal: AbortSignal.timeout(20000) });
  const data = await response.json();
  if (!response.ok) fail('Datafast no pudo procesar la solicitud. Intenta nuevamente o elige contra entrega.', 502);
  return data;
}

async function createDatafastCheckout(db, payload) {
  const quote = await quoteStorefrontOrder(db, payload);
  const config = datafastConfig(quote.company.settings?.paymentSettings);
  if (!config.ready) fail('Datafast aún no está configurado. Puedes elegir contra entrega o transferencia.', 503);
  if (payload.couponCode) fail('Los cupones con Datafast aún no están habilitados. Retira el cupón o elige otro método.');
  const details = buildStorefrontOrderDetails({ ...payload, paymentMethod: 'Datafast' });
  const names = String(details.senderName || '').split(/\s+/);
  if (names.length < 2 || !details.senderDocument || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(details.senderEmail || '') || !details.senderPhone || !details.exactAddress) fail('Datafast requiere nombre y apellido, documento, correo, celular y dirección.');
  if (details.senderDocumentType === 'RUC') fail('Para pagar con Datafast utiliza la cédula o pasaporte del titular de la tarjeta.');
  if (!String(payload.billingAddress || '').trim() || !/^[A-Z]{2}$/.test(String(payload.billingCountry || ''))) fail('Completa la dirección y el país de facturación para Datafast.');
  const orderNumber = `ZETATECH-${crypto.randomBytes(12).toString('hex')}`;
  const taxableBase = Number(config.vatRate) === 0 ? 0 : money(quote.total / (1 + Number(config.vatRate)));
  const tax = taxableBase ? money(quote.total - taxableBase) : 0;
  const netSubtotal = taxableBase ? money(quote.subtotal / (1 + Number(config.vatRate))) : quote.subtotal;
  const netShipping = money(quote.total - tax - netSubtotal);
  const parameters = new URLSearchParams({ entityId: config.entityId, amount: quote.total.toFixed(2), currency: 'USD', paymentType: 'DB', merchantTransactionId: orderNumber,
    'customer.givenName': names[0], 'customer.surname': names.slice(1).join(' '), 'customer.email': details.senderEmail,
    'customer.identificationDocType': details.senderDocumentType === 'PASAPORTE' ? 'PASSPORT' : 'IDCARD', 'customer.identificationDocId': details.senderDocument,
    'customer.phone': details.senderPhone, 'customer.ip': payload.customerIp || '', 'customer.merchantCustomerId': crypto.createHash('sha256').update(details.senderEmail).digest('hex').slice(0,32),
    'billing.street1': payload.billingAddress.trim().slice(0,100), 'billing.country': payload.billingCountry,
    'shipping.street1': details.exactAddress.slice(0,100), 'shipping.country': 'EC',
    'customParameters[SHOPPER_MID]': config.mid, 'customParameters[SHOPPER_TID]': config.tid, 'customParameters[SHOPPER_PSERV]': config.pserv,
    'customParameters[SHOPPER_ECI]': '0103910', 'customParameters[SHOPPER_VERSIONDF]': '2', 'risk.parameters[USER_DATA2]': config.risk,
    'customParameters[SHOPPER_VAL_BASE0]': taxableBase ? '0.00' : quote.total.toFixed(2), 'customParameters[SHOPPER_VAL_BASEIMP]': taxableBase.toFixed(2), 'customParameters[SHOPPER_VAL_IVA]': tax.toFixed(2),
  });
  if (config.environment !== 'live') parameters.set('testMode', 'EXTERNAL');
  quote.items.forEach((item,i) => { for (const [key,value] of Object.entries({ name: item.productName, description: item.productName, price: item.price.toFixed(2), quantity: item.quantity })) parameters.set(`cart.items[${i}].${key}`, String(value)); });
  const checkout = await gateway(config, '/v1/checkouts', parameters);
  if (checkout.result?.code !== '000.200.100' || !/^[A-Za-z0-9.-]{10,150}$/.test(checkout.id || '')) fail('Datafast no devolvió una sesión válida.', 502);
  const order = await db.order.create({ data: { orderNumber, clientTransactionId: `DF:${checkout.id}`, customerName: names[0], customerLastName: names.slice(1).join(' '), customerEmail: details.senderEmail, customerPhone: details.senderPhone,
    billingContactName: details.receiverName, billingPrincipalAddress: details.exactAddress, customerReference: details.observations,
    subtotal: netSubtotal, tax, shipping: netShipping, total: quote.total, paymentStatus: 'PENDING', source: 'TIENDA_WEB',
    orderNotes: `${details.orderNotes} | Datafast environment: ${config.environment}`,
    orderItems: { create: quote.items.map(item => ({ productId: item.productId, quantity: item.quantity, price: item.price, variantName: item.variantName })) },
  } });
  return { checkoutId: checkout.id, widgetUrl: `${config.origin}/v1/paymentWidgets.js?checkoutId=${encodeURIComponent(checkout.id)}`, orderNumber: order.orderNumber, environment: config.environment };
}

async function confirmDatafastPayment(db, resourcePath) {
  const match = /^\/v1\/checkouts\/([A-Za-z0-9.-]{10,150})\/payment$/.exec(String(resourcePath || ''));
  if (!match) fail('La referencia de Datafast no es válida.');
  const order = await db.order.findUnique({ where: { clientTransactionId: `DF:${match[1]}` }, include: { orderItems: { include: { product: true } } } });
  if (!order) fail('Pedido no encontrado.', 404);
  const company = await db.company.findFirst({ where: { isActive: true, ...(process.env.STOREFRONT_COMPANY_ID ? { id: process.env.STOREFRONT_COMPANY_ID } : {}) } });
  const config = datafastConfig(company?.settings?.paymentSettings);
  if (!config.ready) fail('La verificación de Datafast no está disponible.', 503);
  if (!order.orderNotes?.includes(`Datafast environment: ${config.environment}`)) fail('El ambiente de Datafast cambió. Contacta al comercio para verificar el pago.', 409);
  let newlyPaid = false;
  if (order.paymentStatus !== 'PAID') {
    const payment = await gateway(config, `${resourcePath}?entityId=${encodeURIComponent(config.entityId)}`);
    if (!approvedDatafastPayment(payment, order, config.environment)) return { orderNumber: order.orderNumber, paymentStatus: 'PENDING', message: 'Datafast todavía no ha confirmado un pago aprobado. No vuelvas a pagar si ya ves el consumo: contacta al comercio.' };
    const updated = await db.order.updateMany({ where: { id: order.id, paymentStatus: 'PENDING' }, data: { paymentStatus: 'PAID', paidAt: new Date() } });
    newlyPaid = updated.count === 1;
    if (!newlyPaid) {
      const latest = await db.order.findUnique({ where: { id: order.id } });
      if (latest?.paymentStatus !== 'PAID') fail('El pedido requiere revisión del comercio.', 409);
    }
  }
  if (newlyPaid) {
    const emailService = require('./emailService');
    try { await emailService.sendOrderConfirmation({ ...order, paymentStatus: 'PAID', companyName: company?.name || 'Zetatech' }); } catch (error) { console.error('Datafast: no se pudo enviar el correo de confirmación.'); }
    try { await emailService.sendNewOrderAlert({ ...order, paymentStatus: 'PAID', paymentMethod: 'Datafast', items: order.orderItems.map(i => ({ productName: i.product?.name, quantity: i.quantity, price: i.price })) }); } catch { console.error('Datafast: no se pudo notificar el pedido al administrador.'); }
  }
  return { orderNumber: order.orderNumber, paymentStatus: 'PAID', total: order.total, email: order.customerEmail, customerName: `${order.customerName} ${order.customerLastName}`, receiverName: order.billingContactName, address: order.billingPrincipalAddress, items: order.orderItems.map(i => ({ productName: i.product?.name || 'Producto', quantity: i.quantity })) };
}
module.exports = { datafastConfig, approvedDatafastPayment, createDatafastCheckout, confirmDatafastPayment };
