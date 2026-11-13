import { useSyncExternalStore } from 'react';
import type { SiteDocument } from '@shared/website';

// El panel abre la tienda real dentro de un iframe con ?editor=1 y le va
// pasando el borrador. Así lo que el administrador ve mientras edita y lo que
// se publica son exactamente la misma página, no una maqueta parecida.
const DOCUMENT_MESSAGE = 'zetatech-editor-doc';
const HIGHLIGHT_MESSAGE = 'zetatech-editor-highlight';
const READY_MESSAGE = 'zetatech-preview-ready';
const SELECT_MESSAGE = 'zetatech-editor-select';

export function isEditorPreview() {
  if (typeof window === 'undefined') return false;
  return new URLSearchParams(window.location.search).get('editor') === '1' && window.parent !== window;
}

function isTrustedEditor(origin: string) {
  if (origin === window.location.origin) return true;
  // En desarrollo el panel corre en su propio puerto contra la tienda local.
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)
    && ['localhost', '127.0.0.1'].includes(window.location.hostname);
}

function markSelected(blockId: string) {
  document.querySelectorAll<HTMLElement>('[data-zt-selected]').forEach(node => delete node.dataset.ztSelected);
  const section = blockId && document.getElementById(blockId);
  if (section) section.dataset.ztSelected = 'true';
}

// Varios componentes leen el sitio a la vez, pero el puente con el panel es
// uno solo: se conecta en el primer uso y de ahí en adelante solo notifica.
let draft: SiteDocument | null = null;
let connected = false;
const listeners = new Set<() => void>();

function connect() {
  if (connected || !isEditorPreview()) return;
  connected = true;
  document.documentElement.dataset.ztEditor = '1';
  const robots = document.createElement('meta');
  robots.name = 'robots';
  robots.content = 'noindex';
  document.head.appendChild(robots);

  window.addEventListener('message', event => {
    if (!isTrustedEditor(event.origin)) return;
    if (event.data?.type === DOCUMENT_MESSAGE && event.data.document) {
      draft = event.data.document as SiteDocument;
      listeners.forEach(notify => notify());
    }
    if (event.data?.type === HIGHLIGHT_MESSAGE) markSelected(String(event.data.blockId || ''));
  });
  // Dentro de la vista previa nada navega ni se agrega al carrito: un clic
  // solo sirve para seleccionar la sección en el panel de la derecha.
  document.addEventListener('click', event => {
    event.preventDefault();
    event.stopPropagation();
    const section = (event.target as HTMLElement).closest<HTMLElement>('[data-block-id],section[id]');
    const blockId = section?.dataset.blockId || section?.id;
    if (!blockId) return;
    markSelected(blockId);
    window.parent.postMessage({ type: SELECT_MESSAGE, blockId }, '*');
  }, true);

  window.parent.postMessage({ type: READY_MESSAGE }, '*');
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  connect();
  return () => { listeners.delete(onChange); };
}

/** Documento en edición, o null cuando la tienda se visita normalmente. */
export function useEditorDocument() {
  return useSyncExternalStore(subscribe, () => draft, () => null);
}
