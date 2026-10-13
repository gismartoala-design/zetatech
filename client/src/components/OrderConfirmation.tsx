import { useState } from "react";
import { Link } from "wouter";
import { CheckCircle, Mail, Printer } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export type ConfirmationDetails = {
  orderNumber: string;
  email?: string;
  paymentMethod: string;
  paymentStatus: "PAID" | "PENDING";
  total?: number;
  customerName?: string;
  receiverName?: string;
  address?: string;
  items?: Array<{ productName: string; quantity: number }>;
};

export function OrderConfirmation({ details }: { details: ConfirmationDetails }) {
  const [showNotice, setShowNotice] = useState(true);
  const cashOnDelivery = details.paymentMethod === "Contra entrega";
  const emailNotice = details.email
    ? `Revisa tu correo ${details.email}, incluida la carpeta de spam, para encontrar la confirmación del pedido. Si no llega en unos minutos, contáctanos.`
    : "Puedes consultar la confirmación de tu pedido con nuestro equipo por WhatsApp.";
  return <main className="order-confirmation mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-5 py-12">
    <section className="surface-card p-6 sm:p-9">
      <CheckCircle className="mb-5 h-12 w-12 text-accent" />
      <h1 className="mb-3 text-2xl font-bold">Confirmación de pedido</h1>
      <p className="mb-2 font-semibold">{details.orderNumber}</p>
      <p className="mb-6 text-sm text-foreground/70">{details.paymentStatus === "PAID" ? "Pago aprobado. Tu pedido está confirmado." : cashOnDelivery ? "Pedido registrado. Pagarás el monto indicado cuando recibas tu compra." : "Pedido registrado. El pago está pendiente de validación; todavía no figura como pagado."}</p>
      <dl className="grid grid-cols-2 gap-3 border-y border-border py-4 text-sm">
        <dt>Método de pago</dt><dd className="text-right font-semibold">{details.paymentMethod}</dd>
        {details.total != null && <><dt>{cashOnDelivery ? "Pendiente al recibir" : "Total del pedido"}</dt><dd className="text-right font-bold">${details.total.toFixed(2)}</dd></>}
        {details.customerName && <><dt>Comprador</dt><dd className="text-right">{details.customerName}</dd></>}
        {details.receiverName && <><dt>Recibe</dt><dd className="text-right">{details.receiverName}</dd></>}
        {details.address && <><dt>Entrega</dt><dd className="text-right">{details.address}</dd></>}
      </dl>
      {details.items?.length ? <ul className="my-4 space-y-2 text-sm">{details.items.map((item, i) => <li key={i}>{item.quantity} × {item.productName}</li>)}</ul> : null}
      {cashOnDelivery && <p className="mt-4 text-xs text-foreground/65">Guía de pago contra entrega: comprobante del pedido y del monto por cobrar. La guía de transporte se asignará al despachar.</p>}
      <p className="mt-5 flex items-start gap-2 text-sm"><Mail className="h-4 w-4 shrink-0" />{emailNotice}</p>
      <div className="confirmation-actions mt-6 flex flex-wrap gap-3">
        {cashOnDelivery && <button type="button" className="ui-btn-secondary" onClick={() => window.print()}><Printer className="h-4 w-4" />Imprimir / guardar guía PDF</button>}
        <Link href="/shop" className="ui-btn-primary">Volver a la tienda</Link>
      </div>
    </section>
    <Dialog open={showNotice} onOpenChange={setShowNotice}>
      <DialogContent><DialogHeader><DialogTitle>Pedido registrado</DialogTitle><DialogDescription>{emailNotice}</DialogDescription></DialogHeader><button type="button" className="ui-btn-primary" onClick={() => setShowNotice(false)}>Entendido</button></DialogContent>
    </Dialog>
    <style>{`@media print {body * {visibility:hidden} .order-confirmation,.order-confirmation *{visibility:visible} .order-confirmation{position:absolute;inset:0;display:block;max-width:none;padding:0;min-height:0}.confirmation-actions,.confirmation-actions *{display:none!important}[role=dialog], [role=dialog] *{visibility:hidden!important}}`}</style>
  </main>;
}
