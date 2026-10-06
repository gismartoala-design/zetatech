const { db: prisma } = require("../../lib/prisma");

exports.getChartData = async (req, res) => {
  try {
    // Últimos 12 meses, agrupado por mes con fecha ISO (ej: "2024-04-01")
    const rows = await prisma.$queryRawUnsafe(`
      SELECT
        TO_CHAR(DATE_TRUNC('month', "createdAt"), 'YYYY-MM-DD') AS month,
        COALESCE(SUM(CASE WHEN "paymentStatus" = 'PAID' THEN "total" ELSE 0 END), 0) AS revenue,
        COUNT("id") AS orders
      FROM "orders"
      WHERE "createdAt" >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', "createdAt")
      ORDER BY DATE_TRUNC('month', "createdAt")
    `);

    const data = rows.map((r) => ({
      month: r.month,                  // "2024-04-01" — parseable con new Date()
      revenue: parseFloat(Number(r.revenue).toFixed(2)),
      orders: Number(r.orders),
    }));

    return res.status(200).json({
      status: "success",
      message: "Datos de gráficos obtenidos",
      data,
    });
  } catch (error) {
    console.error("Error fetching chart data:", error);
    return res.status(500).json({ error: "Error al obtener datos de gráficos" });
  }
};
