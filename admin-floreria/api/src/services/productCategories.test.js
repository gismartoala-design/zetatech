const assert=require('node:assert/strict');
const {categoryKey,categoryName,mergeCategories}=require('./productCategories');
assert.equal(categoryName('  Audio   profesional  '),'Audio profesional');
assert.equal(categoryKey('  AUDÍFONOS '),'audifonos');
assert.deepEqual(mergeCategories(['Audio','Gaming'],['audio',' Cámaras ','CÁMARAS']),['Audio','Cámaras','Gaming']);

const companies={a:{id:'a',updatedAt:1,settings:{productCategories:[],paymentSettings:{enabledMethods:['Banco']},websiteEditor:{revision:4}}},b:{id:'b',updatedAt:1,settings:{productCategories:['Privada']}}};
let conflict=false;
const db={users:{findUnique:async({where})=>({companyId:where.id,role:'ADMIN',isActive:true,company:{isActive:true}})},company:{findUnique:async({where})=>structuredClone(companies[where.id]),updateMany:async({where,data})=>{if(conflict)return {count:0};assert.equal(where.updatedAt,companies[where.id].updatedAt);companies[where.id]={...companies[where.id],...data,updatedAt:where.updatedAt+1};return {count:1};}},product:{findMany:async({where})=>{assert.equal(where.isDeleted,false);return where.companyId==='a'?[{category:'Audio'}]:[];}}};
db.$transaction=async fn=>fn(db);global.prisma=db;
const router=require('../routes/products/categories');
const authorize=router.stack[0].handle;
const route=method=>router.stack.find(layer=>layer.route?.methods[method]).route.stack[0].handle;
async function request(method,body={}){
  const req={user:{adminId:'a'},body};let result,status=200;
  const res={set(){return this;},status(s){status=s;return this;},json(value){result=value;return this;}};
  const next=error=>{if(error){status=error.status||500;result={message:error.message};}};
  await authorize(req,res,next);if(!result)await route(method)(req,res,next);return {status,result};
}
(async()=>{
  const created=await request('post',{name:'  Gaming  '});assert.equal(created.status,201);assert.equal(created.result.data.name,'Gaming');
  assert.deepEqual(companies.a.settings.paymentSettings,{enabledMethods:['Banco']});assert.equal(companies.a.settings.websiteEditor.revision,4,'category writes preserve other admin settings');
  const list=await request('get');assert.deepEqual(list.result.data,['Audio','Gaming']);assert.ok(!list.result.data.includes('Privada'));
  const duplicate=await request('post',{name:'gAmInG'});assert.equal(duplicate.status,200);assert.equal(duplicate.result.data.created,false);
  assert.equal((await request('post',{name:'   '})).status,400);
  conflict=true;assert.equal((await request('post',{name:'Cámaras'})).status,409);assert.ok(!companies.a.settings.productCategories.includes('Cámaras'));
  console.log('PASS: persistent categories, existing products, deduplication, company isolation and concurrent settings protection');
})().catch(e=>{console.error(e);process.exitCode=1});
