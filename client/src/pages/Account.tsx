import { useMemo, useState, type FormEvent, type ReactNode } from 'react';
import { Link } from 'wouter';
import {
  Eye, EyeOff, KeyRound, LogOut, Mail, MapPin, Package, Phone, Receipt,
  ShieldCheck, ShoppingBag, Truck, User, Wallet,
} from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { Seo } from '@/components/Seo';
import { useCustomerAccount, useAccountSession } from '@/hooks/useCustomerAccount';
import {
  portalApi, PortalError, ORDER_STATUS_LABELS, PAYMENT_STATUS_LABELS, OPEN_ORDER_STATUSES,
  type CustomerAccount, type OrderSummary,
} from '@/lib/customer-portal';

/** "page-shell" es la misma clase que usan Shop y Contacto para despejar la
 *  barra de navegación fija (ver storefront-refinement.css): sin ella, como
 *  pasaba antes aquí, el contenido arranca debajo del navbar y el título
 *  queda cortado. */
function AccountShell({ children, width = 'max-w-5xl' }: { children: ReactNode; width?: string }) {
  return (
    <div className="page-shell">
      <main className={`mx-auto w-full ${width}`}>{children}</main>
    </div>
  );
}

const money = (value: number) => `$${value.toFixed(2)}`;
const longDate = (value: string) =>
  new Date(value).toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' });
const shortDate = (value: string) =>
  new Date(value).toLocaleDateString('es-EC', { year: '2-digit', month: 'short', day: 'numeric' });

function initials(account: CustomerAccount) {
  const letters = `${account.name?.[0] || ''}${account.lastName?.[0] || ''}`.trim();
  return (letters || account.email[0] || '?').toUpperCase();
}

/* ── Acceso ─────────────────────────────────────────────────────────── */

type Mode = 'login' | 'register' | 'verify';

