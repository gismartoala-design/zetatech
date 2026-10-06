const express = require('express');
const { db } = require('../../lib/prisma');
const { createSiteAdmin } = require('../../middlewares/siteAdmin');
const { validateDocument } = require('../../services/siteDocument');
const router = express.Router();
router.use(createSiteAdmin(db));
router.use((req,res,next)=>{ res.set('Cache-Control','private, no-store'); next(); });
router.use('/media', require('./websiteMedia'));
router.get('/products', async (req,res,next)=>{
  try {
    const products=await db.product.findMany({where:{companyId:req.siteCompanyId,isDeleted:false,isActive:true},orderBy:{sortOrder:'asc'},select:{id:true,name:true,price:true,image:true,category:true,featured:true}});
    res.json({data:products.map(p=>({...p,price:`$${Number(p.price||0).toFixed(2)}`,isBestSeller:p.featured}))});
  } catch(e) {next(e);}
});
router.get('/', async (req,res,next)=>{
  try {
    const company = await db.company.findUnique({ where: { id: req.siteCompanyId } });
    res.json({ data: company.settings?.websiteEditor || { revision: 0, draft: null, published: null, history: [] } });
  } catch(e) { next(e); }
});
router.post('/:action', async (req,res,next)=>{
  try {
    const { action } = req.params;
    if (!['save','publish','restore'].includes(action)) return res.sendStatus(404);
    const result = await db.$transaction(async tx=>{
      const company = await tx.company.findUnique({ where: { id: req.siteCompanyId } });
      const state = company.settings?.websiteEditor || { revision: 0, draft: null, published: null, history: [] };
      if (req.body.revision !== state.revision) { const e = new Error('Hay cambios más recientes. Recarga el editor antes de guardar.'); e.status=409; throw e; }
      const document = action === 'restore' ? state.history.find(h=>h.id === req.body.versionId)?.document : req.body.document;
      const draft = validateDocument(document);
      const now = new Date().toISOString();
      const history = action === 'publish' && state.published ? [{ id: String(state.revision), at: state.publishedAt, document: state.published }, ...state.history].slice(0,10) : state.history;
      const nextState = { ...state, revision: state.revision+1, draft, history, updatedAt: now, updatedBy: req.user.adminId, ...(action === 'publish' ? { published: draft, publishedAt: now } : {}) };
      const update = await tx.company.updateMany({ where: { id: company.id, updatedAt: company.updatedAt }, data: { settings: { ...(company.settings || {}), websiteEditor: nextState } } });
      if (!update.count) { const e = new Error('Edición simultánea detectada. Recarga antes de guardar.'); e.status=409; throw e; }
      return nextState;
    });
    res.json({ data: result });
  } catch(e) { if (e.status) return res.status(e.status).json({ message: e.message }); next(e); }
});
module.exports = router;
