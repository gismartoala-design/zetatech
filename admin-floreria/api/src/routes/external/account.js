const express = require('express');
const crypto = require('node:crypto');
const bcrypt = require('bcryptjs');
const { z } = require('zod');
const { db: prisma } = require('../../lib/prisma');
const { COOKIE, signCustomerSession, sessionCookieOptions, requireCustomer } = require('../../middlewares/customerAuth');
const { buildOrderReceipt } = require('../../services/orderReceipt');
const emailService = require('../../services/emailService');

const router = express.Router();

// El portal todavía no está enlazado desde la tienda. Mientras el interruptor
// esté apagado la API entera responde 404, para que no quede una puerta
// abierta a los datos de los clientes antes de tiempo.
const portalEnabled = () => process.env.CUSTOMER_PORTAL_ENABLED === 'true';

const CODE_MINUTES = 15;
const EMAIL = z.string().trim().toLowerCase().email().max(180);
const PASSWORD = z.string().min(8).max(200);
const registerSchema = z.object({
  email: EMAIL,
  password: PASSWORD,
  name: z.string().trim().min(2).max(80),
  lastName: z.string().trim().max(80).optional(),
  phone: z.string().trim().max(40).optional(),
});
const loginSchema = z.object({ email: EMAIL, password: z.string().min(1).max(200) });
const verifySchema = z.object({ email: EMAIL, code: z.string().trim().regex(/^\d{6}$/) });

// Limitador en memoria: frena la prueba de contraseñas a fuerza bruta sin
// añadir otra dependencia. Se reinicia con el proceso, que para este uso basta.
const attempts = new Map();
function rateLimit(key, max, windowMs) {
  const now = Date.now();
  const entry = attempts.get(key);
  if (!entry || now > entry.resetAt) {
    attempts.set(key, { count: 1, resetAt: now + windowMs });
    if (attempts.size > 5000) for (const [k, v] of attempts) if (now > v.resetAt) attempts.delete(k);
    return true;
  }
  entry.count += 1;
  return entry.count <= max;
}
const clientKey = req => `${req.ip || 'sin-ip'}`;
const hashCode = code => crypto.createHash('sha256').update(String(code)).digest('hex');
const newCode = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
const publicCustomer = customer => ({
  id: customer.id,
  email: customer.email,
  name: customer.name,
  lastName: customer.lastName || '',
  phone: customer.phone || '',
  verified: Boolean(customer.emailVerifiedAt),
});

router.use((req, res, next) => {
  if (!portalEnabled()) return res.sendStatus(404);
  // Nada de esta sección puede quedar cacheado: son datos de una persona.
  res.set('Cache-Control', 'private, no-store');
  next();
});

/** Guarda un código nuevo y lo envía. Si el correo falla no se interrumpe el
 *  registro: la cuenta ya existe y volver a pedirla daría "ya registrado",
 *  dejando a la persona sin salida. Se avisa para que pueda reintentar. */
async function issueCode(customer) {
  const code = newCode();
  await prisma.customers.update({
    where: { id: customer.id },
    data: {
      verificationCodeHash: hashCode(code),
      verificationExpiresAt: new Date(Date.now() + CODE_MINUTES * 60 * 1000),
    },
  });
  try {
    await emailService.sendCustomerVerificationCode({ email: customer.email, name: customer.name, code, minutes: CODE_MINUTES });
    return true;
  } catch (error) {
    console.error('[portal] No se pudo enviar el código de verificación:', error.message);
    return false;
  }
}