function PasswordField({
  label, value, onChange, autoComplete, minLength, hint,
}: {
  label: string; value: string; onChange: (v: string) => void;
  autoComplete: string; minLength?: number; hint?: string;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <label className="flex flex-col gap-1.5 text-sm font-semibold">
      {label}
      <span className="relative flex items-center">
        <input
          type={visible ? 'text' : 'password'}
          className="w-full rounded-xl border border-border bg-white p-3 pr-12 font-normal outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
          value={value}
          onChange={event => onChange(event.target.value)}
          required
          minLength={minLength}
          autoComplete={autoComplete}
        />
        <button
          type="button"
          onClick={() => setVisible(current => !current)}
          aria-label={visible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          className="absolute right-2 rounded-lg p-2 text-foreground/50 transition hover:bg-muted hover:text-foreground"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </span>
      {hint && <small className="font-normal text-foreground/60">{hint}</small>}
    </label>
  );
}

function AuthPanel() {
  const { setAccount } = useAccountSession();
  const [mode, setMode] = useState<Mode>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [lastName, setLastName] = useState('');
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
      const result = await portalApi.register({
        email, password, name,
        lastName: lastName || undefined,
        phone: phone || undefined,
      });
      setMode('verify');
      setNotice(result.emailSent
        ? `Te enviamos un código de 6 dígitos a ${result.email}.`
        : 'Creamos tu cuenta, pero no pudimos enviar el código. Toca "Enviar otro código".');
    });
    return void run(async () => { setAccount(await portalApi.verify(email, code)); });
  };

  const title = mode === 'login' ? 'Entra a tu cuenta' : mode === 'register' ? 'Crea tu cuenta' : 'Confirma tu correo';

  return (
    <AccountShell width="max-w-md">
      <section className="surface-card overflow-hidden">
        <header className="bg-[#0f2518] px-6 py-7 text-white sm:px-8">
          <ShieldCheck className="mb-3 h-9 w-9 text-[#a8ed89]" />
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-white/75">
            {mode === 'verify'
              ? 'Escribe el código de 6 dígitos que enviamos a tu correo. Sin este paso no mostramos tus compras a nadie.'
              : 'Consulta tus pedidos, descarga comprobantes y repite una compra anterior.'}
          </p>
        </header>

        <div className="p-6 sm:p-8">
          <form onSubmit={onSubmit} className="flex flex-col gap-4">
            {mode !== 'verify' && <>
              {mode === 'register' && (
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="flex flex-col gap-1.5 text-sm font-semibold">Nombre
                    <input className="rounded-xl border border-border bg-white p-3 font-normal outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20" value={name} onChange={e => setName(e.target.value)} required minLength={2} autoComplete="given-name" />
                  </label>
                  <label className="flex flex-col gap-1.5 text-sm font-semibold">Apellido
                    <input className="rounded-xl border border-border bg-white p-3 font-normal outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20" value={lastName} onChange={e => setLastName(e.target.value)} autoComplete="family-name" />
                  </label>
                </div>
              )}
              <label className="flex flex-col gap-1.5 text-sm font-semibold">Correo
                <input type="email" className="rounded-xl border border-border bg-white p-3 font-normal outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" />
              </label>
              {mode === 'register' && (
                <label className="flex flex-col gap-1.5 text-sm font-semibold">Celular (opcional)
                  <input className="rounded-xl border border-border bg-white p-3 font-normal outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20" value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" placeholder="Ej.: 0991234567" />
                </label>
              )}
              <PasswordField
                label="Contraseña"
                value={password}
                onChange={setPassword}
                minLength={mode === 'register' ? 8 : 1}
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                hint={mode === 'register' ? 'Mínimo 8 caracteres.' : undefined}
              />
            </>}

            {mode === 'verify' && (
              <label className="flex flex-col gap-1.5 text-sm font-semibold">Código
                <input
                  inputMode="numeric"
                  pattern="\d{6}"
                  maxLength={6}
                  className="rounded-xl border border-border bg-white p-3 text-center text-2xl font-normal tracking-[0.4em] outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20"
                  value={code}
                  onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                  required
                  autoComplete="one-time-code"
                />
              </label>
            )}

            {notice && <p role="status" className="rounded-xl bg-accent/10 px-3 py-2 text-sm text-accent">{notice}</p>}
            {error && <p role="alert" className="rounded-xl bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>}

            <button type="submit" className="ui-btn-primary w-full" disabled={busy}>
              {busy ? 'Un momento…' : mode === 'login' ? 'Entrar' : mode === 'register' ? 'Crear cuenta' : 'Confirmar'}
            </button>
          </form>

          <div className="mt-5 flex flex-col items-start gap-2 text-sm">
            {mode === 'verify'
              ? <button type="button" className="font-semibold text-accent underline" disabled={busy} onClick={() => run(async () => { await portalApi.resendCode(email); setNotice('Si la cuenta existe y falta confirmarla, acabamos de enviar otro código.'); })}>Enviar otro código</button>
              : <button type="button" className="font-semibold text-accent underline" onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setError(''); setNotice(''); }}>
                  {mode === 'login' ? '¿No tienes cuenta? Créala aquí' : '¿Ya tienes cuenta? Entra aquí'}
                </button>}
            <Link href="/shop" className="text-foreground/60 underline">Volver a la tienda</Link>
          </div>
        </div>
      </section>
    </AccountShell>
  );
}

/* ── Piezas del panel ───────────────────────────────────────────────── */

function StatusChip({ status }: { status: string }) {
  const tone = status === 'DELIVERED' ? 'bg-accent/12 text-accent'
    : status === 'CANCELLED' ? 'bg-red-50 text-red-600'
    : 'bg-amber-50 text-amber-700';
  return <span className={`inline-flex rounded-full px-3 py-1 text-xs font-bold ${tone}`}>{ORDER_STATUS_LABELS[status] || status}</span>;
}

function StatCard({ icon: Icon, label, value, detail }: { icon: typeof Package; label: string; value: string; detail?: string }) {
  return (
    <div className="surface-card p-4 sm:p-5">
      <Icon className="mb-3 h-5 w-5 text-accent" />
      <p className="text-xs font-bold uppercase tracking-wider text-foreground/55">{label}</p>
      <p className="mt-1 text-2xl font-black leading-tight">{value}</p>
      {detail && <p className="mt-1 text-xs text-foreground/60">{detail}</p>}
    </div>
  );
}

