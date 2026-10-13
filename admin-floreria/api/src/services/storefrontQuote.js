const fail = (message, statusCode = 400) => { const error = new Error(message); error.statusCode = statusCode; throw error; };
const money = value => Math.round(Number(value) * 100) / 100;
const normalize = value => String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
const { getProductOffer } = require('../utils/productPricing');

async function quoteStorefrontOrder(db, payload) {
  const companies = await db.company.findMany({ where: { isActive: true, ...(process.env.STOREFRONT_COMPANY_ID ? { id: process.env.STOREFRONT_COMPANY_ID } : {}) }, take: 2 });
  if (companies.length !== 1) fail('Configura la empresa de la tienda.', 503);
  const company = companies[0];
  if (company.settings?.acceptOrders === false) fail('Tienda cerrada temporalmente.', 503);
  const incoming = Array.isArray(payload.items) && payload.items.length ? payload.items : payload.productId ? [{ productId: payload.productId, quantity: payload.quantity || 1 }] : [];
  if (!Array.isArray(incoming) || !incoming.length || incoming.length > 60) fail('El carrito no es válido.');
  const quantities = new Map();
  for (const item of incoming) {
    const quantity = Number(item.quantity);
    if (!item.productId || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 999) fail('Cantidad o producto no válido.');
    quantities.set(String(item.productId), (quantities.get(String(item.productId)) || 0) + quantity);
  }
  const products = await db.product.findMany({ where: { id: { in: [...quantities.keys()] }, companyId: company.id, isActive: true, isDeleted: false }, include: { variants: { where: { isActive: true, isDeleted: false } }, discounts_products: { include: { discounts: true } } } });
  if (products.length !== quantities.size) fail('Uno de los productos ya no está disponible.');
  const items = products.map(product => {
    const quantity = quantities.get(product.id);
    const variant = product.hasVariants ? product.variants.find(v => v.isDefault) || product.variants[0] : null;
    const price = getProductOffer(product).currentPrice;
    if (!Number.isFinite(price) || price <= 0 || !Number.isFinite(Number(product.stock)) || Number(product.stock) < quantity) fail(`Revisa la disponibilidad de ${product.name}.`);
    return { productId: product.id, productName: product.name, quantity, price, variantName: variant?.name || null };
  });
  const subtotal = money(items.reduce((sum, item) => sum + item.price * item.quantity, 0));
  const rates = company.settings?.paymentSettings?.shippingSectorRates || [];
  const rate = rates.find(item => normalize(item.sector) === normalize(payload.sector));
  if (rates.length && !rate) fail('Selecciona un sector de entrega válido.');
  const shipping = money(rate?.cost || 0);
  if (!Number.isFinite(shipping) || shipping < 0) fail('El costo de envío no está configurado correctamente.', 503);
  return { company, items, subtotal, shipping, total: money(subtotal + shipping) };
}
module.exports = { quoteStorefrontOrder, fail, money };
