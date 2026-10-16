const assert=require('node:assert/strict');
let company={id:'fixture',name:'Store',updatedAt:1,settings:{websiteEditor:{revision:7},productCategories:['Audio'],paymentSettings:{enabledMethods:['Banco'],datafastToken:'private-fixture',zelleInstructions:'Existing instructions'}}};
let conflict=false,writes=0;
global.prisma={company:{findFirst:async({where})=>where.users.some.id==='admin'?structuredClone(company):null,updateMany:async({where,data})=>{if(conflict)return {count:0};assert.equal(where.updatedAt,company.updatedAt);company={...company,...data,updatedAt:company.updatedAt+1};writes++;return {count:1};},findUnique:async()=>structuredClone(company)}};
const {updatePaymentSettings}=require('./apiConfigController');
async function update(body){let status=200,result;const res={status(s){status=s;return this;},json(data){result=data;return this;}};await updatePaymentSettings({user:{adminId:'admin'},body},res);return {status,result};}
(async()=>{
  const first=await update({enabledMethods:['Contra entrega'],acceptOrders:true});assert.equal(first.status,200);
  assert.deepEqual(company.settings.paymentSettings.enabledMethods,['Contra entrega']);assert.equal(company.settings.paymentSettings.datafastToken,'private-fixture');assert.equal(company.settings.paymentSettings.zelleInstructions,'Existing instructions');
  assert.equal(company.settings.websiteEditor.revision,7);assert.deepEqual(company.settings.productCategories,['Audio']);
  assert.equal((await update({ownerNotificationName:'Sales'})).status,200);assert.deepEqual(company.settings.paymentSettings.enabledMethods,['Contra entrega'],'partial saves preserve selected methods');
  const before=writes;assert.equal((await update({enabledMethods:['invalid']})).status,400);assert.equal(writes,before);
  conflict=true;assert.equal((await update({enabledMethods:[]})).status,409);assert.deepEqual(company.settings.paymentSettings.enabledMethods,['Contra entrega']);
  console.log('PASS: payment selections persist, credentials/categories/editor survive partial saves and concurrent changes are protected');
})().catch(e=>{console.error(e);process.exitCode=1});
