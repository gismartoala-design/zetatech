// Packages the approved bitmap without changing its pixels. SVG viewports
// display the horizontal lockup or its symbol; the raster is embedded so that
// favicons and <img> elements do not depend on an external SVG resource.
const fs = require('node:fs');
const path = require('node:path');
const source = process.argv[2];
if (!source) throw new Error('Provide the approved transparent logo PNG path.');
const raster = fs.readFileSync(source);
const width = raster.readUInt32BE(16), height = raster.readUInt32BE(20);
const data = raster.toString('base64');
const svg = (viewBox) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${viewBox}" role="img" aria-label="ZettaTech - Tienda de tecnología"><image width="${width}" height="${height}" href="data:image/png;base64,${data}"/></svg>`;
const targets = ['client/public/brand', 'admin-floreria/client/public/brand'];
for (const target of targets) {
  fs.mkdirSync(target, {recursive:true});
  fs.writeFileSync(path.join(target,'zettatech-logo.svg'),svg('60 195 1830 450'));
  fs.writeFileSync(path.join(target,'zettatech-icon.svg'),svg('60 195 480 450'));
  fs.writeFileSync(path.join(target,'zettatech-logo.png'),raster);
}
fs.mkdirSync('admin-floreria/api/src/assets',{recursive:true});
fs.writeFileSync('admin-floreria/api/src/assets/zettatech-logo.png',raster);
console.log('Brand assets packaged for storefront, administrator and email.');