router.post('/register', async (req, res, next) => {
  try {
    if (!rateLimit(`reg:${clientKey(req)}`, 10, 60 * 60 * 1000)) return res.status(429).json({ status: 'error', message: 'Demasiados intentos. Prueba de nuevo más tarde.' });
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ status: 'error', message: 'Revisa los datos. La contraseña necesita al menos 8 caracteres.' });
    const { email, password, name, lastName, phone } = parsed.data;

    const existing = await prisma.customers.findUnique({ where: { email } });
    if (existing?.password) return res.status(409).json({ status: 'error', message: 'Ya existe una cuenta con este correo. Inicia sesión.' });

    const data = { password: await bcrypt.hash(password, 12), name, lastName: lastName || null, phone: phone || null, emailVerifiedAt: null };
    const customer = existing
      ? await prisma.customers.update({ where: { id: existing.id }, data })
      : await prisma.customers.create({ data: { ...data, id: crypto.randomUUID(), email, updatedAt: new Date() } });

    const emailSent = await issueCode(customer);
    res.status(201).json({ status: 'success', data: { email, needsVerification: true, emailSent } });
  } catch (e) { next(e); }
});

router.post('/resend-code', async (req, res, next) => {
  try {
    if (!rateLimit(`code:${clientKey(req)}`, 5, 60 * 60 * 1000)) return res.status(429).json({ status: 'error', message: 'Demasiados envíos. Espera un momento.' });
    const parsed = z.object({ email: EMAIL }).safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ status: 'error', message: 'Correo inválido.' });
    const customer = await prisma.customers.findUnique({ where: { email: parsed.data.email } });
    // Respuesta idéntica exista o no la cuenta: así no se puede averiguar
    // qué correos están registrados.
    if (customer?.password && !customer.emailVerifiedAt) await issueCode(customer);
    res.json({ status: 'success', data: { sent: true } });
  } catch (e) { next(e); }
});

router.post('/verify', async (req, res, next) => {
  try {
    if (!rateLimit(`ver:${clientKey(req)}`, 20, 60 * 60 * 1000)) return res.status(429).json({ status: 'error', message: 'Demasiados intentos. Prueba más tarde.' });
    const parsed = verifySchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ status: 'error', message: 'El código son 6 dígitos.' });
    const customer = await prisma.customers.findUnique({ where: { email: parsed.data.email } });
    const stored = customer?.verificationCodeHash ? Buffer.from(customer.verificationCodeHash, 'hex') : null;
    const given = Buffer.from(hashCode(parsed.data.code), 'hex');
    const valid = stored && stored.length === given.length
      && customer.verificationExpiresAt > new Date()
      && crypto.timingSafeEqual(stored, given);
    if (!valid) return res.status(400).json({ status: 'error', message: 'El código no es válido o ya venció.' });

    const verified = await prisma.customers.update({
      where: { id: customer.id },
      data: { emailVerifiedAt: new Date(), verificationCodeHash: null, verificationExpiresAt: null, lastLoginAt: new Date() },
    });
    res.cookie(COOKIE, signCustomerSession(verified), sessionCookieOptions());
    res.json({ status: 'success', data: publicCustomer(verified) });
  } catch (e) { next(e); }
});

router.post('/login', async (req, res, next) => {
  try {
    if (!rateLimit(`log:${clientKey(req)}`, 20, 15 * 60 * 1000)) return res.status(429).json({ status: 'error', message: 'Demasiados intentos. Espera unos minutos.' });
    const parsed = loginSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ status: 'error', message: 'Revisa el correo y la contraseña.' });
    const customer = await prisma.customers.findUnique({ where: { email: parsed.data.email } });
    const ok = customer?.password && await bcrypt.compare(parsed.data.password, customer.password);
    if (!ok) return res.status(401).json({ status: 'error', message: 'Correo o contraseña incorrectos.' });
    if (!customer.emailVerifiedAt) {
      const emailSent = await issueCode(customer);
      return res.status(403).json({ status: 'error', message: 'Confirma tu correo con el código que acabamos de enviarte.', data: { needsVerification: true, emailSent } });
    }
    const updated = await prisma.customers.update({ where: { id: customer.id }, data: { lastLoginAt: new Date() } });
    res.cookie(COOKIE, signCustomerSession(updated), sessionCookieOptions());
    res.json({ status: 'success', data: publicCustomer(updated) });
  } catch (e) { next(e); }
});

