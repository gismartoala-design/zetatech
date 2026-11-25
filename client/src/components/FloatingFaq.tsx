import { useState } from 'react';
import { ChevronDown, HelpCircle, X } from 'lucide-react';
import type { SiteItem } from '@shared/website';
import { useCart } from '@/context/CartContext';

const DEFAULT_FAQ_ITEMS: SiteItem[] = [
  {
    title: '¿Dónde encuentro los detalles de un producto?',
    text: 'En la ficha de cada producto puedes revisar sus especificaciones, precio, disponibilidad y opciones de entrega.',
    image: '',
    href: '/shop',
  },
  {
    title: '¿En cuánto tiempo llegan los envíos en Guayaquil?',
    text: 'Las entregas en Guayaquil se realizan en menos de 24 horas hábiles.',
    image: '',
    href: '',
  },
  {
    title: '¿Hacen envíos a todo el país?',
    text: 'Sí, realizamos envíos seguros a todo el Ecuador con seguimiento desde tu cuenta.',
    image: '',
    href: '',
  },
  {
    title: '¿Qué métodos de pago aceptan?',
    text: 'Aceptamos todas las tarjetas de crédito y débito, transferencia bancaria, PayPhone, PayPal y pago contra entrega.',
    image: '',
    href: '',
  },
];

export function FloatingFaq({ items = [] }: { items?: SiteItem[] }) {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(0);
  const { isCartOpen } = useCart();

  if (isCartOpen) return null;

  const list = items.length > 1 ? items : [...items, ...DEFAULT_FAQ_ITEMS.filter(d => !items.some(i => i.title === d.title))];

  return (
    <div className="fixed bottom-5 left-4 z-[115] sm:bottom-8 sm:left-8">
      {open && (
        <section
          aria-label="Preguntas frecuentes"
          className="mb-3 w-[min(340px,calc(100vw-32px))] overflow-hidden rounded-2xl border border-[#188b42]/20 bg-white text-[#101614] shadow-[0_24px_60px_rgba(8,22,14,0.28)]"
        >
          <header className="flex items-center justify-between bg-[#0f2518] px-4 py-3 text-white">
            <div className="flex items-center gap-2">
              <HelpCircle size={18} className="text-[#a8ed89]" />
              <strong className="text-sm font-semibold">Preguntas frecuentes</strong>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar preguntas frecuentes"
              className="rounded-lg p-1 text-white/80 transition hover:bg-white/10 hover:text-white"
            >
              <X size={16} />
            </button>
          </header>

          <div className="max-h-[320px] divide-y divide-[#163725]/10 overflow-y-auto px-4 py-2">
            {list.map((item, idx) => {
              const isOpen = expanded === idx;
              return (
                <div key={idx} className="py-2.5">
                  <button
                    type="button"
                    aria-expanded={isOpen}
                    onClick={() => setExpanded(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between gap-3 text-left text-[13px] font-semibold text-[#14281c]"
                  >
                    <span>{item.title}</span>
                    <ChevronDown
                      size={15}
                      className={`shrink-0 text-[#188b42] transition-transform ${isOpen ? 'rotate-180' : ''}`}
                    />
                  </button>
                  {isOpen && (
                    <p className="mt-2 text-xs leading-relaxed text-[#4b5e52]">
                      {item.text}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </section>
      )}

      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        aria-expanded={open}
        aria-label="Preguntas frecuentes"
        className="inline-flex h-12 items-center gap-2 rounded-full border border-white/25 bg-[#0f2518] px-4 text-xs font-semibold text-white shadow-[0_14px_34px_rgba(8,22,14,0.34)] transition hover:scale-105 hover:bg-[#143522]"
      >
        <HelpCircle size={18} className="text-[#a8ed89]" />
        <span>Preguntas frecuentes</span>
      </button>
    </div>
  );
}
