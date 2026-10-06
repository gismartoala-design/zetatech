// Re-read permissions for every request: a stale JWT cannot retain revoked access.
function createSiteAdmin(db) {
  return async (req, res, next) => {
    try {
      if (!req.user?.adminId) return res.status(401).json({ message: 'Inicia sesión' });
      const user = await db.users.findUnique({ where: { id: req.user.adminId }, include: { company: true } });
      if (!user?.isActive || user.role !== 'ADMIN' || !user.company?.isActive) {
        return res.status(403).json({ message: 'Solo el administrador de la empresa puede editar su sitio' });
      }
      req.siteCompanyId = user.companyId;
      // Non-simple header prevents cross-site form submissions with session cookies.
      if (!['GET', 'HEAD'].includes(req.method) && req.get('X-Site-Editor') !== '1') {
        return res.status(403).json({ message: 'Solicitud de edición inválida' });
      }
      if (!['GET', 'HEAD'].includes(req.method)) {
        const origin = req.get('Origin');
        const trusted = (process.env.CORS_ORIGIN || '').split(',').map(s=>s.trim()).filter(Boolean);
        let allowed = false;
        try { const url = new URL(origin); allowed = trusted.includes(url.origin) || url.host === req.get('Host') || (process.env.NODE_ENV !== 'production' && ['localhost','127.0.0.1'].includes(url.hostname)); } catch { /* fail closed */ }
        if (!allowed) return res.status(403).json({ message: 'Origen del administrador no autorizado' });
      }
      next();
    } catch (error) { next(error); }
  };
}
module.exports = { createSiteAdmin };
