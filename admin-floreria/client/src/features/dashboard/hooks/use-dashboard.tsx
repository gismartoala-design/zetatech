import { useEffect, useState, useCallback } from "react";
import { toast } from "sonner";
import type { RecentOrder, Stats } from "../types";
import dashboard_stats from "../api/dashboard";

const INITIAL_STATS: Stats = {
  totalProducts: 0,
  totalOrders: 0,
  todayOrders: 0,
  pendingOrders: 0,
  inProgressOrders: 0,
  totalRevenue: 0,
  todayRevenue: 0,
  revenueChange: { value: 0, direction: "increase" },
  ordersChange: { value: 0, direction: "increase" },
};

export default function useDashboard() {
  const [stats, setStats] = useState<Stats>(INITIAL_STATS);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = useCallback(async () => {
    const data = await dashboard_stats.statesman();
    setStats({
      totalProducts:    data.totalProducts ?? 0,
      totalOrders:      data.orders?.total ?? 0,
      todayOrders:      data.orders?.today ?? 0,
      pendingOrders:    data.pendingOrders ?? 0,
      inProgressOrders: data.inProgressOrders ?? 0,
      totalRevenue:     data.revenue?.total ?? 0,
      todayRevenue:     data.revenue?.today ?? 0,
      revenueChange:    data.revenue?.change ?? INITIAL_STATS.revenueChange,
      ordersChange:     data.orders?.change ?? INITIAL_STATS.ordersChange,
    });
  }, []);

  const fetchRecentOrders = useCallback(async () => {
    const res = await dashboard_stats.getOrderLimit(6);
    // La API devuelve { status: "success", data: [...] }
    setRecentOrders(res.data ?? res.orders ?? []);
  }, []);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      await Promise.all([fetchStats(), fetchRecentOrders()]);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Error desconocido";
      console.error("Dashboard error:", err);
      setError(msg);
      toast.error("Error al cargar el dashboard");
    } finally {
      setIsLoading(false);
    }
  }, [fetchStats, fetchRecentOrders]);

  const refreshData = useCallback(() => fetchDashboardData(), [fetchDashboardData]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return { stats, recentOrders, isLoading, error, refreshData };
}
