import { lazy } from "react";
import { Switch, Route } from "wouter";
import Home from "@/pages/Home";
import { CUSTOMER_PORTAL_ENABLED } from "@/lib/customer-portal";

const Shop = lazy(() => import("@/pages/Shop"));
const CategoryPage = lazy(() => import("@/pages/CategoryPage"));
const ProductDetails = lazy(() => import("@/pages/ProductDetails"));
const Contact = lazy(() => import("@/pages/Contact"));
const NotFound = lazy(() => import("@/pages/not-found"));
const Checkout = lazy(() => import("@/pages/Checkout"));
const PaymentGateway = lazy(() => import("@/pages/PaymentGateway"));
const PaymentResult = lazy(() => import("@/pages/PaymentResult"));
const DatafastPayment = lazy(() => import("@/pages/DatafastPayment"));
const Account = lazy(() => import("@/pages/Account"));
const AccountOrder = lazy(() => import("@/pages/AccountOrder"));

export function BrowserRoutes() {
  return (
    <Switch>
      {/* Portal de clientes: construido, pero sin enlazar desde la tienda
          hasta que se encienda VITE_CUSTOMER_PORTAL. Apagado, estas rutas no
          existen y /mi-cuenta cae en la página de no encontrado. */}
      {CUSTOMER_PORTAL_ENABLED && <Route path="/mi-cuenta" component={Account} />}
      {CUSTOMER_PORTAL_ENABLED && <Route path="/mi-cuenta/:orderNumber" component={AccountOrder} />}
      <Route path="/" component={Home} />
      <Route path="/shop" component={Shop} />
      <Route path="/categoria/:slug" component={CategoryPage} />
      <Route path="/producto/:slug" component={ProductDetails} />
      <Route path="/product/:id" component={ProductDetails} />
      <Route path="/contacto" component={Contact} />
      <Route path="/checkout" component={Checkout} />
      <Route path="/payment-gateway" component={PaymentGateway} />
      <Route path="/payment-result" component={PaymentResult} />
      <Route path="/datafast-payment" component={DatafastPayment} />
      <Route component={NotFound} />
    </Switch>
  );
}
