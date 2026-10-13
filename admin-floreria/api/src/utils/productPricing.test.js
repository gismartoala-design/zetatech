const assert = require('node:assert/strict');
const { getProductOffer } = require('./productPricing');
const { quoteStorefrontOrder } = require('../services/storefrontQuote');
const now = new Date('2026-10-12T12:00:00Z');
const offer = (percent, overrides={}) => ({ discounts: { id:1, percent, percent_value:percent/100, is_active:true, ...overrides } });
const product = { id:'fixture', name:'Audífonos de prueba', price:100, stock:10, discounts_products:[offer(20)] };
assert.deepEqual(getProductOffer(product,now), { originalPrice:100, currentPrice:80, discountPercent:20, offerActive:true });
assert.equal(getProductOffer({...product,discounts_products:[offer(20,{is_active:false})]},now).offerActive,false);
assert.equal(getProductOffer({...product,discounts_products:[offer(20,{ends_at:'2026-10-11'})]},now).offerActive,false);
assert.equal(getProductOffer({...product,discounts_products:[offer(20,{starts_at:'2026-10-13'})]},now).offerActive,false);
assert.equal(getProductOffer({...product,discounts_products:[offer(20,{code:'CUPON'})]},now).offerActive,false);
assert.equal(getProductOffer({...product,discounts_products:[offer(20,{uses:2,max_uses:2})]},now).offerActive,false);
assert.equal(getProductOffer({...product,discounts_products:[offer(20,{stackable:true}),offer(10,{id:2,stackable:true})]},now).currentPrice,72);
assert.equal(getProductOffer({...product,discounts_products:[offer(20,{stackable:false}),offer(10,{id:2,priority:2})]},now).currentPrice,90);
assert.equal(getProductOffer({...product,hasVariants:true,variants:[{price:50,isDefault:true}]},now).currentPrice,40);

async function verifyQuote() {
  const db = { company:{findMany:async()=>[{id:'company',settings:{paymentSettings:{shippingSectorRates:[{sector:'Urdesa',cost:3}]}}}]},product:{findMany:async()=>[product]} };
  const quote = await quoteStorefrontOrder(db,{items:[{productId:'fixture',quantity:2,price:1}],sector:'Urdesa'});
  assert.equal(quote.items[0].price,80);
  assert.equal(quote.total,163);
  console.log('PASS: current/previous prices, expired/inactive/future/code-only offers, usage limits, priority, stackable offers, variants, server-calculated sale price in checkout. No real database writes.');
}
verifyQuote().catch(error=>{console.error(error);process.exitCode=1;});
