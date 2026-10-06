import { RefreshCw } from "lucide-react";
import { Button } from "@/shared/components/ui/button";
import Loading from "@/shared/components/loading";
import useDashboard from "../hooks/use-dashboard";
import DashboardStats from "../components/dashboard-stats";
import RecentOrders from "../components/recent-orders";
import { ChartAreaInteractive } from "../components/chart-area-interactive";

export default function DashboardPage() {
  const { stats, recentOrders, isLoading, error, refreshData } = useDashboard();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-[calc(100vh-8rem)]">
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] gap-4 text-center">
        <p className="text-gray-500">{error}</p>
        <Button variant="outline" onClick={refreshData}>Reintentar</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {new Date().toLocaleDateString("es-ES", {
              weekday: "long",
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refreshData} disabled={isLoading} className="gap-2">
          <RefreshCw className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {/* Tarjetas operativas */}
      <DashboardStats stats={stats} />

      {/* Gráfico + pedidos recientes */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <ChartAreaInteractive />
        </div>
        <div className="xl:col-span-1">
          <RecentOrders orders={recentOrders} />
        </div>
      </div>
    </div>
  );
}
