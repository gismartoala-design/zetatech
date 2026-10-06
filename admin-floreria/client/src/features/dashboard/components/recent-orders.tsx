import { memo } from "react";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import type { RecentOrder } from "../types";

const ORDER_STATUS: Record<string, { cls: string; label: string }> = {
  PENDING:   { cls: "bg-amber-100 text-amber-800",  label: "Pendiente" },
  CONFIRMED: { cls: "bg-blue-100 text-blue-800",    label: "Confirmado" },
  PREPARING: { cls: "bg-orange-100 text-orange-800", label: "Preparando" },
  READY:     { cls: "bg-green-100 text-green-800",  label: "Listo" },
  DELIVERED: { cls: "bg-gray-100 text-gray-700",    label: "Entregado" },
  CANCELLED: { cls: "bg-red-100 text-red-800",      label: "Cancelado" },
};

const PAYMENT_STATUS: Record<string, { cls: string; label: string }> = {
  PAID:      { cls: "bg-green-100 text-green-700 border-green-300",  label: "Pagado" },
  PENDING:   { cls: "bg-yellow-100 text-yellow-700 border-yellow-300", label: "Pendiente" },
  FAILED:    { cls: "bg-red-100 text-red-700 border-red-300",        label: "Fallido" },
  CANCELLED: { cls: "bg-gray-100 text-gray-600 border-gray-300",     label: "Cancelado" },
};

function RecentOrders({ orders }: { orders: RecentOrder[] }) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base font-semibold">Pedidos recientes</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {orders.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-10">Sin pedidos recientes</p>
        ) : (
          <div className="divide-y">
            {orders.map((order) => {
              const statusCfg = ORDER_STATUS[order.status] ?? { cls: "bg-gray-100 text-gray-600", label: order.status };
              const payCfg = PAYMENT_STATUS[order.paymentStatus] ?? PAYMENT_STATUS.PENDING;
              const amount = order.total || order.totalAmount || 0;

              return (
                <div key={order.id} className="flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50">
                  {/* Número + cliente */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-sm text-gray-900">
                        #{order.orderNumber ?? order.id.slice(-6).toUpperCase()}
                      </span>
                      <Badge className={`text-xs px-1.5 py-0 ${statusCfg.cls}`}>
                        {statusCfg.label}
                      </Badge>
                      <Badge variant="outline" className={`text-xs px-1.5 py-0 ${payCfg.cls}`}>
                        {payCfg.label}
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5 truncate">{order.customerName}</p>
                  </div>

                  {/* Monto + hora */}
                  <div className="text-right shrink-0">
                    <p className="font-semibold text-sm text-green-700">${amount.toFixed(2)}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(order.createdAt).toLocaleTimeString("es-ES", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default memo(RecentOrders);
