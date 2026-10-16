const assert=require('node:assert/strict');
const {getFeaturesForAdmin}=require('./adminFeatures');
const active={isActive:true,role:'ADMIN',company:{id:'own',slug:'zetatech',isActive:true,allowedDomains:[]}};
function fixture(user=active,tenants=[],companies=[{id:'own'}]) {return {users:{findUnique:async()=>user},tenants:{findMany:async()=>tenants},company:{findMany:async()=>companies}};}
(async()=>{
  const expected=[{name:'discounts',display_name:'Descuentos'}];
  assert.deepEqual(await getFeaturesForAdmin(fixture(),'admin',{}),expected);
  assert.deepEqual(await getFeaturesForAdmin(fixture(),'admin',{STOREFRONT_COMPANY_ID:'own'}),expected);
  assert.deepEqual(await getFeaturesForAdmin(fixture({...active,role:'USER'}),'user',{}),[]);
  assert.deepEqual(await getFeaturesForAdmin(fixture(active,[],[{id:'own'},{id:'other'}]),'admin',{}),[]);
  const other={domain:'other-company',plan:{plan_features:[{features:{name:'premium',display_name:'Private'}}]}};
  assert.deepEqual(await getFeaturesForAdmin(fixture(active,[other]),'admin',{}),[],'never use the first unrelated tenant');
  const own={...other,domain:'zetatech'};
  assert.deepEqual(await getFeaturesForAdmin(fixture(active,[own]),'admin',{}),[{name:'premium',display_name:'Private'}]);
  await assert.rejects(getFeaturesForAdmin(fixture(),null,{}),e=>e.status===401);
  await assert.rejects(getFeaturesForAdmin(fixture({...active,isActive:false}),'admin',{}),e=>e.status===403);
  console.log('PASS: standalone features, role checks, tenant isolation');
})().catch(e=>{console.error(e);process.exitCode=1});