function OrderRow({ order }: { order: OrderSummary }) {
  return (
    <Link
      href={`/mi-cuenta/${encodeURIComponent(order.orderNumber)}`}
      className="surface-card flex flex-wrap items-center justify-between gap-3 p-4 transition hover:border-accent/40 hover:shadow-md"
    >
      <div className="min-w-0">
        <p className="font-bold">{order.orderNumber}</p>
        <p className="text-sm text-foreground/60">
          {longDate(order.createdAt)} · {order.itemCount} {order.itemCount === 1 ? 'producto' : 'productos'}
        </p>
        <p className="mt-0.5 text-xs text-foreground/50">{PAYMENT_STATUS_LABELS[order.paymentStatus] || order.paymentStatus}</p>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <p className="text-lg font-black">{money(order.total)}</p>
        <StatusChip status={order.status} />
      </div>
    </Link>
  );
}

function EmptyOrders() {
  return (
    <div className="surface-card p-8 text-center">
      <Package className="mx-auto mb-3 h-10 w-10 text-accent" />
      <p className="mb-1 font-semibold">Todavía no tienes pedidos con este correo.</p>
      <p className="mb-5 text-sm text-foreground/60">Cuando compres, aquí verás el estado de cada pedido y podrás descargar su comprobante.</p>
      <Link href="/shop" className="ui-btn-primary">Ver el catálogo</Link>
    </div>
  );
}

/* ── Secciones ──────────────────────────────────────────────────────── */

function OverviewTab({ orders, isLoading, isError }: { orders?: OrderSummary[]; isLoading: boolean; isError: boolean }) {
  const stats = useMemo(() => {
    const list = orders || [];
    const spent = list
      .filter(order => order.status !== 'CANCELLED')
      .reduce((sum, order) => sum + order.total, 0);
    const open = list.filter(order => OPEN_ORDER_STATUSES.includes(order.status)).length;
    return { count: list.length, spent, open, last: list[0] };
  }, [orders]);

  if (isLoading) return <p className="text-sm text-foreground/60">Cargando tu resumen…</p>;
  if (isError) return <p role="alert" className="text-sm text-red-600">No pudimos cargar tus pedidos. Intenta de nuevo en un momento.</p>;
  if (!orders?.length) return <EmptyOrders />;

  return (
    <div className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <StatCard icon={ShoppingBag} label="Pedidos" value={String(stats.count)} detail="en total" />
        <StatCard icon={Wallet} label="Total comprado" value={money(stats.spent)} detail="sin contar cancelados" />
        <StatCard icon={Truck} label="En curso" value={String(stats.open)} detail={stats.open ? 'aún en camino' : 'nada pendiente'} />
        <StatCard icon={Receipt} label="Último pedido" value={stats.last ? shortDate(stats.last.createdAt) : '—'} detail={stats.last?.orderNumber} />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-bold">Últimos pedidos</h2>
        <div className="flex flex-col gap-3">
          {orders.slice(0, 3).map(order => <OrderRow key={order.orderNumber} order={order} />)}
        </div>
      </section>
    </div>
  );
}

function OrdersTab({ orders, isLoading, isError }: { orders?: OrderSummary[]; isLoading: boolean; isError: boolean }) {
  if (isLoading) return <p className="text-sm text-foreground/60">Cargando tus pedidos…</p>;
  if (isError) return <p role="alert" className="text-sm text-red-600">No pudimos cargar tus pedidos. Intenta de nuevo en un momento.</p>;
  if (!orders?.length) return <EmptyOrders />;
  return <div className="flex flex-col gap-3">{orders.map(order => <OrderRow key={order.orderNumber} order={order} />)}</div>;
}

