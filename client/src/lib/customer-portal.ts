// Portal de clientes. Está construido pero todavía no enlazado desde la
// tienda: para abrirlo hay que poner VITE_CUSTOMER_PORTAL=true al compilar la
// tienda y CUSTOMER_PORTAL_ENABLED=true en el API. Mientras tanto las rutas
// ni siquiera se registran y la API responde 404.
export const CUSTOMER_PORTAL_ENABLED = import.meta.env.VITE_CUSTOMER_PORTAL === 'true';

export type CustomerAccount = {
  id: string; email: string; name: string; lastName: string; phone: string; city: string;
  verified: boolean; memberSince: string | null; lastLoginAt: string | null;
};
export type ProfileInput = { name: string; lastName?: string; phone?: string; city?: string };
export type OrderSummary = { orderNumber: string; createdAt: string; status: string; paymentStatus: string; total: number; itemCount: number };
export type OrderItem = { productId: string; productName: string; image: string; variantName: string; quantity: number; price: number };
export type OrderDetail = Omit<OrderSummary, 'itemCount'> & {
  subtotal: number; shipping: number; receiverName: string; address: string; deliveryNotes: string; items: OrderItem[];
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pago pendiente',
  PROCESSING: 'Pago en proceso',
  SUCCEEDED: 'Pagado',
  PAID: 'Pagado',
  FAILED: 'Pago rechazado',
  REFUNDED: 'Reembolsado',
};

/** Pedidos que todavía están en camino: ni entregados ni cancelados. */
export const OPEN_ORDER_STATUSES = ['PENDING', 'CONFIRMED', 'PREPARING', 'READY'];

export const ORDER_STATUS_LABELS: Record<string, string> = {
  PENDING: 'Pendiente',
  CONFIRMED: 'Confirmado',
  PREPARING: 'Preparando',
  READY: 'Listo para entrega',
  DELIVERED: 'Entregado',
  CANCELLED: 'Cancelado',
};

const BASE = '/api/external/account';

export class PortalError extends Error {
  status: number;
  data?: Record<string, unknown>;
  constructor(message: string, status: number, data?: Record<string, unknown>) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE}${path}`, {
    credentials: 'include',
    headers: init?.body ? { 'Content-Type': 'application/json' } : undefined,
    ...init,
  });
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new PortalError(payload?.message || 'No pudimos completar la operación.', response.status, payload?.data);
  return payload?.data as T;
}

export const portalApi = {
  me: () => request<CustomerAccount>('/me'),
  login: (email: string, password: string) => request<CustomerAccount>('/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (body: { email: string; password: string; name: string; lastName?: string; phone?: string }) =>
    request<{ email: string; needsVerification: boolean; emailSent: boolean }>('/register', { method: 'POST', body: JSON.stringify(body) }),
  verify: (email: string, code: string) => request<CustomerAccount>('/verify', { method: 'POST', body: JSON.stringify({ email, code }) }),
  resendCode: (email: string) => request<{ sent: boolean }>('/resend-code', { method: 'POST', body: JSON.stringify({ email }) }),
  logout: () => request<{ closed: boolean }>('/logout', { method: 'POST' }),
  updateProfile: (body: ProfileInput) => request<CustomerAccount>('/me', { method: 'PUT', body: JSON.stringify(body) }),
  changePassword: (currentPassword: string, newPassword: string) =>
    request<{ changed: boolean }>('/password', { method: 'POST', body: JSON.stringify({ currentPassword, newPassword }) }),
  orders: () => request<OrderSummary[]>('/orders'),
  order: (orderNumber: string) => request<OrderDetail>(`/orders/${encodeURIComponent(orderNumber)}`),
  receiptUrl: (orderNumber: string) => `${BASE}/orders/${encodeURIComponent(orderNumber)}/receipt`,
};
