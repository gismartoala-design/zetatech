import { Switch, Route } from "wouter";
import Home from "@/pages/Home";
import Shop from "@/pages/Shop";
import CategoryPage from "@/pages/CategoryPage";
import Contact from "@/pages/Contact";
import NotFound from "@/pages/not-found";
import ProductDetails from "@/pages/ProductDetails";
import Checkout from "@/pages/Checkout";
import PaymentGateway from "@/pages/PaymentGateway";
import PaymentResult from "@/pages/PaymentResult";
import DatafastPayment from "@/pages/DatafastPayment";
import Account from "@/pages/Account";
import AccountOrder from "@/pages/AccountOrder";
import { CUSTOMER_PORTAL_ENABLED } from "@/lib/customer-portal";

export function ServerRoutes() {
  return (
    <Switch>
      {/* El portal se declara también aquí para no servir un 404 antes de que
          el navegador tome el control. El servidor no tiene sesión de cliente,
          así que solo dibuja el estado de carga: nada personal se renderiza
          ni se cachea en el HTML. */}
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
