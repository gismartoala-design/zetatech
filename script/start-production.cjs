const { spawn } = require('node:child_process');
const net = require('node:net');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const children = [];
let stopping = false;
let finalCode = 0;

function stop(code = 0) {
  if (stopping) return;
  stopping = true;
  finalCode = code;
  for (const child of children) if (child.exitCode == null && child.signalCode == null) child.kill('SIGTERM');
  const force = setTimeout(() => {
    for (const child of children) if (child.exitCode == null && child.signalCode == null) child.kill('SIGKILL');
    process.exit(finalCode);
  }, 8000);
  force.unref();
  if (children.every(child => child.exitCode != null || child.signalCode != null)) process.exit(finalCode);
}

function launch(name, file, cwd, env) {
  const child = spawn(process.execPath, [file], { cwd, env, stdio: 'inherit' });
  children.push(child);
  child.on('error', error => { console.error(`[startup] ${name}: ${error.message}`); stop(1); });
  child.on('exit', (code, signal) => {
    if (!stopping) { console.error(`[startup] ${name} terminó (${code ?? signal}).`); stop(code || 1); }
    if (children.every(process => process.exitCode != null || process.signalCode != null)) process.exit(finalCode);
  });
  return child;
}

async function waitForApi(port) {
  for (let attempt = 0; attempt < 300; attempt++) {
    if (stopping) throw new Error('La API no pudo arrancar.');
    const ready = await new Promise(resolve => {
      const socket = net.createConnection({ host: '127.0.0.1', port });
      socket.setTimeout(100);
      socket.once('connect', () => { socket.destroy(); resolve(true); });
      socket.once('error', () => resolve(false));
      socket.once('timeout', () => { socket.destroy(); resolve(false); });
    });
    if (ready) return;
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('La API no abrió su puerto interno.');
}

process.on('SIGTERM', () => stop());
process.on('SIGINT', () => stop());

(async () => {
  const env = { ...process.env, NODE_ENV: 'production' };
  if (env.EMBEDDED_API !== 'false') {
    const missing = ['DATABASE_URL', 'JWT_SECRET'].filter(key => !env[key]);
    if (missing.length) throw new Error(`Configura en Cloud Run las variables: ${missing.join(', ')}. El .env local no se copia a la imagen.`);
    const apiPort = Number(env.PORT || 8080) === 4000 ? 4001 : 4000;
    const apiRoot = path.join(root, 'admin-floreria/api');
    launch('API', path.join(apiRoot, 'src/index.js'), apiRoot, { ...env, PORT: String(apiPort), HOST: '127.0.0.1' });
    await waitForApi(apiPort);
    env.BACKEND_URL = `http://127.0.0.1:${apiPort}`;
    console.log('[startup] API interna lista. Tienda, /admin y /api comparten el mismo servicio.');
  } else if (!env.BACKEND_URL) throw new Error('El modo API externa requiere BACKEND_URL.');
  launch('WEB', path.join(root, 'dist/index.cjs'), root, env);
})().catch(error => { console.error(`[startup] ${error.message}`); if (!children.length) process.exit(1); stop(1); });
