// Pure render fixtures: no network, database, credentials or admin changes.
import assert from 'node:assert/strict';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { CategoryScene, EditorialScene, ProductJourney } from '../client/src/components/StorefrontScenes';
import { defaultSite } from '../shared/website';
import type { Product } from '../client/src/data/mock';
import { getCategoryArtwork, getStorefrontProductImage } from '../client/src/lib/storefront-artwork';

const hero = defaultSite.blocks.find(block => block.type === 'hero')!;
const product: Product = {
  id: 'fixture-product', name: 'Producto <real>', category: 'Audio',
  price: '$89.00', originalPrice: '$100.00', discountPercent: 11,
  stock: 8, image: '/fixture-product.png', description: 'Descripción de prueba',
  isBestSeller: true, deliveryTime: '', size: '', includes: '',
};
const featured = renderToStaticMarkup(<ProductJourney block={hero} product={product} />);
assert.match(featured, /Producto &lt;real&gt;/, 'Product names must be escaped');
assert.match(featured, /8 unidades disponibles/);
assert.match(featured, /\$89\.00/);
assert.match(featured, /<del>\$100\.00<\/del>/);
assert.match(featured, /−11%/);
assert.match(featured, /loading="eager"/);
assert.match(featured, /fetchPriority="high"/);

const empty = renderToStaticMarkup(<ProductJourney block={hero} />);
assert.doesNotMatch(empty, /zx-product-facts|\$89|Producto &lt;real&gt;/);
assert.match(empty, /La tecnología se vive/);
assert.match(empty, /Sigue la conexión/);

const unknown = renderToStaticMarkup(<ProductJourney block={hero} product={{ ...product, stock: null, originalPrice: null }} />);
assert.match(unknown, /Consultar disponibilidad/);
assert.doesNotMatch(unknown, /class="zx-offer"/);

const categories = defaultSite.blocks.find(block => block.type === 'benefits')!;
const categoryMarkup = renderToStaticMarkup(<CategoryScene block={categories} products={[product]} />);
assert.match(categoryMarkup, /audio-cutout\.png/);
assert.match(categoryMarkup, /wearables-cutout\.png/);
assert.match(categoryMarkup, /accessories-cutout\.png/);
assert.match(categoryMarkup, /href="#audio"/);
assert.doesNotMatch(categoryMarkup, /zx-category-orbit/, 'Every default category has a real photographic illustration');
const customCategory = renderToStaticMarkup(<CategoryScene block={{...categories,items:[{title:'Audio',text:'',image:'/custom-photo.png',href:'/shop'}]}} products={[]} />);
assert.match(customCategory, /custom-photo\.png/, 'Explicitly configured imagery remains authoritative');
const asusSource='https://geniosbot.com/plataforma-recursos/images/1792202388007-otebook-asus-vivobook-15-x1504vap-c38128.png';
assert.match(getStorefrontProductImage({image:asusSource}), /asus-vivobook-cutout\.png/);
assert.match(getStorefrontProductImage({image:`/image-proxy?url=${encodeURIComponent(asusSource)}`}), /asus-vivobook-cutout\.png/);
const hpSource='https://geniosbot.com/plataforma-recursos/images/1792202655021-notebook-hp-ci3-100u-1.2ghz-8gb-512gb-ssd-cod.-it-c92pxla-abm.png';
assert.match(getStorefrontProductImage({image:hpSource}), /hp-laptop-cutout\.png/);
assert.match(getStorefrontProductImage({image:`/image-proxy?url=${encodeURIComponent(hpSource)}`}), /hp-laptop-cutout\.png/);
assert.match(renderToStaticMarkup(<ProductJourney block={hero} product={{...product,image:hpSource}} />), /hp-laptop-cutout\.png/, 'The HP hero must render its transparent derivative, not the original white-backed photo');
assert.equal(getStorefrontProductImage({image:'/replacement-product.png'}),'/replacement-product.png','Never reuse a cutout for a changed product photograph');
assert.match(getCategoryArtwork('Relojes'),/wearables-cutout\.png/);
assert.match(getCategoryArtwork('Audífonos'),/audio-cutout\.png/);

const editorial = defaultSite.blocks.find(block => block.type === 'image')!;
const editorialMarkup = renderToStaticMarkup(<EditorialScene block={{ ...editorial, mobileImage: '/mobile.png' }} index={1} />);
assert.match(editorialMarkup, /zx-editorial-reverse/);
assert.match(editorialMarkup, /media="\(max-width: 640px\)"/);
assert.match(editorialMarkup, /srcSet="\/mobile.png"/);
assert.match(editorialMarkup, /loading="lazy"/);

console.log('PASS: public scenes, real price/stock/offers, safe names, empty catalogue, unknown stock, category links, responsive and lazy images.');
