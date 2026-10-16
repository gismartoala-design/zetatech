const STORE_FEATURES = [{ name: 'discounts', display_name: 'Descuentos' }];

// Resolve permissions from the signed-in administrator's company. The public
// Cloud Run hostname is not a tenant identifier and must not pick another plan.
async function getFeaturesForAdmin(db, adminId, env = process.env) {
  if (!adminId) { const e = new Error('No autenticado'); e.status = 401; throw e; }
  const user = await db.users.findUnique({where:{id:adminId},select:{isActive:true,role:true,company:{select:{id:true,slug:true,isActive:true,allowedDomains:true,website:true}}}});
  if (!user?.isActive || !user.company?.isActive) { const e = new Error('Cuenta no disponible'); e.status = 403; throw e; }
  if (user.role !== 'ADMIN') return [];
  const company = user.company;
  if (env.STOREFRONT_COMPANY_ID === company.id) return STORE_FEATURES.map(f=>({...f}));
  const tenants = await db.tenants.findMany({include:{plan:{include:{plan_features:{where:{is_available:true},include:{features:true}}}}}});
  if (!tenants.length) {
    const companies = await db.company.findMany({where:{isActive:true},select:{id:true},take:2});
    return companies.length === 1 && companies[0].id === company.id ? STORE_FEATURES.map(f=>({...f})) : [];
  }
  const domains = new Set([company.slug]);
  for (const value of [...(company.allowedDomains || []),company.website].filter(Boolean)) {
    try { domains.add(new URL(value.includes('://') ? value : `https://${value}`).hostname.toLowerCase()); } catch {}
  }
  const matches = tenants.filter(t=>domains.has(String(t.domain || '').toLowerCase()));
  if (matches.length !== 1) return [];
  return (matches[0].plan?.plan_features || []).map(p=>({name:p.features.name,display_name:p.features.display_name})).filter(f=>f.name);
}
module.exports = { getFeaturesForAdmin };
