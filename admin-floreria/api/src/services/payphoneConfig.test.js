const assert=require('node:assert/strict');
const {getActivePayphoneCredentials:get,loadSharedPayphoneEnv:load}=require('./payphoneConfig');
const admin={payphoneEnvironment:'sandbox',payphoneSandboxToken:'fixture-test',payphoneSandboxStoreId:'store-test',payphoneLiveToken:'fixture-admin-live',payphoneLiveStoreId:'store-admin-live'};
assert.equal(get(admin,{}).environment,'sandbox');assert.equal(get(admin,{}).configured,true);
const live=get(admin,{PAYPHONE_ENVIRONMENT:'live',PAYPHONE_LIVE_TOKEN:'fixture-live',PAYPHONE_LIVE_STORE_ID:'fixture-store'});
assert.equal(live.environment,'live');assert.equal(live.source,'environment');assert.equal(live.configured,true);assert.equal(live.token,'fixture-live');
const partial=get(admin,{PAYPHONE_ENVIRONMENT:'live',PAYPHONE_LIVE_TOKEN:'fixture-live'});
assert.equal(partial.storeId,'','Do not mix an env token with another store from the admin');assert.equal(partial.configured,false);
assert.equal(get({}, {PAYPHONE_ENVIRONMENT:'sandbox',PAYPHONE_LIVE_TOKEN:'production-token'}).token,'','Never leak the production token into sandbox');
assert.equal(get({}, {PAYPHONE_ENVIRONMENT:'invalid',PAYPHONE_TOKEN:'fixture',PAYPHONE_STORE_ID:'fixture'}).configured,false);
const env={PAYPHONE_LIVE_TOKEN:'cloud-run',PORT:'4001'};
load({PAYPHONE_LIVE_TOKEN:'local',PAYPHONE_ENVIRONMENT:'live',APP_PUBLIC_SITE_URL:'https://example.test',DATABASE_URL:'must-not-copy',PORT:'3000'},env,new Set(['PAYPHONE_LIVE_TOKEN','PORT']));
assert.equal(env.PAYPHONE_LIVE_TOKEN,'cloud-run');assert.equal(env.PAYPHONE_ENVIRONMENT,'live');assert.equal(env.PORT,'4001');assert.equal(env.DATABASE_URL,undefined);
const old={...process.env};
try{
 process.env.PAYPHONE_ENVIRONMENT='live';process.env.PAYPHONE_ENABLED='true';process.env.PAYPHONE_LIVE_TOKEN='fixture-live';delete process.env.PAYPHONE_LIVE_STORE_ID;
 const {enabledPaymentMethods}=require('../utils/paymentMethods');
 assert.equal(enabledPaymentMethods({enabledMethods:['Banco']}).includes('Payphone'),false);
 process.env.PAYPHONE_LIVE_STORE_ID='fixture-store';assert.equal(enabledPaymentMethods({enabledMethods:['Banco']}).includes('Payphone'),true);
 process.env.PAYPHONE_ENABLED='false';assert.equal(enabledPaymentMethods({enabledMethods:['Payphone']}).includes('Payphone'),false);
}finally{for(const key of Object.keys(process.env))if(!Object.hasOwn(old,key))delete process.env[key];Object.assign(process.env,old);}
console.log('PASS: PayPhone environment/admin precedence, paired credentials, sandbox isolation, runtime env precedence and safe method activation. No provider requests or real database writes.');
