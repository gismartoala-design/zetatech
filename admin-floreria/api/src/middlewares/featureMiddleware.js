const { db } = require('../lib/prisma');
const { getFeaturesForAdmin } = require('../services/adminFeatures');

module.exports = function featureMiddleware(featureName) {
  return async (req, res, next) => {
    try {
      const features = await getFeaturesForAdmin(db, req.user?.adminId);
      if (!features.some(f=>f.name === featureName)) return res.status(403).json({status:'error',message:'No tienes acceso a esta función.'});
      next();
    } catch (error) {
      return res.status(error.status || 500).json({status:'error',message:error.status ? error.message : 'No se pudo comprobar el acceso a esta función.'});
    }
  };
};
