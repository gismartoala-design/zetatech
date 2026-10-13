const express = require('express');
const { db } = require('../../lib/prisma');
const { getProductOffer } = require('../../utils/productPricing');
const router = express.Router();
async function resolveCompany(req) {
    // Deployments may pin their storefront company. Otherwise only a unique
    // registered domain (or a single-company installation) can resolve it.
    const configured = process.env.STOREFRONT_COMPANY_ID;
    let company;
    if (configured) company = await db.company.findFirst({ where: { id: configured, isActive: true } });
    else {
      const origin = req.get('Origin');
      const hostname = origin ? new URL(origin).hostname : req.hostname;
      const companies = await db.company.findMany({ where: { isActive: true }, select: { id: true, allowedDomains: true, website: true, settings: true } });
      const matches = companies.filter(c=>[...c.allowedDomains,c.website].filter(Boolean).some(d=>{ try { return new URL(d.includes('://') ? d : `https://${d}`).hostname === hostname; } catch { return false; } }));
      company = matches.length === 1 ? matches[0] : companies.length === 1 ? companies[0] : null;
    }
    return company;
}
router.get('/', async (req,res,next)=>{
  try {
    const company=await resolveCompany(req);
    if (!company) return res.status(404).json({ message: 'Sitio no configurado' });
    res.set('Cache-Control','no-store');
    res.json({ data: company.settings?.websiteEditor?.published || null });
  } catch(e) { next(e); }
});
router.get('/products', async (req,res,next)=>{
  try {
    const company=await resolveCompany(req);
    if (!company) return res.status(404).json({ message: 'Sitio no configurado' });
    const products=await db.product.findMany({where:{companyId:company.id,isActive:true,isDeleted:false},orderBy:[{sortOrder:'asc'},{createdAt:'desc'}],select:{id:true,name:true,description:true,price:true,image:true,category:true,stock:true,featured:true,sortOrder:true,hasVariants:true,variants:{where:{isActive:true,isDeleted:false}},discounts_products:{include:{discounts:true}}}});
    res.set('Cache-Control','no-store');
    res.json({data:products.map(p=>{
      const offer=getProductOffer(p);
      const {discounts_products,variants,...publicProduct}=p;
      return {...publicProduct,price:`$${offer.currentPrice.toFixed(2)}`,originalPrice:offer.offerActive?`$${offer.originalPrice.toFixed(2)}`:null,discountPercent:offer.discountPercent,isBestSeller:p.featured};
    })});
  }catch(e){next(e);}
});
module.exports = router;
