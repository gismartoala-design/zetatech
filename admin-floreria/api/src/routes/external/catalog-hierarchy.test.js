const assert=require('node:assert/strict');
const products=[['p1','Computadoras › Laptops'],['p2','Computadoras › Monitores'],['p3','Audio › Audífonos']].map(([id,category])=>({id,category,name:'Producto de prueba '+id,description:'Características verificables del producto de prueba.',price:100,stock:5,variants:[],discounts_products:[],hasVariants:false}));
global.prisma={product:{findMany:async()=>products}};
const router=require('./products');
const route=path=>router.stack.find(layer=>layer.route?.path===path&&layer.route.methods.get).route.stack[0].handle;
async function read(path,query={}){let body;const res={status(code){assert.equal(code,200);return this;},json(value){body=value;return this;}};await route(path)({query},res);return body.data;}
(async()=>{
  assert.equal((await read('/',{category:'Computadoras'})).length,2);
  assert.equal((await read('/',{category:'Computadoras › Laptops'})).length,1);
  const categories=await read('/categories');assert.ok(categories.includes('Computadoras'));assert.ok(categories.some(item=>item.includes('› Laptops')));
  assert.equal((await read('/'))[0].deliveryTime,'24 horas');
  console.log('PASS: public parent category includes descendants; child category isolates its products; parent links and 24-hour delivery are published. No real database used.');
})().catch(error=>{console.error(error);process.exitCode=1;});
