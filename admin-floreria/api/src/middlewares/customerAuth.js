const jwt = require("jsonwebtoken");

// La sesión del portal de clientes viaja en su propia cookie y lleva una marca
// de audiencia distinta a la del panel: un token de cliente nunca puede
// confundirse con uno de administrador, ni al revés.
const COOKIE = "customer_session";
const AUDIENCE = "customer-portal";
const MAX_AGE_DAYS = 30;

function signCustomerSession(customer) {
  return jwt.sign(
    { customerId: customer.id, email: customer.email, aud: AUDIENCE },
    process.env.JWT_SECRET || "secret",
    { expiresIn: `${MAX_AGE_DAYS}d` },
  );
}

function sessionCookieOptions() {
  const isProd = process.env.NODE_ENV === "production";
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: MAX_AGE_DAYS * 24 * 60 * 60 * 1000,
    path: "/",
  };
}

function readCustomerSession(req) {
  const token = req.cookies?.[COOKIE];
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret", { audience: AUDIENCE });
    return decoded?.customerId ? decoded : null;
  } catch {
    return null;
  }
}

function requireCustomer(req, res, next) {
  const session = readCustomerSession(req);
  if (!session) return res.status(401).json({ status: "error", message: "Inicia sesión para ver tu cuenta." });
  req.customer = session;
  next();
}

module.exports = { COOKIE, signCustomerSession, sessionCookieOptions, readCustomerSession, requireCustomer };
