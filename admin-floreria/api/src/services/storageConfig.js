const STORAGE_KEYS = /^(STORAGE_TYPE|FTP_.+|SFTP_.+|MINIO_.+|CLOUDINARY_.+)$/;

// Runtime variables (Cloud Run/Docker) win. For local development, storage
// settings in the repository .env win over the old API .env defaults.
function loadSharedStorageEnv(shared, env, inheritedKeys) {
  for (const [key,value] of Object.entries(shared)) {
    if (STORAGE_KEYS.test(key) && !inheritedKeys.has(key)) env[key] = value;
  }
}

function storageConfiguration(env = process.env) {
  const read = key => String(env[key] || '').trim();
  const provider = (read('STORAGE_TYPE') || 'minio').toLowerCase();
  const missing = [], invalid = [];
  const requireValue = (key,value=read(key)) => { if (!value) missing.push(key); return value; };
  let config;
  if (provider === 'sftp') {
    config = {host:requireValue('FTP_HOST',read('SFTP_HOST')||read('FTP_HOST')),username:requireValue('FTP_USER',read('SFTP_USER')||read('SFTP_USERNAME')||read('FTP_USER')),
      password:requireValue('FTP_PASSWORD',env.SFTP_PASSWORD||env.FTP_PASSWORD),port:Number(read('SFTP_PORT')||read('FTP_PORT')||22),
      remotePath:requireValue('FTP_REMOTE_PATH',read('SFTP_REMOTE_PATH')||read('FTP_REMOTE_PATH')).replace(/\/+$/,''),
      publicBaseUrl:requireValue('FTP_PUBLIC_URL',read('SFTP_PUBLIC_URL')||read('FTP_PUBLIC_URL')).replace(/\/+$/,'')};
    if (!Number.isInteger(config.port) || config.port<1 || config.port>65535) invalid.push('FTP_PORT');
    if (config.host.includes('://') || config.host.includes('/')) invalid.push('FTP_HOST (solo el nombre del servidor)');
  } else if (provider === 'minio') {
    let endpoint=requireValue('MINIO_ENDPOINT'), useSSL=read('MINIO_USE_SSL')==='true', port=read('MINIO_PORT');
    if (endpoint.includes('://')) {
      try {const url=new URL(endpoint);if(!['http:','https:'].includes(url.protocol)||url.pathname!=='/'||url.username||url.password)throw new Error(); endpoint=url.hostname; useSSL=read('MINIO_USE_SSL')?useSSL:url.protocol==='https:';port=port||url.port||String(useSSL?443:80);} catch {invalid.push('MINIO_ENDPOINT');}
    }
    config={endpoint,useSSL,port:Number(port||(useSSL?443:9000)),accessKey:requireValue('MINIO_ACCESS_KEY'),secretKey:requireValue('MINIO_SECRET_KEY'),bucket:read('MINIO_BUCKET')||'zetatech',publicBaseUrl:requireValue('MINIO_PUBLIC_URL').replace(/\/+$/,'')};
    if(!Number.isInteger(config.port)||config.port<1||config.port>65535)invalid.push('MINIO_PORT');
  } else if (provider==='cloudinary') {
    config={cloudName:requireValue('CLOUDINARY_CLOUD_NAME'),apiKey:requireValue('CLOUDINARY_API_KEY'),apiSecret:requireValue('CLOUDINARY_API_SECRET')};
  } else {invalid.push('STORAGE_TYPE (minio, sftp o cloudinary)');config={};}
  if(config.publicBaseUrl) {try {const url=new URL(config.publicBaseUrl);if(!['http:','https:'].includes(url.protocol)||url.username||url.password||url.search||url.hash)throw new Error();}catch{invalid.push(provider==='minio'?'MINIO_PUBLIC_URL':'FTP_PUBLIC_URL');}}
  return {provider,config,missing,invalid,configured:missing.length===0&&invalid.length===0};
}

function requireStorageConfiguration(env) {
  const state=storageConfiguration(env);
  if(!state.configured){const error=new Error(`Almacenamiento ${state.provider} incompleto. ${state.missing.length?'Faltan: '+state.missing.join(', ')+'. ':''}${state.invalid.length?'Revisa: '+state.invalid.join(', ')+'.':''}`);error.status=503;error.code='STORAGE_NOT_CONFIGURED';throw error;}
  return state;
}
module.exports={storageConfiguration,requireStorageConfiguration,loadSharedStorageEnv};
