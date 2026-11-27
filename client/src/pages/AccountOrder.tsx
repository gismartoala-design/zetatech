import { useMemo, useState } from 'react';
import { Link, useRoute } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Download, MapPin, Package, RotateCcw } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { useCustomerAccount } from '@/hooks/useCustomerAccount';
import { useProducts } from '@/hooks/useProducts';
import { useCart } from '@/context/CartContext';
import { portalApi, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS } from '@/lib/customer-portal';

export default function AccountOrder() {
  const [, params] = useRoute('/mi-cuenta/:orderNumber');
  const orderNumber = params?.orderNumber || '';
  const { data: account, isLoading: loadingAccount } = useCustomerAccount();
  const { data: order, isLoading, isError } = useQuery({
    queryKey: ['customer-order', orderNumber],
    queryFn: () => portalApi.order(orderNumber),
    enabled: Boolean(account && orderNumber),
    retry: false,
  });
  const { data: catalog = [] } = useProducts();
  const { addItem, setIsCartOpen } = useCart();
  const [reorderNote, setReorderNote] = useState('');

  // Repetir el pedido usa el catálogo de hoy: un producto retirado o agotado
  // no puede volver al carrito, y se dice cuál fue en vez de fallar en silencio.
  const reorderable = useMemo(() => {
    if (!order) return [];
    return order.items.map(item => ({
      item,
      product: catalog.find(candidate => candidate.id === item.productId),
    }));
  }, [order, catalog]);

  const repeat = () => {
    const available = reorderable.filter(entry => entry.product && entry.product.stock !== 0);
    available.forEach(entry => addItem(entry.product!, entry.item.quantity));
    const missing = reorderable.length - available.length;
    if (!available.length) return setReorderNote('Ninguno de estos productos está disponible ahora mismo.');
    setReorderNote(missing ? `Agregamos ${available.length} de ${reorderable.length} productos; el resto ya no está disponible.` : '');
    setIsCartOpen(true);
  };

  if (loadingAccount) {
    return <div className="page-shell flex items-center justify-center">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-accent border-t-transparent" />
    </div>;
  }
  if (!account) {
    return <div className="page-shell flex flex-col items-center gap-4 text-center">
      <p>Inicia sesión para ver este pedido.</p>
      <Link href="/mi-cuenta" className="ui-btn-primary">Entrar a mi cuenta</Link>
    </div>;
  }

  return <>
    <Seo title={`Pedido ${orderNumber} | ZettaTech`} description="Detalle de tu pedido." path={`/mi-cuenta/${orderNumber}`} robots="noindex, nofollow" />
    <div className="page-shell">
      <main className="mx-auto w-full max-w-2xl">
        <Link href="/mi-cuenta" className="mb-6 inline-flex items-center gap-2 text-sm font-semibold text-accent">
          <ArrowLeft className="h-4 w-4" />Volver a mis pedidos
        </Link>

        {isLoading && <p className="text-sm text-foreground/60">Cargando el pedido…</p>}
        {isError && <p role="alert" className="text-sm text-red-600">No encontramos este pedido en tu cuenta.</p>}

        {order && <section className="surface-card overflow-hidden">
          <header className="bg-[#0f2518] px-6 py-6 text-white sm:px-8">
            <p className="text-xs font-bold uppercase tracking-widest text-white/60">Pedido</p>
            <h1 className="mt-1 text-2xl font-black">{order.orderNumber}</h1>
            <p className="mt-2 text-sm text-white/75">
              {new Date(order.createdAt).toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="rounded-full bg-white/15 px-3 py-1 text-xs font-bold text-[#a8ed89]">
                {ORDER_STATUS_LABELS[order.status] || order.status}
              </span>
              <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-white/80">
                {PAYMENT_STATUS_LABELS[order.paymentStatus] || order.paymentStatus}
              </span>
            </div>
          </header>

          <div className="p-6 sm:p-8">
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-foreground/60">
              <Package className="h-4 w-4" />Productos
            </h2>
            <ul className="divide-y divide-border border-y border-border">
              {order.items.map((item, index) => (
                <li key={index} className="flex items-center justify-between gap-4 py-3 text-sm">
                  <span>{item.quantity} × {item.productName}{item.variantName && <em className="not-italic text-foreground/60"> ({item.variantName})</em>}</span>
                  <span className="font-semibold">${(item.price * item.quantity).toFixed(2)}</span>
                </li>
              ))}
            </ul>

            <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <dt>Subtotal</dt><dd className="text-right">${order.subtotal.toFixed(2)}</dd>
              <dt>Envío</dt><dd className="text-right">{order.shipping ? `$${order.shipping.toFixed(2)}` : 'Gratis'}</dd>
              <dt className="font-bold">Total</dt><dd className="text-right font-bold">${order.total.toFixed(2)}</dd>
            </dl>

            {order.address && (
              <div className="mt-4 flex items-start gap-2 rounded-xl bg-muted px-4 py-3 text-sm">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                <span>{order.receiverName && <strong className="font-semibold">{order.receiverName} · </strong>}{order.address}</span>
              </div>
            )}

            {reorderNote && <p role="status" className="mt-4 text-sm text-accent">{reorderNote}</p>}

            <div className="mt-6 flex flex-wrap gap-3">
              <button type="button" className="ui-btn-primary" onClick={repeat}><RotateCcw className="h-4 w-4" />Repetir pedido</button>
              <a className="ui-btn-secondary" href={portalApi.receiptUrl(order.orderNumber)}><Download className="h-4 w-4" />Descargar comprobante</a>
            </div>
          </div>
        </section>}
      </main>
    </div>
  </>;
}
