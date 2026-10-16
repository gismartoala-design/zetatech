// Uses only a fake backend; never reads .env, writes orders or logs in to a real account.
import { createServer } from 'node:http';
import { spawn } from 'node:child_process';
import { mkdtemp } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import assert from 'node:assert/strict';

const root = resolve(import.meta.dirname, '..');
const temp = await mkdtemp(resolve(tmpdir(), 'zetatech-admin-proxy-'));
const backend = createServer(async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  if (req.url === '/api/admin/login') {
    res.setHeader('Set-Cookie', ['session=fixture; Path=/; HttpOnly', 'other=fixture; Path=/; HttpOnly']);
    res.end(JSON.stringify({ status: 'success' }));
  } else if (req.url === '/api/admin/metadata') {
    const authenticated = req.headers.cookie === 'session=fixture' && req.headers.authorization === 'Bearer fixture';
    res.statusCode = authenticated ? 200 : 401;
    res.end(JSON.stringify({ authenticated }));
  } else if (req.url === '/api/external/company') {
    res.end(JSON.stringify({data:{name:'Fixture store',settings:{paymentSettings:{enabledMethods:['Banco','Contra entrega'],zelleInstructions:'Fixture Zelle',datafastToken:'never-public-fixture'}}}}));
  } else if (req.url === '/api/upload' || req.url === '/api/cms/website/media') {
    const chunks=[];
    for await (const chunk of req) chunks.push(chunk);
    res.end(JSON.stringify({contentType:req.headers['content-type'],body:Buffer.concat(chunks).toString('base64')}));
  } else if (req.url === '/api/form') {
    const chunks=[];for await (const chunk of req) chunks.push(chunk);
    res.end(JSON.stringify({body:Buffer.concat(chunks).toString()}));
  } else res.end(JSON.stringify({ status: 'success', data: [] }));
});
await new Promise(r => backend.listen(0, '127.0.0.1', r));
const reservation = createServer();
await new Promise(r => reservation.listen(0, '127.0.0.1', r));
const port = reservation.address().port;
await new Promise(r => reservation.close(r));
const base = `http://127.0.0.1:${port}`;
const app = spawn(process.execPath, [resolve(root, 'dist/index.cjs')], {
  cwd: temp,
  env: { PATH: process.env.PATH, NODE_ENV: 'production', PORT: String(port), BACKEND_URL: `http://127.0.0.1:${backend.address().port}`, APP_PUBLIC_SITE_URL: base },
  stdio: ['ignore', 'pipe', 'pipe'],
});
let logs = ''; app.stdout.on('data', b => logs += b); app.stderr.on('data', b => logs += b);
try {
  let ready = false;
  for (let i = 0; i < 100; i++) {
    try { const r = await fetch(base + '/auth', { redirect: 'manual' }); if (r.status === 302) { ready = true; break; } } catch {}
    await new Promise(r => setTimeout(r, 100));
  }
  assert.ok(ready, logs);
  const auth = await fetch(base + '/auth', { redirect: 'manual' });
  assert.equal(auth.headers.get('location'), '/admin/auth');
  const login = await fetch(base + '/api/admin/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' });
  assert.equal(login.status, 200);
  assert.deepEqual(login.headers.getSetCookie(), ['session=fixture; Path=/; HttpOnly', 'other=fixture; Path=/; HttpOnly']);
  const metadata = await fetch(base + '/api/admin/metadata', { headers: { Cookie: 'session=fixture', Authorization: 'Bearer fixture' } });
  assert.equal(metadata.status, 200);
  assert.equal((await metadata.json()).authenticated, true);
  const anonymous = await fetch(base + '/api/admin/metadata');
  assert.equal(anonymous.status, 401);
  const company=await fetch(base+'/api/external/company');
  const companyData=await company.json();
  assert.deepEqual(companyData.data.settings.paymentSettings.enabledMethods,['Banco','Contra entrega']);
  assert.equal(companyData.data.settings.paymentSettings.zelleInstructions,'Fixture Zelle');
  assert.equal(company.headers.get('cache-control'),'no-store');
  assert.ok(!JSON.stringify(companyData).includes('never-public-fixture'));
  const boundary='zetatech-regression-boundary';
  const payload=Buffer.concat([Buffer.from(`--${boundary}\r\nContent-Disposition: form-data; name="file"; filename="image.png"\r\nContent-Type: image/png\r\n\r\n`),Buffer.from([0,255,128,1,13,10]),Buffer.alloc(256*1024,201),Buffer.from(`\r\n--${boundary}--\r\n`)]);
  for (const path of ['/api/upload','/api/cms/website/media']) {
    const r=await fetch(base+path,{method:'POST',headers:{Cookie:'session=fixture','Content-Type':`multipart/form-data; boundary=${boundary}`},body:payload});
    assert.equal(r.status,200);
    const forwarded=await r.json();
    assert.equal(forwarded.contentType,`multipart/form-data; boundary=${boundary}`);
    assert.deepEqual(Buffer.from(forwarded.body,'base64'),payload,'binary multipart payload must not be serialized as JSON');
  }
  const form=await fetch(base+'/api/form',{method:'POST',headers:{'Content-Type':'application/x-www-form-urlencoded'},body:'tag=audio&tag=tecnolog%C3%ADa&name=Juan+P%C3%A9rez'});
  const parsed=new URLSearchParams((await form.json()).body);
  assert.deepEqual(parsed.getAll('tag'),['audio','tecnología']);
  assert.equal(parsed.get('name'),'Juan Pérez');
  console.log('PASS: auth, cookies, binary multipart upload/CMS media, URL-encoded form forwarding');
} finally {
  app.kill('SIGTERM');
  backend.close();
}
