import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile } from "fs/promises";

// server deps to bundle to reduce openat(2) syscalls
// which helps cold start times
const allowlist = [
  "@google/generative-ai",
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "pg",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

async function buildAll() {
  await rm("dist", { recursive: true, force: true });

  console.log("building client...");
  await viteBuild();

  console.log("building server...");
  const pkg = JSON.parse(await readFile("package.json", "utf-8"));
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  const result = await esbuild({
    entryPoints: ["server/index.ts"],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: "dist/index.cjs",
    define: {
      "process.env.NODE_ENV": '"production"',
      // El servidor comparte módulos con el cliente, y en el cliente las
      // variables se leen con `import.meta.env`. En CommonJS `import.meta` no
      // existe: esbuild lo deja vacío y leer cualquier variable revienta el
      // render. Aquí se apunta al entorno del proceso, que es de donde el
      // servidor las toma de todos modos.
      "import.meta.env": "process.env",
    },
    minify: true,
    external: externals,
    loader: {
      ".css": "empty",
    },
    logLevel: "info",
  });

  // `import.meta` no existe en el formato CommonJS: esbuild lo deja como un
  // objeto vacío y el código que lo lee revienta en el primer render, con la
  // tienda devolviendo 500 en todas las páginas. Es un aviso fácil de pasar por
  // alto entre cientos de líneas de build, así que aquí se trata como error.
  const importMetaWarnings = result.warnings.filter((w) => w.id === "empty-import-meta");
  if (importMetaWarnings.length > 0) {
    console.error(
      "\n❌ Hay código de cliente que lee import.meta dentro del paquete del servidor:",
    );
    for (const warning of importMetaWarnings) {
      const where = warning.location;
      console.error(`   ${where ? `${where.file}:${where.line}` : "?"} — ${warning.text}`);
    }
    console.error(
      "   Léelo con un respaldo de process.env (ver client/src/lib/customer-portal.ts).\n",
    );
    process.exit(1);
  }
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
