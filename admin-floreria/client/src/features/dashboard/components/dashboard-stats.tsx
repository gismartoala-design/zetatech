import { memo } from "react";
import {
  ShoppingBag,
  Clock,
  Loader2,
  TrendingUp,
  DollarSign,
  Package,
} from "lucide-react";
import type { Stats } from "../types";

interface DashboardStatsProps {
  stats: Stats;
}

function DashboardStats({ stats }: DashboardStatsProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
      {/* Hoy: pedidos */}
      <StatCard
        label="Pedidos hoy"
        value={stats.todayOrders}
        icon={<ShoppingBag className="h-5 w-5" />}
        iconBg="bg-blue-100 text-blue-600"
        highlight={stats.todayOrders > 0}
      />

      {/* Hoy: ingresos */}
      <StatCard
        label="Ingresos hoy"
        value={`$${stats.todayRevenue.toFixed(2)}`}
        icon={<DollarSign className="h-5 w-5" />}
        iconBg="bg-green-100 text-green-600"
        highlight={stats.todayRevenue > 0}
      />

      {/* Pendientes — requieren atención */}
      <StatCard
        label="Pendientes"
        value={stats.pendingOrders}
        icon={<Clock className="h-5 w-5" />}
        iconBg={stats.pendingOrders > 0 ? "bg-amber-100 text-amber-600" : "bg-gray-100 text-gray-400"}
        highlight={stats.pendingOrders > 0}
        highlightColor="amber"
      />

      {/* En proceso */}
      <StatCard
        label="En proceso"
        value={stats.inProgressOrders}
        icon={<Loader2 className="h-5 w-5" />}
        iconBg={stats.inProgressOrders > 0 ? "bg-orange-100 text-orange-600" : "bg-gray-100 text-gray-400"}
      />

      {/* Mes: pedidos */}
      <StatCard
        label="Pedidos del mes"
        value={stats.totalOrders}
        sub={stats.ordersChange.value !== 0 ? `${stats.ordersChange.direction === "increase" ? "+" : ""}${stats.ordersChange.value}% vs mes ant.` : undefined}
        subColor={stats.ordersChange.direction === "increase" ? "text-green-600" : "text-red-500"}
        icon={<TrendingUp className="h-5 w-5" />}
        iconBg="bg-indigo-100 text-indigo-600"
      />

      {/* Productos */}
      <StatCard
        label="Productos"
        value={stats.totalProducts}
        icon={<Package className="h-5 w-5" />}
        iconBg="bg-purple-100 text-purple-600"
      />
    </div>
  );
}

interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  subColor?: string;
  icon: React.ReactNode;
  iconBg: string;
  highlight?: boolean;
  highlightColor?: "amber" | "blue";
}

function StatCard({ label, value, sub, subColor, icon, iconBg, highlight, highlightColor = "blue" }: StatCardProps) {
  const ringClass = highlight
    ? highlightColor === "amber"
      ? "ring-2 ring-amber-300"
      : "ring-2 ring-blue-200"
    : "";

  return (
    <div className={`bg-white rounded-xl border p-4 flex flex-col gap-3 transition-shadow hover:shadow-sm ${ringClass}`}>
      <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${iconBg}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-bold text-gray-900 leading-none">{value}</p>
        <p className="text-xs text-gray-500 mt-1">{label}</p>
        {sub && <p className={`text-xs mt-1 font-medium ${subColor ?? "text-gray-400"}`}>{sub}</p>}
      </div>
    </div>
  );
}

export default memo(DashboardStats);
