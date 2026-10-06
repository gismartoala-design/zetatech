import { AlertCircle } from "lucide-react";
import { Link } from "wouter";
import { Seo } from "@/components/Seo";

export default function NotFound() {
  return (
    <div className="page-shell flex items-center justify-center">
      <Seo
        title="Página no encontrada | Zetatech"
        description="La página solicitada no existe."
        robots="noindex, nofollow"
      />
      <div className="empty-state w-full max-w-lg">
        <AlertCircle className="mx-auto mb-5 h-12 w-12 text-accent" />
        <h1 className="section-title">Página no encontrada</h1>
        <p className="section-copy mb-8">
          La ruta solicitada no existe o fue retirada de la tienda.
        </p>
        <Link href="/" className="ui-btn-primary">
          Volver al inicio
        </Link>
      </div>
    </div>
  );
}
