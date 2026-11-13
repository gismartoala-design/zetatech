import { useState, type FormEvent } from 'react';
import { Link } from 'wouter';
import { LogOut, Package, ShieldCheck } from 'lucide-react';
import { Seo } from '@/components/Seo';
import { useCustomerAccount, useAccountSession } from '@/hooks/useCustomerAccount';
import { portalApi, PortalError, ORDER_STATUS_LABELS, type OrderSummary } from '@/lib/customer-portal';
import { useQuery } from '@tanstack/react-query';

type Mode = 'login' | 'register' | 'verify';

function AuthPanel() {
  const { setAccount } = useAccountSession();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  const run = async (action: () => Promise<void>) => {
    setBusy(true); setError(''); setNotice('');
    try { await action(); }
    catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos completar la operación.');
      if (e instanceof PortalError && e.data?.needsVerification) setMode('verify');
    }
    finally { setBusy(false); }
  };

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (mode === 'login') return void run(async () => { setAccount(await portalApi.login(email, password)); });
    if (mode === 'register') return void run(async () => {
      const result = await portalApi.register({ email, password, name, phone: phone || undefined });
      setMode('verify');
      setNotice(result.emailSent
        ? `Te enviamos un código de 6 dígitos a ${result.email}.`
        : 'Creamos tu cuenta, pero no pudimos enviar el código. Toca "Enviar otro código".');
    });
    return void run(async () => { setAccount(await portalApi.verify(email, code)); });
  };

  return <main className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-5 py-24">
    <section className="surface-card p-6 sm:p-8">
      <ShieldCheck className="mb-4 h-10 w-10 text-accent" />
      <h1 className="mb-2 text-2xl font-bold">
        {mode === 'login' ? 'Entra a tu cuenta' : mode === 'register' ? 'Crea tu cuenta' : 'Confirma tu correo'}
      </h1>
      <p className="mb-6 text-sm text-foreground/70">
        {mode === 'verify'
          ? 'Escribe el código de 6 dígitos que enviamos a tu correo. Sin este paso no mostramos tus compras a nadie.'
          : 'Consulta tus pedidos, descarga comprobantes y repite una compra anterior.'}
      </p>

      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        {mode !== 'verify' && <>
          {mode === 'register' && <label className="flex flex-col gap-1 text-sm font-semibold">Nombre
            <input className="rounded-lg border border-border p-2.5 font-normal" value={name} onChange={e => setName(e.target.value)} required minLength={2} autoComplete="given-name"/>
          </label>}
          <label className="flex flex-col gap-1 text-sm font-semibold">Correo
            <input type="email" className="rounded-lg border border-border p-2.5 font-normal" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email"/>
          </label>
          {mode === 'register' && <label className="flex flex-col gap-1 text-sm font-semibold">Celular (opcional)
            <input className="rounded-lg border border-border p-2.5 font-normal" value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel"/>
          </label>}
          <label className="flex flex-col gap-1 text-sm font-semibold">Contraseña
            <input type="password" className="rounded-lg border border-border p-2.5 font-normal" value={password} onChange={e => setPassword(e.target.value)} required minLength={mode === 'register' ? 8 : 1} autoComplete={mode === 'register' ? 'new-password' : 'current-password'}/>
            {mode === 'register' && <small className="font-normal text-foreground/60">Mínimo 8 caracteres.</small>}
          </label>
        </>}

        {mode === 'verify' && <label className="flex flex-col gap-1 text-sm font-semibold">Código
          <input inputMode="numeric" pattern="\d{6}" maxLength={6} className="rounded-lg border border-border p-2.5 text-center text-2xl tracking-[0.4em] font-normal" value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))} required autoComplete="one-time-code"/>
        </label>}

        {notice && <p role="status" className="text-sm text-accent">{notice}</p>}
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

        <button type="submit" className="ui-btn-primary w-full" disabled={busy}>
          {busy ? 'Un momento…' : mode === 'login' ? 'Entrar' : mode === 'register' ? 'Crear cuenta' : 'Confirmar'}
        </button>
      </form>

      <div className="mt-5 flex flex-col gap-2 text-sm">
        {mode === 'verify'
          ? <button type="button" className="text-accent underline" disabled={busy} onClick={() => run(async () => { await portalApi.resendCode(email); setNotice('Si la cuenta existe y falta confirmarla, acabamos de enviar otro código.'); })}>Enviar otro código</button>
          : <button type="button" className="text-accent underline" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setNotice(''); }}>
              {mode === 'login' ? '¿No tienes cuenta? Créala aquí' : '¿Ya tienes cuenta? Entra aquí'}
            </button>}
        <Link href="/shop" className="text-foreground/60 underline">Volver a la tienda</Link>
      </div>
    </section>
  </main>;
}

function OrderRow({ order }: { order: OrderSummary }) {
  const date = new Date(order.createdAt).toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' });
  return <Link href={`/mi-cuenta/${encodeURIComponent(order.orderNumber)}`} className="surface-card flex flex-wrap items-center justify-between gap-3 p-4 transition hover:border-accent/40">
    <div>
      <p className="font-semibold">{order.orderNumber}</p>
      <p className="text-sm text-foreground/60">{date} · {order.itemCount} {order.itemCount === 1 ? 'producto' : 'productos'}</p>
    </div>
    <div className="text-right">
      <p className="font-bold">${order.total.toFixed(2)}</p>
      <span className="rounded-full bg-accent/10 px-3 py-1 text-xs font-semibold text-accent">{ORDER_STATUS_LABELS[order.status] || order.status}</span>
    </div>
  </Link>;
}

function OrdersPanel({ name }: { name: string }) {
  const { setAccount } = useAccountSession();
  const { data: orders, isLoading, isError } = useQuery({ queryKey: ['customer-orders'], queryFn: portalApi.orders, retry: false });

  return <main className="mx-auto min-h-screen max-w-3xl px-5 pb-20 pt-40">
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="text-sm text-foreground/60">Hola, {name}</p>
        <h1 className="text-3xl font-bold">Mis pedidos</h1>
      </div>
      <button type="button" className="ui-btn-secondary" onClick={async () => { await portalApi.logout().catch(() => {}); setAccount(null); }}>
        <LogOut className="h-4 w-4"/>Cerrar sesión
      </button>
    </header>

    {isLoading && <p className="text-sm text-foreground/60">Cargando tus pedidos…</p>}
    {isError && <p role="alert" className="text-sm text-red-600">No pudimos cargar tus pedidos. Intenta de nuevo en un momento.</p>}
    {orders && !orders.length && <div className="surface-card p-8 text-center">
      <Package className="mx-auto mb-3 h-10 w-10 text-accent"/>
      <p className="mb-4">Todavía no tienes pedidos con este correo.</p>
      <Link href="/shop" className="ui-btn-primary">Ver el catálogo</Link>
    </div>}
    <div className="flex flex-col gap-3">{orders?.map(order => <OrderRow key={order.orderNumber} order={order}/>)}</div>
  </main>;
}

export default function Account() {
  const { data: account, isLoading } = useCustomerAccount();
  return <>
    <Seo title="Mi cuenta | Zetatech" description="Consulta tus pedidos de Zetatech." path="/mi-cuenta" robots="noindex, nofollow"/>
    {isLoading
      ? <main className="flex min-h-screen items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-accent border-t-transparent"/></main>
      : account ? <OrdersPanel name={account.name}/> : <AuthPanel/>}
  </>;
}
