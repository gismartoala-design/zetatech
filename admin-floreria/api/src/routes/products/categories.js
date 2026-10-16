const express=require('express');
const {db}=require('../../lib/prisma');
const {categoryKey,categoryName,mergeCategories}=require('../../services/productCategories');
const router=express.Router();
router.use(async(req,res,next)=>{
  try {
    const admin=await db.users.findUnique({where:{id:req.user.adminId},select:{companyId:true,role:true,isActive:true,company:{select:{isActive:true}}}});
    if(!admin?.isActive||!admin.company?.isActive||admin.role!=='ADMIN')return res.status(403).json({message:'Solo el administrador puede gestionar las categorías.'});
    req.categoryCompanyId=admin.companyId;next();
  }catch(e){next(e);}
});
router.get('/',async(req,res,next)=>{
  try {
    const [company,products]=await Promise.all([
      db.company.findUnique({where:{id:req.categoryCompanyId},select:{settings:true}}),
      db.product.findMany({where:{companyId:req.categoryCompanyId,isDeleted:false},distinct:['category'],select:{category:true}}),
    ]);
    res.set('Cache-Control','private, no-store');
    res.json({status:'success',data:mergeCategories(company.settings?.productCategories,products.map(p=>p.category))});
  }catch(e){next(e);}
});
router.post('/',async(req,res,next)=>{
  try {
    const name=categoryName(req.body.name);
    if(!name||name.length>120)return res.status(400).json({message:'Escribe un nombre de categoría de 1 a 120 caracteres.'});
    const result=await db.$transaction(async tx=>{
      const company=await tx.company.findUnique({where:{id:req.categoryCompanyId},select:{id:true,settings:true,updatedAt:true}});
      const products=await tx.product.findMany({where:{companyId:company.id,isDeleted:false},distinct:['category'],select:{category:true}});
      const existing=mergeCategories(company.settings?.productCategories,products.map(p=>p.category));
      const savedName=existing.find(item=>categoryKey(item)===categoryKey(name));
      if(savedName)return {name:savedName,created:false};
      const registered=mergeCategories(company.settings?.productCategories,[name]);
      if(registered.length>500){const e=new Error('Se alcanzó el límite de 500 categorías.');e.status=400;throw e;}
      const updated=await tx.company.updateMany({where:{id:company.id,updatedAt:company.updatedAt},data:{settings:{...(company.settings||{}),productCategories:registered}}});
      if(!updated.count){const e=new Error('La configuración cambió. Intenta crear la categoría nuevamente.');e.status=409;throw e;}
      return {name,created:true};
    });
    res.status(result.created?201:200).json({status:'success',data:result,message:result.created?'Categoría creada':'La categoría ya existe'});
  }catch(e){next(e);}
});
module.exports=router;
