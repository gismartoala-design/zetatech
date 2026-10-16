const jwt = require('jsonwebtoken');
const { db: prisma } = require('../../lib/prisma');
const { hashPassword } = require('../../lib/password');
const { getFeaturesForAdmin } = require('../../services/adminFeatures');
const { isEnabled: testDatabaseEnabled, findUserById: findTestUser } = require('../../lib/testDatabase');

exports.me = async (req, res) => {
  try {
    const token = req.cookies.session;
    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "No autenticado"
      });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    let admin;
    if (testDatabaseEnabled()) {
      const testAdmin = findTestUser(decoded.adminId);
      admin = testAdmin && { id: testAdmin.id, email: testAdmin.email, name: testAdmin.name, role: testAdmin.role };
    } else {
      admin = await prisma.users.findUnique({
        where: { id: decoded.adminId },
        select: { id: true, email: true, name: true, role: true }
      });
    }
    if (!admin) {
      return res.status(404).json({
        status: "error",
        message: "Admin no encontrado"
      });
    }
    console.log("Admin profile fetched:", admin);
    return res.status(200).json({
      status: "success",
      message: "Perfil obtenido",
      data: {
        admin
      }
    });
  } catch (error) {
    console.error("Error fetching admin profile:", error);
    return res.status(401).json({
      status: "error",
      message: "Token inválido o expirado"
    });
  }
};

// Update admin profile
exports.updateMe = async (req, res) => {
  try {
    const token = req.cookies.session;
    if (!token) {
      return res.status(401).json({
        status: "error",
        message: "No autenticado"
      });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
    const { name, email, password } = req.body;

    // Prepare update data
    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (password) updateData.password = await hashPassword(password);

    const admin = await prisma.users.update({
      where: { id: decoded.adminId },
      data: updateData,
      select: { id: true, email: true, name: true }
    });

    return res.status(200).json({
      status: "success",
      message: "Perfil actualizado correctamente",
      data: {
        admin
      }
    });
  } catch (error) {
    console.error("Error updating admin profile:", error);
    return res.status(500).json({
      status: "error",
      message: "Error al actualizar el perfil"
    });
  }
};

exports.features = async (req, res) => {
  try {
    const features = testDatabaseEnabled()
      ? []
      : await getFeaturesForAdmin(prisma, req.user?.adminId);
    return res.status(200).json({status:'success',message:'Características obtenidas',data:{features}});
  } catch (error) {
    console.error('Error fetching features:', error.message);
    return res.status(error.status || 500).json({status:'error',message:error.status ? error.message : 'Error al obtener las características',data:null});
  }
};
