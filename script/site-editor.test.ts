import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { defaultSite } from '../shared/website';
const require=createRequire(import.meta.url);
const {validateDocument,publicSettings}=require('../admin-floreria/api/src/services/siteDocument.js');
const {createSiteAdmin}=require('../admin-floreria/api/src/middlewares/siteAdmin.js');
const clone=<T,>(x:T):T=>JSON.parse(JSON.stringify(x));
function fixture(){
  const companies:any[]=[{id:'a',isActive:true,updatedAt:'0',settings:{acceptOrders:true},allowedDomains:['a.test']},{id:'b',isActive:true,updatedAt:'0',settings:{},allowedDomains:['b.test']}];
  const users:any={admin:{id:'admin',role:'ADMIN',isActive:true,companyId:'a'},other:{id:'other',role:'ADMIN',isActive:true,companyId:'b'},viewer:{role:'VIEWER',isActive:true,companyId:'a'},editor:{role:'EDITOR',isActive:true,companyId:'a'},disabled:{role:'ADMIN',isActive:false,companyId:'a'}};
  let forceConflict=false;
  const db:any={users:{findUnique:async({where}:any)=>users[where.id]?{...users[where.id],company:companies.find(c=>c.id===users[where.id].companyId)}:null},company:{findUnique:async({where}:any)=>clone(companies.find(c=>c.id===where.id)),findFirst:async({where}:any)=>clone(companies.find(c=>c.id===where.id&&c.isActive)||null),findMany:async()=>clone(companies.filter(c=>c.isActive)),updateMany:async({where,data}:any)=>{const c=companies.find(c=>c.id===where.id&&c.updatedAt===where.updatedAt);if(!c||forceConflict)return {count:0};Object.assign(c,data,{updatedAt:String(Number(c.updatedAt)+1)});return {count:1};}},product:{findMany:async({where}:any)=>[{id:where.companyId+'-product',name:'Audio',price:25,featured:true}]}};
  db.$transaction=async(fn:any)=>fn(db);
  const middleware=createSiteAdmin(db);
  function load(relative:string){
    const routes=new Map<string,any>();
    const router:any={use:()=>{},get:(path:string,fn:any)=>routes.set('GET '+path,fn),post:(path:string,fn:any)=>routes.set('POST '+path,fn)};
    const module={exports:{}};
    vm.runInNewContext(readFileSync(new URL(relative,import.meta.url),'utf8'),{module,exports:module.exports,require:(name:string)=>name==='express'?{Router:()=>router}:name==='../../lib/prisma'?{db}:name.includes('siteAdmin')?{createSiteAdmin}:name.includes('siteDocument')?{validateDocument}:name.includes('websiteMedia')?{}:require(name),process:{env:{}},URL,Date,console});
    return routes;
  }
  const routes=load('../admin-floreria/api/src/routes/cms/website.js');
  const publicRoutes=load('../admin-floreria/api/src/routes/external/website.js');
  async function request(method:string,path:string,body:any={},user='admin',extra:any={}){
    const req:any={method,user:user?{adminId:user}:undefined,body,params:{action:path.replace('/','')},hostname:'a.test',get:(name:string)=>({'X-Site-Editor':'1',Origin:'http://localhost:5173',Host:'localhost:4000',...extra}[name])};
    const res:any={code:200,payload:null,set(){return this;},status(code:number){this.code=code;return this;},json(payload:any){this.payload=payload;return this;},sendStatus(code:number){this.code=code;return this;}};
    let allowed=false;await middleware(req,res,(error?:Error)=>{if(error)throw error;allowed=true;});
    if(allowed)await routes.get(method+' '+(method==='POST'? '/:action':path))(req,res,(e:Error)=>{throw e;});
    return res;
  }
  async function published(domain='a.test',path='/'){
    let payload:any;let code=200;
    const res:any={set(){return this;},json(data:any){payload=data;return this;},status(c:number){code=c;return this;}};
    await publicRoutes.get('GET '+path)({hostname:domain,get:()=>undefined},res,(e:Error)=>{throw e;});return {payload,code};
  }
  return {request,published,companies,conflict:()=>{forceConflict=true;}};
}
test('default document is valid; script URLs, malformed items and excessive motion are rejected',()=>{
  assert.equal(validateDocument(clone(defaultSite)).theme.brand,'Zetatech');
  for(const mutate of [(d:any)=>d.blocks[0].href='javascript:alert(1)',(d:any)=>d.blocks[0].image='//evil.test/x',(d:any)=>d.theme.links=[null],(d:any)=>d.blocks[0].duration=999999,(d:any)=>d.blocks.push(d.blocks[0])]){const d=clone(defaultSite);mutate(d);assert.throws(()=>validateDocument(d));}
});
test('anonymous, viewer, editor, deleted and disabled users cannot read or write the editor',async()=>{
  for(const user of ['', 'viewer','editor','disabled','missing'])for(const method of ['GET','POST']){const f=fixture();const r=await f.request(method,method==='GET'?'/':'/publish',{revision:0,document:defaultSite},user);assert.equal(r.code,user?403:401);assert.equal(f.companies[0].settings.websiteEditor,undefined);}
});
test('forged company IDs cannot change the authenticated company; catalog is scoped',async()=>{
  const f=fixture();assert.equal((await f.request('POST','/save',{revision:0,document:defaultSite,companyId:'b'})).code,200);assert.equal(f.companies[1].settings.websiteEditor,undefined);
  assert.equal((await f.request('GET','/products')).payload.data[0].id,'a-product');
  assert.equal((await f.request('GET','/',{},'other')).payload.data.draft,null);
  assert.equal((await f.published('a.test','/products')).payload.data[0].id,'a-product');
  assert.equal((await f.published('b.test','/products')).payload.data[0].id,'b-product');
});
test('writes require the editor header and a trusted origin',async()=>{
  const f=fixture();for(const extra of [{'X-Site-Editor':''},{Origin:'https://attacker.test'},{Origin:''}])assert.equal((await f.request('POST','/publish',{revision:0,document:defaultSite},'admin',extra)).code,403);
});
test('drafts stay private, publication is explicit, restore produces a draft only',async()=>{
  const f=fixture();const a=clone(defaultSite);const b=clone(defaultSite);b.theme.brand='Nueva versión';
  await f.request('POST','/save',{revision:0,document:a});assert.equal((await f.published()).payload.data,null);
  await f.request('POST','/publish',{revision:1,document:a});
  await f.request('POST','/save',{revision:2,document:b});assert.equal((await f.published()).payload.data.theme.brand,'Zetatech');
  await f.request('POST','/publish',{revision:3,document:b});assert.equal((await f.published()).payload.data.theme.brand,'Nueva versión');
  const state=(await f.request('GET','/')).payload.data;
  await f.request('POST','/restore',{revision:4,versionId:state.history[0].id});assert.equal((await f.request('GET','/')).payload.data.draft.theme.brand,'Zetatech');assert.equal((await f.published()).payload.data.theme.brand,'Nueva versión');
  assert.equal((await f.published('b.test')).payload.data,null);assert.equal((await f.published('unknown.test')).code,404);
  assert.equal(publicSettings(f.companies[0].settings).websiteEditor,undefined);assert.equal(f.companies[0].settings.acceptOrders,true);
});
test('stale revisions and concurrent company edits return 409 without overwrite',async()=>{
  const f=fixture();await f.request('POST','/save',{revision:0,document:defaultSite});assert.equal((await f.request('POST','/publish',{revision:0,document:defaultSite})).code,409);
  f.conflict();assert.equal((await f.request('POST','/publish',{revision:1,document:defaultSite})).code,409);assert.equal((await f.published()).payload.data,null);
});