function ProfileTab({ account }: { account: CustomerAccount }) {
  const { setAccount } = useAccountSession();
  const [name, setName] = useState(account.name);
  const [lastName, setLastName] = useState(account.lastName);
  const [phone, setPhone] = useState(account.phone);
  const [city, setCity] = useState(account.city);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');

  const dirty = name !== account.name || lastName !== account.lastName || phone !== account.phone || city !== account.city;

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setBusy(true); setError(''); setSaved('');
    void portalApi.updateProfile({ name, lastName, phone, city })
      .then(updated => { setAccount(updated); setSaved('Datos guardados.'); })
      .catch(e => setError(e instanceof Error ? e.message : 'No pudimos guardar tus datos.'))
      .finally(() => setBusy(false));
  };

  const field = 'rounded-xl border border-border bg-white p-3 font-normal outline-none transition focus:border-accent focus:ring-2 focus:ring-accent/20';

  return (
    <form onSubmit={onSubmit} className="surface-card flex flex-col gap-5 p-5 sm:p-7">
      <div>
        <h2 className="text-lg font-bold">Tus datos</h2>
        <p className="mt-1 text-sm text-foreground/60">Los usamos para coordinar la entrega de tus pedidos.</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1.5 text-sm font-semibold">Nombre
          <input className={field} value={name} onChange={e => setName(e.target.value)} required minLength={2} autoComplete="given-name" />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold">Apellido
          <input className={field} value={lastName} onChange={e => setLastName(e.target.value)} autoComplete="family-name" />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold">Celular / WhatsApp
          <input className={field} value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" placeholder="Ej.: 0991234567" />
        </label>
        <label className="flex flex-col gap-1.5 text-sm font-semibold">Ciudad
          <input className={field} value={city} onChange={e => setCity(e.target.value)} autoComplete="address-level2" placeholder="Ej.: Guayaquil" />
        </label>
      </div>

      <div className="rounded-xl bg-muted px-4 py-3">
        <p className="flex items-center gap-2 text-sm font-semibold"><Mail className="h-4 w-4 text-accent" />{account.email}</p>
        <p className="mt-1 text-xs text-foreground/60">
          Tu correo identifica tu historial de compras, así que no se cambia desde aquí. Escríbenos si necesitas moverlo a otro.
        </p>
      </div>

      {saved && <p role="status" className="text-sm text-accent">{saved}</p>}
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

      <div>
        <button type="submit" className="ui-btn-primary" disabled={busy || !dirty}>
          {busy ? 'Guardando…' : 'Guardar cambios'}
        </button>
      </div>
    </form>
  );
}

function SecurityTab({ account }: { account: CustomerAccount }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState('');

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setBusy(true); setError(''); setSaved('');
    void portalApi.changePassword(currentPassword, newPassword)
      .then(() => { setSaved('Tu contraseña fue actualizada.'); setCurrentPassword(''); setNewPassword(''); })
      .catch(e => setError(e instanceof Error ? e.message : 'No pudimos cambiar la contraseña.'))
      .finally(() => setBusy(false));
  };

  return (
    <div className="flex flex-col gap-6">
      <form onSubmit={onSubmit} className="surface-card flex max-w-md flex-col gap-5 p-5 sm:p-7">
        <div>
          <h2 className="flex items-center gap-2 text-lg font-bold"><KeyRound className="h-5 w-5 text-accent" />Cambiar contraseña</h2>
          <p className="mt-1 text-sm text-foreground/60">Te pedimos la actual para confirmar que eres tú.</p>
        </div>

        <PasswordField label="Contraseña actual" value={currentPassword} onChange={setCurrentPassword} autoComplete="current-password" />
        <PasswordField label="Contraseña nueva" value={newPassword} onChange={setNewPassword} autoComplete="new-password" minLength={8} hint="Mínimo 8 caracteres." />

        {saved && <p role="status" className="text-sm text-accent">{saved}</p>}
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

        <div>
          <button type="submit" className="ui-btn-primary" disabled={busy}>{busy ? 'Guardando…' : 'Cambiar contraseña'}</button>
        </div>
      </form>

      <div className="surface-card max-w-md p-5 sm:p-7">
        <h2 className="flex items-center gap-2 text-lg font-bold"><ShieldCheck className="h-5 w-5 text-accent" />Tu sesión</h2>
        <dl className="mt-3 flex flex-col gap-2 text-sm">
          <div className="flex justify-between gap-3"><dt className="text-foreground/60">Correo confirmado</dt><dd className="font-semibold">{account.verified ? 'Sí' : 'Pendiente'}</dd></div>
          {account.memberSince && <div className="flex justify-between gap-3"><dt className="text-foreground/60">Cliente desde</dt><dd className="font-semibold">{longDate(account.memberSince)}</dd></div>}
          {account.lastLoginAt && <div className="flex justify-between gap-3"><dt className="text-foreground/60">Último ingreso</dt><dd className="font-semibold">{longDate(account.lastLoginAt)}</dd></div>}
        </dl>
      </div>
    </div>
  );
}

