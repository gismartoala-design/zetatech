const read=(object,key)=>String(object?.[key]||'').trim();
function getActivePayphoneCredentials(settings={},env=process.env) {
  const override=read(env,'PAYPHONE_ENVIRONMENT').toLowerCase();
  const environment=override|| (settings.payphoneEnvironment==='live'?'live':'sandbox');
  const prefix=environment==='live'?'PAYPHONE_LIVE':'PAYPHONE_SANDBOX';
  const adminPrefix=environment==='live'?'payphoneLive':'payphoneSandbox';
  let token,storeId,source;
  if(read(env,prefix+'_TOKEN')||read(env,prefix+'_STORE_ID')) {
    token=read(env,prefix+'_TOKEN');storeId=read(env,prefix+'_STORE_ID');source='environment';
  }else if(read(env,'PAYPHONE_WEB_TOKEN')||read(env,'PAYPHONE_TOKEN')||read(env,'PAYPHONE_WEB_STORE_ID')||read(env,'PAYPHONE_STORE_ID')) {
    token=read(env,'PAYPHONE_WEB_TOKEN')||read(env,'PAYPHONE_TOKEN');storeId=read(env,'PAYPHONE_WEB_STORE_ID')||read(env,'PAYPHONE_STORE_ID');source='environment';
  }else{token=read(settings,adminPrefix+'Token');storeId=read(settings,adminPrefix+'StoreId');source='administrator';}
  const configurationError=!['sandbox','live'].includes(environment)?'PAYPHONE_ENVIRONMENT debe ser sandbox o live.':'';
  return {environment,token,storeId,source,configurationError,configured:Boolean(!configurationError&&token&&storeId)};
}
function loadSharedPayphoneEnv(shared,env,inheritedKeys) {
  for(const [key,value]of Object.entries(shared))if((/^PAYPHONE_/.test(key)||key==='APP_PUBLIC_SITE_URL')&&!inheritedKeys.has(key))env[key]=value;
}
module.exports={getActivePayphoneCredentials,loadSharedPayphoneEnv};
