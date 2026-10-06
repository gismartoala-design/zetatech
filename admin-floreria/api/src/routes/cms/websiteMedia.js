const express=require('express');
const multer=require('multer');
const { randomUUID }=require('node:crypto');
const router=express.Router();
const upload=multer({storage:multer.memoryStorage(),limits:{fileSize:5*1024*1024,files:1}});
router.post('/',upload.single('file'),async(req,res,next)=>{
  try {
    const f=req.file;const b=f?.buffer;
    const signatures={
      'image/jpeg':()=>b?.[0]===0xff&&b?.[1]===0xd8&&b?.[2]===0xff,
      'image/png':()=>b?.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),
      'image/webp':()=>b?.subarray(0,4).toString()==='RIFF'&&b?.subarray(8,12).toString()==='WEBP',
    };
    if(!f||!signatures[f.mimetype]?.())return res.status(400).json({message:'Selecciona una imagen JPG, PNG o WebP válida.'});
    const extension={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[f.mimetype];
    const {uploadBuffer}=require('../../services/storageService');
    const result=await uploadBuffer({objectName:`sites/${req.siteCompanyId}/${randomUUID()}.${extension}`,buffer:b,contentType:f.mimetype});
    res.json({status:'success',url:result.url});
  }catch(e){next(e);}
});
module.exports=router;
