import { useState } from "react";
import { Link } from "wouter";
import { CheckCircle, Mail, Printer, Download, MessageSquare } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { DEFAULT_COMPANY } from "@/lib/site";

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
  customerNotificationSent?: boolean;
  receipt?: {filename:string;contentType:string;base64:string} | null;
};

export function OrderConfirmation({ details }: { details: ConfirmationDetails }) {
  const [showNotice, setShowNotice] = useState(true);
  const cashOnDelivery = details.paymentMethod === "Contra entrega";
  const coordinateWithSales = details.paymentMethod === 'Coordinar con ventas';
  const emailNotice = details.customerNotificationSent===false
    ? 'Tu pedido está registrado, pero no pudimos enviar el correo. Descarga tu comprobante y conserva el número de pedido para consultar con ventas.'
    : details.email
    ? `Revisa tu correo ${details.email}, incluida la carpeta de spam, para encontrar la confirmación del pedido. Si no llega en unos minutos, contáctanos.`
    : "Puedes consultar la confirmación de tu pedido con nuestro equipo por WhatsApp.";
  const whatsappUrl = `https://wa.me/${DEFAULT_COMPANY.phoneDigits}?text=${encodeURIComponent(
    `Hola, soy ${details.customerName || "cliente"} y quiero coordinar mi pedido ${details.orderNumber}.`,
  )}`;
  const downloadReceipt=()=>{
    if(!details.receipt)return;
    const bytes=Uint8Array.from(atob(details.receipt.base64),char=>char.charCodeAt(0));
    const url=URL.createObjectURL(new Blob([bytes],{type:'application/pdf'}));
    const link=document.createElement('a');link.href=url;link.download=details.receipt.filename;link.click();
    window.setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  return <main className="order-confirmation mx-auto flex min-h-screen max-w-2xl flex-col justify-center px-5 py-12">
    <section className="surface-card p-6 sm:p-9">
      <CheckCircle className="mb-5 h-12 w-12 text-accent" />
      <h1 className="mb-3 text-2xl font-bold">¡Muchas gracias por tu compra!</h1>
      <p className="mb-2 font-semibold">{details.orderNumber}</p>
      <p className="mb-6 text-sm text-foreground/70">{details.paymentStatus === "PAID" ? "Pago aprobado. Tu pedido está confirmado." : coordinateWithSales ? 'Tu pedido quedó registrado. No se ha realizado ningún cobro. Nuestro equipo de ventas te contactará por teléfono o WhatsApp para coordinar contigo la entrega y el pago.' : cashOnDelivery ? "Pedido registrado. Pagarás el monto indicado cuando recibas tu compra." : "Pedido registrado. El pago está pendiente de validación; todavía no figura como pagado."}</p>
      {coordinateWithSales&&<div className="mb-5 rounded-xl border border-accent/20 bg-accent/5 p-4 text-sm"><MessageSquare className="mb-2 h-5 w-5 text-accent"/><strong>¿Qué sigue?</strong><ol className="mt-2 list-decimal space-y-1 pl-5"><li>Conserva tu número de pedido y descarga el comprobante.</li><li>Ventas te contactará en el celular que registraste.</li><li>Acuerden la entrega y la forma de pago antes del despacho.</li></ol></div>}
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
        {details.receipt&&<button type="button" className="ui-btn-primary" onClick={downloadReceipt}><Download className="h-4 w-4"/>Descargar comprobante PDF</button>}
        <a href={whatsappUrl} target="_blank" rel="noopener noreferrer" className="ui-btn-secondary"><MessageSquare className="h-4 w-4" />Coordinar por WhatsApp</a>
        <button type="button" className="ui-btn-secondary" onClick={() => window.print()}><Printer className="h-4 w-4" />Imprimir pedido</button>
        <Link href="/shop" className="ui-btn-primary">Volver a la tienda</Link>
      </div>
    </section>
    <Dialog open={showNotice} onOpenChange={setShowNotice}>
      <DialogContent><DialogHeader><DialogTitle>¡Gracias! Tu pedido está registrado</DialogTitle><DialogDescription>{coordinateWithSales?'Ventas te contactará para coordinar la entrega y el pago. ':''}{emailNotice}</DialogDescription></DialogHeader><button type="button" className="ui-btn-primary" onClick={() => setShowNotice(false)}>Ver mi pedido</button></DialogContent>
    </Dialog>
    <style>{`@media print {body * {visibility:hidden} .order-confirmation,.order-confirmation *{visibility:visible} .order-confirmation{position:absolute;inset:0;display:block;max-width:none;padding:0;min-height:0}.confirmation-actions,.confirmation-actions *{display:none!important}[role=dialog], [role=dialog] *{visibility:hidden!important}}`}</style>
  </main>;
}
