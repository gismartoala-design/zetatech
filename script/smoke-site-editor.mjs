// Isolated browser smoke: no .env, Prisma, production servers or remote writes.
import {build} from 'esbuild';
import {createServer} from 'node:http';
import {mkdtemp,readFile,writeFile} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {resolve,extname} from 'node:path';
import {spawn} from 'node:child_process';
import WebSocket from 'ws';
import assert from 'node:assert/strict';
const root=resolve(import.meta.dirname,'..');
const temp=await mkdtemp(resolve(tmpdir(),'zetatech-editor-'));
await build({stdin:{contents:`
import React from 'react';
import {createRoot} from 'react-dom/client';
import axios from '${root}/admin-floreria/client/node_modules/axios/index.js';
import {defaultSite} from '${root}/shared/website';
import {SiteRenderer} from '${root}/shared/SiteRenderer';
import {useUserStore} from '${root}/admin-floreria/client/src/store/use-user-store';
let state={revision:0,draft:null,published:null,history:[]};
window.__editorMock={state};
axios.defaults.adapter=async config=>{
 let data;
 if(config.url==='/cms/website/products') data=[];
 else if(config.method==='get') data=state;
 else {const body=JSON.parse(config.data); state={...state,revision:state.revision+1,draft:body.document,...(config.url.endsWith('/publish')?{published:body.document,publishedAt:new Date().toISOString()}:{} )}; window.__editorMock.state=state;data=state;}
 return {data:{data},status:200,statusText:'OK',headers:{},config};
};
const role=new URLSearchParams(location.search).get('role')||'ADMIN';
useUserStore.setState({user:{id:'local-test',name:'Prueba local',email:'test@example.invalid',role},isHydrated:true});
const {default:Editor}=await import('${root}/admin-floreria/client/src/features/modules/cms/pages/CmsHomeDashboard');
createRoot(document.getElementById('root')).render(location.search.includes('storefront')?<SiteRenderer document={defaultSite}/>:<Editor/>);
`,resolveDir:root,loader:'tsx'},outfile:resolve(temp,'app.js'),bundle:true,format:'esm',jsx:'automatic',alias:{'@':resolve(root,'admin-floreria/client/src'),'@site':resolve(root,'shared'),react:resolve(root,'node_modules/react'),'react-dom':resolve(root,'node_modules/react-dom')},define:{'import.meta.env':JSON.stringify({VITE_API_URL:'/api'})},plugins:[{name:'inline-css',setup(b){b.onResolve({filter:/\.css\?inline$/},args=>({path:resolve(root,'shared/website.css'),namespace:'inline'}));b.onLoad({filter:/.*/,namespace:'inline'},async args=>({contents:`export default ${JSON.stringify(await readFile(args.path,'utf8'))}`,loader:'js'}));}}]});
const server=createServer(async(req,res)=>{try{const pathname=new URL(req.url,'http://localhost').pathname;let file;if(pathname.startsWith('/assets/'))file=resolve(root,'client/public'+pathname);else if(pathname==='/app.js'||pathname==='/app.css')file=resolve(temp,pathname.slice(1));else {res.setHeader('Content-Type','text/html');res.end('<!doctype html><html><head><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/app.css"></head><body style="margin:0;font-family:system-ui"><div id="root"></div><script type="module" src="/app.js"></script></body></html>');return;}res.setHeader('Content-Type',({'.js':'text/javascript','.css':'text/css','.jpg':'image/jpeg','.png':'image/png'})[extname(file)]||'application/octet-stream');res.end(await readFile(file));}catch{res.statusCode=404;res.end();}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${server.address().port}`;
assert.equal((await fetch(base)).status,200);
const chrome=spawn('/usr/bin/google-chrome',['--headless','--no-sandbox','--disable-gpu','--no-first-run','--remote-debugging-port=0',`--user-data-dir=${temp}/chrome`,'about:blank'],{stdio:'ignore'});
const delay=ms=>new Promise(r=>setTimeout(r,ms));
let socket;
try {
 let port;
 for(let i=0;i<100;i++){try{port=(await readFile(resolve(temp,'chrome/DevToolsActivePort'),'utf8')).split('\n')[0];break;}catch{await delay(100);}}
 assert.ok(port,'Chrome started');
 const tabs=await (await fetch(`http://127.0.0.1:${port}/json`)).json();
 socket=new WebSocket(tabs[0].webSocketDebuggerUrl);await new Promise(r=>socket.once('open',r));
 let id=0;const pending=new Map();const exceptions=[];
 socket.on('message',raw=>{const m=JSON.parse(raw);if(m.id){const p=pending.get(m.id);pending.delete(m.id);m.error?p.reject(m.error):p.resolve(m.result);}if(m.method==='Runtime.exceptionThrown')exceptions.push(JSON.stringify(m.params.exceptionDetails));if(m.method==='Runtime.consoleAPICalled'&&m.params.type==='error')console.error(m.params.args.map(a=>a.value||a.description));if(m.method==='Network.loadingFailed')console.error('Browser network',m.params);});
 const send=(method,params={})=>new Promise((resolve,reject)=>{const key=++id;pending.set(key,{resolve,reject});socket.send(JSON.stringify({id:key,method,params}));});
 const evaluate=async expression=>{const r=await send('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(r.exceptionDetails)throw new Error(JSON.stringify(r.exceptionDetails));return r.result.value;};
 const waitFor=async expression=>{for(let i=0;i<60;i++){if(await evaluate(expression))return;await delay(100);}console.error(JSON.stringify({exceptions,dom:await evaluate('document.body.innerHTML.slice(0,3000)')}));throw new Error('Timed out: '+expression);};
 await send('Runtime.enable');await send('Page.enable');await send('Network.enable');await send('Emulation.setDeviceMetricsOverride',{width:1600,height:1000,deviceScaleFactor:1,mobile:false});
 await delay(500);
 let navigation=await send('Page.navigate',{url:base});
 if(navigation.errorText){await delay(500);navigation=await send('Page.navigate',{url:base});}
 assert.equal(navigation.errorText,undefined);
 await waitFor(`document.querySelector('iframe')?.contentDocument?.querySelector('.zt-brand')`);
 assert.equal(await evaluate(`document.querySelector('iframe').contentDocument.querySelectorAll('.zt-block').length`),6);
 await evaluate(`(()=>{const el=[...document.querySelectorAll('label')].find(l=>l.textContent.startsWith('Nombre de la marca')).querySelector('input');Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,'Zetatech prueba');el.dispatchEvent(new Event('input',{bubbles:true}));})()`);
 await waitFor(`document.querySelector('iframe').contentDocument.querySelector('.zt-brand').textContent.includes('Zetatech prueba')`);
 const click=label=>evaluate(`Array.from(document.querySelectorAll('button')).find(b=>b.textContent===${JSON.stringify(label)}).click()`);
 await click('Guardar borrador');await waitFor(`window.__editorMock.state.revision===1`);assert.equal(await evaluate(`window.__editorMock.state.published`),null);
 await click('Publicar');await waitFor(`window.__editorMock.state.published?.theme.brand==='Zetatech prueba'`);
 await click('Móvil');assert.equal(await evaluate(`document.querySelector('iframe').style.width`),'390px');await click('Escritorio');
 const shot=await send('Page.captureScreenshot',{format:'png'});await writeFile(resolve(temp,'editor.png'),Buffer.from(shot.data,'base64'));
 await send('Page.navigate',{url:base+'/?role=VIEWER'});await waitFor(`document.body.textContent.includes('Acceso restringido')`);assert.equal(await evaluate(`document.querySelector('iframe')`),null);
 await send('Page.navigate',{url:base+'/?storefront'});await waitFor(`document.querySelectorAll('.zt-block').length===6`);
 await send('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await delay(200);
 assert.equal(await evaluate(`document.documentElement.scrollWidth<=window.innerWidth`),true,'Mobile has no horizontal overflow');
 const mobile=await send('Page.captureScreenshot',{format:'png'});await writeFile(resolve(temp,'mobile.png'),Buffer.from(mobile.data,'base64'));
 assert.deepEqual(exceptions,[]);
 console.log(JSON.stringify({passed:true,checks:['preview renders','text edits update preview','save leaves published unchanged','publish','mobile preview','viewer denied','mobile overflow','no runtime exceptions'],artifacts:temp}));
}finally{socket?.close();chrome.kill();server.close();}
