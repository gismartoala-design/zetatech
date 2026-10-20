# Imágenes de la experiencia pública

PNG con transparencia real, preparados con la herramienta integrada de edición de imágenes (no CSS para simular un fondo transparente). Los originales se conservan; no se modifican registros de productos ni el administrador.

## Archivos y procedencia

- `hp-laptop-cutout.png`: recorte de la fotografía del HP del catálogo, https://geniosbot.com/plataforma-recursos/images/1792202655021-notebook-hp-ci3-100u-1.2ghz-8gb-512gb-ssd-cod.-it-c92pxla-abm.png. La selección automática puede cambiar entre HP y ASUS según disponibilidad: ambos tienen su propio derivado, asociado a su foto original.

- `asus-vivobook-cutout.png`: nueva descarga de la fotografía usada por el ASUS del catálogo, https://geniosbot.com/plataforma-recursos/images/1792202388007-otebook-asus-vivobook-15-x1504vap-c38128.png. Derivado para portada; solo se aplica cuando coincide el archivo original. Si cambia la imagen del producto, deja de utilizarse automáticamente.
- `audio-cutout.png`: recorte de `../zetatech-audio.jpg`, fotografía de audífonos suministrada para el negocio.
- `wearables-cutout.png`: recorte de `../zetatech-watch.jpg`, fotografía de reloj suministrada para el negocio.
- `accessories-cutout.png`: fotografía del kit de micrófonos del catálogo, https://geniosbot.com/plataforma-recursos/images/1792201952273-primus-gaming-microphone-it-pmi-l10bt.png.

Las tres últimas se utilizan como ilustraciones de categoría, no como nuevos productos ni promesas de disponibilidad. Las imágenes configuradas explícitamente para una categoría mantienen prioridad. El código de selección está en `client/src/lib/storefront-artwork.ts`.

## Prompts finales utilizados

Todos los pedidos usaron `transparent_background: true` y la imagen original como objetivo de edición.

### HP

Use case: background-extraction. Asset type: real storefront product cutout. Input image is the edit target, the exact silver HP laptop photograph. Remove ONLY the exterior white background. Preserve the identical laptop, frontal viewpoint, proportions, silver chassis, black keyboard, trackpad, black display bezel, blue and white HP logo on the screen and fine blue/white wireframe screen wallpaper. The silver/light parts of the actual laptop and white elements INSIDE the screen must remain opaque. No redesign, added text, extra hardware, platform, shadows, or recoloring. Genuinely transparent alpha exterior, clean anti-aliased edges with no white halo and no baked-in checkerboard. Complete product centered, approximately 88 percent of frame width with modest transparent padding.

### ASUS

Use case: background-extraction. Asset type: public storefront cutout. Input image: edit target. Remove only the exterior white background from this exact ASUS Vivobook laptop photograph. Preserve the laptop precisely: identical frontal viewpoint, dark quiet-blue body, keyboard, screen wallpaper, Intel Core 100U 3 and Intel graphics screen labels, logo, proportions and all edges. Keep the white areas INSIDE the screen labels opaque. Deliver a genuinely transparent background with alpha; no white rectangle, no checkerboard baked in, no added lighting, no platform, no reflection. Center the complete laptop, tightly framed with about 8 percent transparent padding; laptop should occupy about 85 percent of width.

### Audio

Use case: background-extraction. Asset type: public storefront cutout. Input image: edit target. Remove only the blue graphic background from this exact photograph of blue JBL over-ear headphones. Preserve the headphones' exact appearance, viewpoint, shape, material, blue color, embossed JBL logo and details. Transparent alpha background, including the space inside the headband. Do not redraw, add objects or text. Complete product centered with 8 percent transparent padding, clean fine edges without halos. Category image for an electronics storefront.

### Wearables

Use case: background-extraction. Asset type: public storefront cutout. Input image: edit target. Extract only the pink smartwatch and its band from this photograph. Remove the peach background AND the red decorative heartbeat tube behind the watch. Preserve watch shape, pink strap, viewpoint, screen graphics and displayed numbers exactly; do not invent any hardware. Genuinely transparent alpha background, clean edges, no white rectangle or fake checkerboard. Entire watch and strap centered with 8 percent transparent padding. Electronics category illustration.

### Accesorios

Use case: background-extraction. Input image is the exact edit target, a real Primus wireless lavalier microphone kit in its purple-lined open charging case. Remove ONLY the exterior white background, leaving a genuinely transparent alpha background. Preserve every detail of the two microphones, foam windscreens, USB receiver, case, purple lining, green indicator lights, viewpoint and proportions exactly. Do not add text, products, logos or recolor anything. Complete product centered with 8 percent transparent padding. Clean fine edges with no white halo, fake checkerboard, platform or reflection. Asset type: electronics store accessories category.

### Limpieza final de wearables

Use case: background-extraction cleanup. This is already a transparent pink smartwatch cutout. Remove ONLY the remaining stray white/pink background fragments and speckles OUTSIDE the watch silhouette, especially around left side, upper edge and bottom strap. Keep the complete physical watch, band, silhouette, viewpoint, pink color, screen and all lettering unchanged. Make exterior and the open space inside the band fully transparent with clean anti-aliased edges and no halos. No glow, white rectangle or checkerboard. Preserve the opaque light-pink watch itself. Center with 6 percent transparent padding.
