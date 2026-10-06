export interface Product {
  id: string;
  name: string;
  description: string;
  category: string;
  price: string;
  image: string;
  additionalImages?: string[];
  isBestSeller: boolean;
  /** Posición elegida en el panel. Nulo si aún no se ha ordenado a mano. */
  sortOrder?: number | null;
  stock: number;
  deliveryTime: string;
  size: string;
  includes: string;
}

/**
 * Catálogo de respaldo para cuando el backend de administración no responde
 * (ver server/index.ts: tryHandlePublicApiFallback). No se muestra si la API
 * de productos funciona con normalidad.
 */
export const INITIAL_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Audífonos Inalámbricos Zetatech Pulse",
    description: "Audífonos in-ear con cancelación de ruido activa, estuche de carga y hasta 30 horas de batería.",
    category: "Audio y Audífonos",
    price: "$89.99",
    image: "/assets/zetatech-audio.jpg",
    additionalImages: ["/assets/zetatech-audio.jpg"],
    isBestSeller: true,
    stock: 24,
    deliveryTime: "2-3 horas",
    size: "Estándar",
    includes: "Audífonos, estuche de carga, cable USB-C y guía rápida."
  },
  {
    id: "2",
    name: "Smartwatch Zetatech Orbit",
    description: "Reloj inteligente con pantalla AMOLED, monitor de ritmo cardíaco y resistencia al agua 5ATM.",
    category: "Smartwatches",
    price: "$199.00",
    image: "/assets/zetatech-watch.jpg",
    additionalImages: ["/assets/zetatech-watch.jpg"],
    isBestSeller: true,
    stock: 15,
    deliveryTime: "2-4 horas",
    size: "42mm",
    includes: "Smartwatch, cargador magnético y correa adicional."
  },
  {
    id: "3",
    name: "Parlante Bluetooth Zetatech Boom",
    description: "Parlante portátil resistente al agua IPX6 con 12 horas de reproducción continua y sonido envolvente.",
    category: "Audio y Audífonos",
    price: "$129.00",
    image: "/assets/zetatech-audio.jpg",
    additionalImages: ["/assets/zetatech-audio.jpg"],
    isBestSeller: false,
    stock: 18,
    deliveryTime: "2-4 horas",
    size: "Compacto",
    includes: "Parlante, cable de carga USB-C y correa de transporte."
  },
  {
    id: "4",
    name: "Mouse Gamer Zetatech Strike",
    description: "Mouse óptico de alta precisión con iluminación RGB configurable y seis botones programables.",
    category: "Gaming",
    price: "$49.99",
    image: "/assets/zetatech-watch.jpg",
    additionalImages: ["/assets/zetatech-watch.jpg"],
    isBestSeller: false,
    stock: 40,
    deliveryTime: "2-3 horas",
    size: "Estándar",
    includes: "Mouse, cable trenzado y pesas de ajuste."
  },
  {
    id: "5",
    name: "Power Bank Zetatech Volt 20000",
    description: "Batería externa de 20000 mAh con carga rápida de 22.5W y dos puertos USB-C simultáneos.",
    category: "Accesorios",
    price: "$34.99",
    image: "/assets/zetatech-audio.jpg",
    additionalImages: ["/assets/zetatech-audio.jpg"],
    isBestSeller: false,
    stock: 50,
    deliveryTime: "2-4 horas",
    size: "Compacto",
    includes: "Power bank y cable USB-C a USB-C."
  },
  {
    id: "6",
    name: "Teclado Mecánico Zetatech Type-X",
    description: "Teclado mecánico compacto con switches táctiles y retroiluminación RGB por tecla.",
    category: "Productividad",
    price: "$79.99",
    image: "/assets/zetatech-watch.jpg",
    additionalImages: ["/assets/zetatech-watch.jpg"],
    isBestSeller: false,
    stock: 22,
    deliveryTime: "2-3 horas",
    size: "Compacto 75%",
    includes: "Teclado, cable USB-C desmontable y keycaps de repuesto."
  }
];

export const SALES_DATA = [
  { month: "Ene", sales: 8500 },
  { month: "Feb", sales: 15200 },
  { month: "Mar", sales: 9800 },
  { month: "Abr", sales: 11100 },
  { month: "May", sales: 18900 },
  { month: "Jun", sales: 10500 },
];

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
