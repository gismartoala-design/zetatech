const kinds = ['hero', 'text', 'image', 'benefits', 'products', 'gallery', 'faq', 'contact'];
const motions = ['none', 'fade', 'zoom', 'slide'];
const fonts = ['system', 'serif', 'mono'];
const safeUrl = value => typeof value === 'string' && value.length <= 2000 && (value === '' || /^#[a-zA-Z0-9_-]+$/.test(value) || (/^\/(?!\/)/.test(value) && !/[\\\s]/.test(value)) || /^https?:\/\/[^\s\\]+$/i.test(value));
function validateDocument(doc) {
  const fail = () => { const error = new Error('Contenido inválido: revisa textos, enlaces y bloques'); error.status = 400; throw error; };
  const string = (v, max = 1000) => typeof v === 'string' && v.length <= max;
  const color = v => /^#[0-9a-f]{6}$/i.test(v);
  if (!doc || doc.version !== 1 || !doc.theme || !Array.isArray(doc.blocks) || doc.blocks.length > 40) fail();
  const t = doc.theme;
  if (!Array.isArray(doc.media) || doc.media.length > 100 || !doc.media.every(safeUrl)) fail();
  if (!string(t.brand, 80) || !string(t.description, 300) || !string(t.footer, 500) || !string(t.cartLabel, 40) || !string(t.searchLabel, 40) || !safeUrl(t.logo) || !safeUrl(t.favicon) || !fonts.includes(t.font) || ![t.accent,t.background,t.foreground].every(color) || !Number.isFinite(t.fontSize) || t.fontSize < 14 || t.fontSize > 22 || !Number.isFinite(t.radius) || t.radius < 0 || t.radius > 32 || !Array.isArray(t.links) || t.links.length > 8) fail();
  for (const link of t.links) if (!link || !string(link.label, 60) || !safeUrl(link.href)) fail();
  const ids = new Set();
  for (const b of doc.blocks) {
    if (!b || !string(b.id,80) || !/^[a-zA-Z0-9_-]+$/.test(b.id) || ids.has(b.id) || !kinds.includes(b.type) || typeof b.hidden !== 'boolean' || !string(b.title,200) || !string(b.text,5000) || !safeUrl(b.image) || !safeUrl(b.mobileImage) || !string(b.alt,250) || !safeUrl(b.href) || !string(b.button,60) || !color(b.background) || !color(b.foreground) || !['left','center'].includes(b.align) || !motions.includes(b.motion) || !Number.isFinite(b.duration) || b.duration < 100 || b.duration > 2000 || !Number.isFinite(b.zoom) || b.zoom < 1 || b.zoom > 1.2 || !Number.isFinite(b.padding) || b.padding < 16 || b.padding > 120 || !string(b.category,120) || typeof b.featured !== 'boolean' || !Number.isInteger(b.limit) || b.limit < 1 || b.limit > 12 || !Array.isArray(b.items) || b.items.length > 12 || !Array.isArray(b.productIds) || b.productIds.length > 12 || !b.productIds.every(id=>string(id,100))) fail();
    ids.add(b.id);
    for (const item of b.items) if (!item || !string(item.title,200) || !string(item.text,2000) || !safeUrl(item.image) || !safeUrl(item.href)) fail();
  }
  if (Buffer.byteLength(JSON.stringify(doc)) > 180000) fail();
  // Return only the declared document fields; no arbitrary executable markup.
  return { version: 1, media: doc.media, theme: Object.fromEntries(['brand','description','footer','cartLabel','searchLabel','logo','favicon','font','fontSize','radius','accent','background','foreground','links'].map(k=>[k,t[k]])), blocks: doc.blocks.map(b=>Object.fromEntries(['id','type','hidden','title','text','image','mobileImage','alt','href','button','background','foreground','align','motion','duration','zoom','padding','category','featured','limit','items','productIds'].map(k=>[k,b[k]]))) };
}
function publicSettings(settings) {
  const { websiteEditor, ...rest } = settings || {};
  return rest;
}
module.exports = { validateDocument, publicSettings, safeUrl };
