import {Truck} from 'lucide-react';
export function DeliveryNotice() {
  return <div className="flex min-h-9 items-center justify-center gap-2 bg-[#081b10] px-4 py-2 text-center text-xs text-white"><Truck aria-hidden="true" className="h-4 w-4 shrink-0 text-[#9df477]"/><span><strong>Envío GRATIS en Guayaquil</strong><span aria-hidden="true"> · </span>Entrega en 24 horas</span></div>;
}
