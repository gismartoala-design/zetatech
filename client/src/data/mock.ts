export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: string;
  originalPrice?: string | null;
  discountPercent?: number;
  image: string;
  additionalImages?: string[];
  isBestSeller: boolean;
  /** Posición elegida en el panel. Nulo si aún no se ha ordenado a mano. */
  sortOrder?: number | null;
  stock: number | null;
  deliveryTime: string;
  size: string;
  includes: string;
}

export const TESTIMONIALS = [
  {
    name: "Stalin Espinoza",
    role: "Cliente",
    content: "Muchas Gracias. Felicitaciones, siguen teniendo un excelente servicio.",
    stars: 5
  },
  {
    name: "María Fernanda G.",
    role: "Cliente Frecuente",
    content: "Excelente calidad en los productos y la entrega a domicilio en Guayaquil es impecable.",
    stars: 5
  }
];

export const COMPANY_INFO = {
  description: "Tienda de tecnología con gadgets, accesorios y equipos para trabajar, crear y disfrutar mejor.",
  history: "Zetatech: acercando tecnología útil y confiable a cada persona desde 2024.",
  calidad: "Calidad Garantizada: Productos seleccionados y probados para tu día a día.",
  personalizacion: "Asesoría Zetatech: Te ayudamos a elegir lo que realmente necesitas."
};

export const FAQS = [
  {
    question: "¿Tienen entrega rápida?",
    answer: "Sí, preparamos tu pedido rápidamente y te compartimos el seguimiento del envío."
  },
  {
    question: "¿Los productos tienen garantía?",
    answer: "Sí, cada producto incluye la garantía indicada en su ficha y soporte de nuestro equipo."
  },
  {
    question: "¿Aceptan pagos con tarjeta?",
    answer: "Aceptamos todas las tarjetas de crédito, transferencias y pagos por WhatsApp."
  }
];

export const CONTACT_DETAILS = {
  phone: "+(593) 099 7984 583",
  whatsapp: "+(593) 099 7984 583",
  email: "hello@zetatech.ec",
  address: "Guayaquil, Ecuador"
};