router.post('/logout', (req, res) => {
  res.clearCookie(COOKIE, { ...sessionCookieOptions(), maxAge: undefined });
  res.json({ status: 'success', data: { closed: true } });
});

router.get('/me', requireCustomer, async (req, res, next) => {
  try {
    const customer = await prisma.customers.findUnique({ where: { id: req.customer.customerId } });
    if (!customer?.password) return res.status(401).json({ status: 'error', message: 'Sesión no válida.' });
    res.json({ status: 'success', data: publicCustomer(customer) });
  } catch (e) { next(e); }
});

/** Los pedidos no guardan el id del cliente, solo el correo con el que se
 *  compró: se buscan por ahí, para que el historial incluya todo lo que la
 *  persona compró antes de que existiera el portal. */
async function findOrders(email, where = {}) {
  return prisma.order.findMany({
    where: { customerEmail: { equals: email, mode: 'insensitive' }, ...where },
    orderBy: { createdAt: 'desc' },
    include: { orderItems: { include: { product: { select: { id: true, name: true, image: true } } } } },
  });
}

router.get('/orders', requireCustomer, async (req, res, next) => {
  try {
    const orders = await findOrders(req.customer.email);
    res.json({ status: 'success', data: orders.map(order => ({
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      status: order.status,
      paymentStatus: order.paymentStatus,
      total: order.total,
      itemCount: order.orderItems.reduce((sum, item) => sum + item.quantity, 0),
    })) });
  } catch (e) { next(e); }
});

router.get('/orders/:orderNumber', requireCustomer, async (req, res, next) => {
  try {
    const [order] = await findOrders(req.customer.email, { orderNumber: String(req.params.orderNumber) });
    if (!order) return res.sendStatus(404);
    res.json({ status: 'success', data: {
      orderNumber: order.orderNumber,
      createdAt: order.createdAt,
      status: order.status,
      paymentStatus: order.paymentStatus,
      subtotal: order.subtotal,
      shipping: order.shipping || 0,
      total: order.total,
      receiverName: order.billingContactName || '',
      address: order.billingPrincipalAddress,
      deliveryNotes: order.deliveryNotes || '',
      items: order.orderItems.map(item => ({
        productId: item.productId,
        productName: item.product?.name || 'Producto',
        image: item.product?.image || '',
        variantName: item.variantName || '',
        quantity: item.quantity,
        price: item.price,
      })),
    } });
  } catch (e) { next(e); }
});

router.get('/orders/:orderNumber/receipt', requireCustomer, async (req, res, next) => {
  try {
    const [order] = await findOrders(req.customer.email, { orderNumber: String(req.params.orderNumber) });
    if (!order) return res.sendStatus(404);
    const pdf = await buildOrderReceipt({
      orderNumber: order.orderNumber,
      paymentStatus: order.paymentStatus === 'SUCCEEDED' ? 'PAID' : order.paymentStatus,
      customerName: `${order.customerName} ${order.customerLastName}`.trim(),
      customerEmail: order.customerEmail,
      customerPhone: order.customerPhone,
      billingContactName: order.billingContactName,
      billingPrincipalAddress: order.billingPrincipalAddress,
      subtotal: order.subtotal,
      shippingCost: order.shipping || 0,
      total: order.total,
      createdAt: new Date(order.createdAt).toLocaleDateString('es-EC', { year: 'numeric', month: 'long', day: 'numeric' }),
      companyName: process.env.COMPANY_NAME || 'Zetatech',
      items: order.orderItems.map(item => ({
        productName: item.product?.name || 'Producto',
        variantName: item.variantName || null,
        quantity: item.quantity,
        price: item.price,
      })),
    });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="pedido-${order.orderNumber}.pdf"`);
    res.send(pdf);
  } catch (e) { next(e); }
});

module.exports = router;