/* ── Panel ──────────────────────────────────────────────────────────── */

const TABS = [
  { id: 'resumen', label: 'Resumen', Icon: ShoppingBag },
  { id: 'pedidos', label: 'Mis pedidos', Icon: Package },
  { id: 'perfil', label: 'Mi perfil', Icon: User },
  { id: 'seguridad', label: 'Seguridad', Icon: KeyRound },
] as const;

function Dashboard({ account }: { account: CustomerAccount }) {
  const { setAccount } = useAccountSession();
  const [tab, setTab] = useState<(typeof TABS)[number]['id']>('resumen');
  const { data: orders, isLoading, isError } = useQuery({
    queryKey: ['customer-orders'],
    queryFn: portalApi.orders,
    retry: false,
  });

  const fullName = `${account.name} ${account.lastName}`.trim();

  return (
    <AccountShell>
      <header className="surface-card mb-6 flex flex-wrap items-center gap-4 p-5 sm:p-6">
        <span className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-accent text-xl font-black text-white">
          {initials(account)}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-xl font-black sm:text-2xl">Hola, {account.name}</h1>
          <p className="truncate text-sm text-foreground/60">{account.email}</p>
          <div className="mt-1.5 flex flex-wrap items-center gap-2 text-xs text-foreground/55">
            {account.verified && (
              <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2.5 py-1 font-semibold text-accent">
                <ShieldCheck className="h-3.5 w-3.5" />Correo confirmado
              </span>
            )}
            {account.memberSince && <span>Cliente desde {longDate(account.memberSince)}</span>}
          </div>
        </div>
        <button
          type="button"
          className="ui-btn-secondary"
          onClick={async () => { await portalApi.logout().catch(() => {}); setAccount(null); }}
        >
          <LogOut className="h-4 w-4" />Salir
        </button>
      </header>

      <nav aria-label="Secciones de tu cuenta" className="mb-6 flex gap-2 overflow-x-auto pb-1">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            aria-current={tab === id ? 'page' : undefined}
            className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-sm font-semibold transition ${
              tab === id
                ? 'border-accent bg-accent text-white shadow-sm'
                : 'border-border bg-white text-foreground/70 hover:border-accent/40 hover:text-foreground'
            }`}
          >
            <Icon className="h-4 w-4" />{label}
          </button>
        ))}
      </nav>

      {tab === 'resumen' && <OverviewTab orders={orders} isLoading={isLoading} isError={isError} />}
      {tab === 'pedidos' && <OrdersTab orders={orders} isLoading={isLoading} isError={isError} />}
      {tab === 'perfil' && <ProfileTab account={account} />}
      {tab === 'seguridad' && <SecurityTab account={account} />}

      {tab === 'resumen' && (
        <section className="mt-8 grid gap-3 sm:grid-cols-3">
          <Link href="/shop" className="surface-card flex items-center gap-3 p-4 transition hover:border-accent/40">
            <ShoppingBag className="h-5 w-5 shrink-0 text-accent" /><span className="text-sm font-semibold">Seguir comprando</span>
          </Link>
          <button type="button" onClick={() => setTab('perfil')} className="surface-card flex items-center gap-3 p-4 text-left transition hover:border-accent/40">
            <Phone className="h-5 w-5 shrink-0 text-accent" /><span className="text-sm font-semibold">Actualizar mis datos</span>
          </button>
          <Link href="/contacto" className="surface-card flex items-center gap-3 p-4 transition hover:border-accent/40">
            <MapPin className="h-5 w-5 shrink-0 text-accent" /><span className="text-sm font-semibold">Contactar a ventas</span>
          </Link>
        </section>
      )}
    </AccountShell>
  );
}

export default function Account() {
  const { data: account, isLoading } = useCustomerAccount();
  return <>
    <Seo title="Mi cuenta | ZettaTech" description="Consulta tus pedidos de ZettaTech." path="/mi-cuenta" robots="noindex, nofollow" />
    {isLoading
      ? <main className="flex min-h-screen items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-accent border-t-transparent" /></main>
      : account ? <Dashboard account={account} /> : <AuthPanel />}
  </>;
}
