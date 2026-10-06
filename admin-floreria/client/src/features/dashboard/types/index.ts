interface Stats {
  totalProducts: number;
  totalOrders: number;       // pedidos este mes
  todayOrders: number;       // pedidos hoy
  pendingOrders: number;     // status PENDING
  inProgressOrders: number;  // CONFIRMED + PREPARING + READY
  totalRevenue: number;      // ingresos pagados este mes
  todayRevenue: number;      // ingresos pagados hoy
  revenueChange: {
    value: number;
    direction: "increase" | "decrease";
  };
  ordersChange: {
    value: number;
    direction: "increase" | "decrease";
  };
}

interface RecentOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  total: number;
  totalAmount?: number;
  paymentStatus: string;
  status: string;
  createdAt: string;
  orderItems: Array<{
    id: string;
    quantity: number;
    product: { name: string };
  }>;
}

export type { Stats, RecentOrder };
