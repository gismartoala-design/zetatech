import { useState } from 'react';
import { BRAND_LOGO } from '@shared/brand';
import type { SiteDocument } from '@shared/website';
import { DEFAULT_COMPANY } from '@/lib/site';

const POLICY_DETAILS: Record<string, { title: string; body: string }> = {
  datos: {
    title: 'Política de Protección de Datos',
    body: 'En ZettaTech protegemos tus datos personales y los utilizamos únicamente para procesar tus pedidos, coordinar entregas y brindarte soporte.',
  },
  cookies: {
    title: 'Política de Cookies',
    body: 'Utilizamos cookies esenciales para mantener tu carrito de compras, tu sesión de cliente y mejorar tu experiencia de navegación.',
  },
  accesibilidad: {
    title: 'Política de Accesibilidad',
    body: 'Trabajamos continuamente para que nuestra tienda en línea sea clara, navegable por teclado y accesible desde cualquier dispositivo.',
  },
  legal: {
    title: 'Aviso Legal',
    body: 'ZettaTech · Guayaquil, Ecuador. Todos los precios y promociones publicados están sujetos a disponibilidad de inventario.',
  },
};

export function StoreFooter({
  theme,
  resolveImage = (url) => url,
}: {
  theme: SiteDocument['theme'];
  resolveImage?: (url: string) => string;
}) {
  const [activePolicy, setActivePolicy] = useState<string | null>(null);
  const logoUrl = resolveImage(theme.logo || BRAND_LOGO);
  const whatsappUrl = `https://wa.me/${DEFAULT_COMPANY.phoneDigits}?text=${encodeURIComponent('Hola ZettaTech, quisiera más información.')}`;
  const policy = activePolicy ? POLICY_DETAILS[activePolicy] : null;

  return (
    <footer className="zt-footer zx-footer-shell">
      <div className="zx-footer-grid">
        <div className="zx-footer-brand-col">
          <a href="/" aria-label="ZettaTech: inicio">
            <img
              className="zt-footer-logo"
              src={logoUrl}
              alt="ZettaTech"
              width="220"
              height="54"
              loading="lazy"
            />
          </a>
          <p className="zx-footer-tagline">
            Tu tienda de tecnología más cerca de ti, entregas en menos de 24 horas en Guayaquil y envíos a todo el país.
          </p>
        </div>

        <div className="zx-footer-col">
          <h3>Producto &amp; Servicio</h3>
          <ul>
            <li><a href="/shop">Tiendas</a></li>
            <li><a href="/contacto">Contáctenos</a></li>
          </ul>
        </div>

        <div className="zx-footer-col">
          <h3>Compras &amp; Pagos</h3>
          <ul>
            <li><a href="/mi-cuenta">Mi cuenta</a></li>
            <li><a href="/mi-cuenta">Mis pedidos</a></li>
          </ul>
        </div>

        <div className="zx-footer-col">
          <h3>Políticas</h3>
          <ul>
            <li><button type="button" onClick={() => setActivePolicy('datos')}>Política de Protección de Datos</button></li>
            <li><button type="button" onClick={() => setActivePolicy('cookies')}>Política de Cookies</button></li>
            <li><button type="button" onClick={() => setActivePolicy('accesibilidad')}>Política de Accesibilidad</button></li>
            <li><button type="button" onClick={() => setActivePolicy('legal')}>Aviso Legal</button></li>
          </ul>
        </div>
      </div>

      {policy && (
        <div className="zx-footer-policy-box" role="region" aria-label={policy.title}>
          <div>
            <strong>{policy.title}</strong>
            <p>{policy.body}</p>
          </div>
          <button type="button" onClick={() => setActivePolicy(null)} aria-label="Cerrar política">
            Cerrar
          </button>
        </div>
      )}

      <div className="zx-footer-social-row">
        <span>Síguenos en:</span>
        <div className="zx-footer-socials">
          <a href="https://www.facebook.com/share/1CTiDqoUiW/" target="_blank" rel="noopener noreferrer" aria-label="Facebook de ZettaTech" title="Facebook">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
              <path d="M13.5 22v-8h2.7l.4-3h-3.1V9.1c0-.9.3-1.5 1.6-1.5h1.6V4.9c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.4-4 4.1V11H7.6v3h2.7v8h3.2z" />
            </svg>
          </a>
          <a href="https://www.instagram.com/zettatech_ec" target="_blank" rel="noopener noreferrer" aria-label="Instagram de ZettaTech" title="Instagram">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
              <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
              <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
            </svg>
          </a>
          <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp de ZettaTech" title="WhatsApp">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
              <path d="M12.03 2a10 10 0 0 0-8.62 15.05L2 22l5.08-1.33A10 10 0 1 0 12.03 2zm5.81 14.13c-.24.68-1.42 1.3-1.97 1.38-.5.07-1.15.1-1.85-.12-.43-.14-.98-.32-1.69-.63-2.98-1.29-4.92-4.29-5.07-4.49-.15-.2-1.21-1.61-1.21-3.07 0-1.46.77-2.18 1.04-2.48.27-.3.59-.37.79-.37h.57c.18 0 .43-.07.67.51.25.6.85 2.07.92 2.22.07.15.12.33.02.53-.1.2-.15.33-.3.51-.15.18-.32.4-.45.54-.15.15-.3.31-.13.61.18.3.78 1.29 1.68 2.09 1.15 1.03 2.13 1.35 2.43 1.5.3.15.48.13.65-.08.18-.2.75-.88.95-1.18.2-.3.4-.25.67-.15.27.1 1.73.82 2.03.97.3.15.5.22.57.34.08.13.08.73-.17 1.41z" />
            </svg>
          </a>
          <a href="https://www.tiktok.com" target="_blank" rel="noopener noreferrer" aria-label="TikTok de ZettaTech" title="TikTok">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor" aria-hidden="true">
              <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 0 0-.79-.05A6.34 6.34 0 0 0 3.15 15.2a6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V8.81a8.26 8.26 0 0 0 4.76 1.5v-3.4a4.85 4.85 0 0 1-1-.22z" />
            </svg>
          </a>
        </div>
      </div>

      <div className="zx-footer-bottom">
        <div className="zx-footer-payments">
          <span>Pago con todas las tarjetas de crédito</span>
          <div className="zx-footer-cards" aria-label="Tarjetas aceptadas">
            <span className="zx-card-chip" title="Visa">
              <svg viewBox="0 0 48 30" aria-hidden="true"><text x="24" y="20" textAnchor="middle" fontFamily="Georgia, serif" fontStyle="italic" fontWeight="700" fontSize="15" fill="#1a1f71">VISA</text></svg>
            </span>
            <span className="zx-card-chip" title="Diners Club">
              <svg viewBox="0 0 48 30" aria-hidden="true">
                <circle cx="24" cy="15" r="10" fill="#0079be" />
                <path d="M24 6.5a8.5 8.5 0 0 0 0 17 8.5 8.5 0 0 0 0-17zm-2.1 3.1v10.8a6.8 6.8 0 0 1 0-10.8zm4.2 0a6.8 6.8 0 0 1 0 10.8z" fill="#fff" />
              </svg>
            </span>
            <span className="zx-card-chip" title="Mastercard">
              <svg viewBox="0 0 48 30" aria-hidden="true">
                <circle cx="19" cy="15" r="9" fill="#eb001b" />
                <circle cx="29" cy="15" r="9" fill="#f79e1b" />
                <path d="M24 8.3a9 9 0 0 1 0 13.4 9 9 0 0 1 0-13.4z" fill="#ff5f00" />
              </svg>
            </span>
            <span className="zx-card-chip" title="Discover">
              <svg viewBox="0 0 48 30" aria-hidden="true">
                <text x="4" y="18.5" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="6" fill="#1a1a1a">DISCOVER</text>
                <circle cx="43" cy="15" r="4" fill="#f68121" />
              </svg>
            </span>
            <span className="zx-card-chip" title="American Express">
              <svg viewBox="0 0 48 30" aria-hidden="true">
                <rect x="3" y="5" width="42" height="20" rx="2" fill="#2e77bc" />
                <text x="24" y="19" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="8.5" fill="#fff">AMEX</text>
              </svg>
            </span>
            <span className="zx-card-chip" title="PacifiCard">
              <svg viewBox="0 0 48 30" aria-hidden="true">
                <text x="24" y="19" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="7.5" fill="#0a4b8c">Pacifi<tspan fill="#f58220">Card</tspan></text>
              </svg>
            </span>
            <span className="zx-card-chip" title="Bankard">
              <svg viewBox="0 0 48 30" aria-hidden="true">
                <text x="24" y="19" textAnchor="middle" fontFamily="Arial, sans-serif" fontWeight="700" fontSize="8" fill="#101614">BANKARD</text>
              </svg>
            </span>
          </div>
        </div>
        <p className="zx-footer-copy">© 2026 ZettaTech. Todos los derechos reservados.</p>
      </div>
    </footer>
  );
}
