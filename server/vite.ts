import { type Express } from "express";
import { createServer as createViteServer, createLogger, type ViteDevServer } from "vite";
import { type Server } from "http";
import viteConfig from "../vite.config";
import fs from "fs";
import path from "path";
import { nanoid } from "nanoid";

const viteLogger = createLogger();

export async function setupVite(server: Server, app: Express): Promise<ViteDevServer> {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server, path: "/vite-hmr" },
    allowedHosts: true as const,
  };

  const vite = await createViteServer({
    ...viteConfig,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      },
    },
    server: serverOptions,
    appType: "custom",
  });

  app.use(vite.middlewares);

  return vite;
}

export async function getDevTemplate(vite: ViteDevServer, url: string) {
  const clientTemplate = path.resolve(import.meta.dirname, "..", "client", "index.html");
  let template = await fs.promises.readFile(clientTemplate, "utf-8");
  template = template.replace(`src="/src/main.tsx"`, `src="/src/main.tsx?v=${nanoid()}"`);
  return vite.transformIndexHtml(url, template);
}
