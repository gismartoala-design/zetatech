const { db } = require("../../lib/prisma");

const pct = (current, previous) => {
  if (previous === 0) return current > 0 ? 100 : 0;
  return parseFloat((((current - previous) / previous) * 100).toFixed(2));
};

exports.getStatesmanData = async (req, res) => {
  try {
    const now = new Date();

    // Rangos de tiempo
    const startOfToday    = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth    = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth  = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);

    const [
      todayOrders,
      monthOrders,
      lastMonthOrders,
      pendingCount,
      inProgressCount,
      productCount,
    ] = await Promise.all([
      // Pedidos creados hoy (todos los estados)
      db.order.findMany({
        where: { createdAt: { gte: startOfToday } },
        select: { total: true, paymentStatus: true },
      }),

      // Pedidos creados este mes (todos los estados)
      db.order.findMany({
        where: { createdAt: { gte: startOfMonth } },
        select: { total: true, paymentStatus: true },
      }),

      // Pedidos del mes pasado (todos los estados)
      db.order.findMany({
        where: { createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } },
        select: { total: true, paymentStatus: true },
      }),

      // Pendientes: esperando atención
      db.order.count({ where: { status: "PENDING" } }),

      // En proceso: confirmados + preparando + listos
      db.order.count({
        where: { status: { in: ["CONFIRMED", "PREPARING", "READY"] } },
      }),

      // Total de productos publicados
      db.product.count(),
    ]);

    // Ingresos = órdenes pagadas (paymentStatus PAID)
    const todayRevenue    = todayOrders.filter(o => o.paymentStatus === "PAID").reduce((s, o) => s + Number(o.total), 0);
    const monthRevenue    = monthOrders.filter(o => o.paymentStatus === "PAID").reduce((s, o) => s + Number(o.total), 0);
    const lastMonthRevenue = lastMonthOrders.filter(o => o.paymentStatus === "PAID").reduce((s, o) => s + Number(o.total), 0);

    return res.status(200).json({
      revenue: {
        today: parseFloat(todayRevenue.toFixed(2)),
        total: parseFloat(monthRevenue.toFixed(2)),
        change: {
          value: pct(monthRevenue, lastMonthRevenue),
          direction: monthRevenue >= lastMonthRevenue ? "increase" : "decrease",
        },
      },
      orders: {
        today: todayOrders.length,
        total: monthOrders.length,
        change: {
          value: pct(monthOrders.length, lastMonthOrders.length),
          direction: monthOrders.length >= lastMonthOrders.length ? "increase" : "decrease",
        },
      },
      pendingOrders: pendingCount,
      inProgressOrders: inProgressCount,
      totalProducts: productCount,
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    return res.status(500).json({ error: "Error al obtener datos del dashboard." });
  }
};
