import { useEffect, useRef, useState } from "react";
import { Link } from "wouter";
import { Seo } from "@/components/Seo";

export default function DatafastPayment() {
  const container = useRef<HTMLDivElement>(null);
  const [error, setError] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  useEffect(() => {
    let script: HTMLScriptElement | undefined;
    let validations: HTMLScriptElement | undefined;
    try {
      const session = JSON.parse(sessionStorage.getItem("zetatech_datafast_session") || "null");
      const widget = new URL(session?.widgetUrl);
      if (!["https://eu-test.oppwa.com", "https://eu-prod.oppwa.com"].includes(widget.origin) || widget.pathname !== "/v1/paymentWidgets.js" || widget.searchParams.get("checkoutId") !== session.checkoutId) throw new Error("La sesión de Datafast no es válida. Vuelve al checkout.");
      setOrderNumber(session.orderNumber);
      const form = document.createElement("form");
      form.action = `${window.location.origin}/payment-result?provider=datafast`;
      form.className = "paymentWidgets";
      form.dataset.brands = "VISA MASTER AMEX DINERS DISCOVER";
      container.current?.replaceChildren(form);
      validations = document.createElement("script");
      validations.src = "https://www.datafast.com.ec/js/dfAdditionalValidations1.js";
      validations.onerror = () => setError("No se pudo cargar Datafast. Vuelve al checkout para elegir otro método.");
      document.body.appendChild(validations);
      script = document.createElement("script"); script.src = widget.href;
      script.onerror = () => setError("No se pudo cargar el formulario de Datafast.");
      document.body.appendChild(script);
    } catch { setError("No encontramos una sesión de Datafast válida. Vuelve al checkout."); }
    return () => { script?.remove(); validations?.remove(); container.current?.replaceChildren(); };
  }, []);
  return <main className="mx-auto min-h-screen max-w-xl px-5 py-12">
    <Seo title="Pago con Datafast | Zetatech" description="Completa el pago seguro de tu pedido." path="/datafast-payment" robots="noindex, nofollow" />
    <h1 className="mb-3 text-2xl font-bold">Pago con Datafast</h1><p className="mb-6 text-sm">Pedido {orderNumber}. Ingresa los datos de la tarjeta en el formulario seguro.</p>
    {error ? <p role="alert" className="mb-5 rounded-xl bg-red-50 p-4 text-sm text-red-700">{error}</p> : <div ref={container} />}
    <Link href="/checkout" className="ui-btn-secondary mt-6">Volver al checkout</Link>
  </main>;
}
