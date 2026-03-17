export interface Product {
  id: string;
  slug: string;
  name: string;
  nameEn?: string;
  description: string;
  image: string;
  priceOneTime: number;
  priceSubscription: number;
  stripePriceIdOneTime?: string;
  stripePriceIdSubscription?: string;
  whyRecommend: string;
  family: "awaken" | "detox" | "nutrir" | "restaurar" | "vital" | "plan";
}

const defaultWhy =
  "Recomendado por tu nutrióloga para apoyar tu plan de alimentación y bienestar integral.";

function p(
  id: string,
  name: string,
  nameEn: string | undefined,
  price: number,
  family: Product["family"],
  description: string,
  whyRecommend: string = defaultWhy,
  image: string = "/logo.png"
): Product {
  const slug = id.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const sub = Math.round(price * 0.9);
  return {
    id,
    slug,
    name,
    nameEn,
    description,
    image,
    priceOneTime: price,
    priceSubscription: sub,
    whyRecommend,
    family,
  };
}

/** Familias visibles en la tienda (excluimos "plan", que es solo para checkout desde Solicitar plan). */
export const PRODUCT_FAMILIES: {
  id: Product["family"];
  name: string;
  nameEn: string;
  /** Imagen de la familia para la portada de la tienda (opcional). */
  image?: string;
  /** Descripción corta de la familia (sustituye "X productos" cuando existe). */
  description?: string;
}[] = [
  {
    id: "awaken",
    name: "Familia Awaken",
    nameEn: "Familia Awaken",
    image: "/tienda/familias/awaken.png",
    description:
      "Enciende tu día con energía, concentración y claridad. Desde cafés funcionales hasta suplementos de rendimiento, Awaken te ayuda a empezar con fuerza y mantenerte alerta.",
  },
  {
    id: "detox",
    name: "Familia Detox",
    nameEn: "Familia Detox",
    image: "/tienda/familias/detox.png",
    description:
      "Revitaliza tu sistema y apoya el equilibrio desde adentro. La Colección Detox combina mezclas específicas para ayudar a tu cuerpo a limpiar, reiniciar y sentirse renovado.",
  },
  { id: "nutrir", name: "Nutrir a la familia", nameEn: "Nutrir a la familia", image: "/tienda/familias/nutrir.png" },
  { id: "restaurar", name: "Restaurar a la familia", nameEn: "Restaurar a la familia", image: "/tienda/familias/restaurar.png" },
  { id: "plan", name: "Plan dieta", nameEn: "Diet plan" },
];

export const PRODUCTS: Product[] = [
  // Familia Awaken (7 productos) – imágenes en /tienda/productos/ en el orden enviado
  p(
    "v-lovkafe",
    "V-LOVKAFE",
    "Lovkafe",
    67500,
    "awaken",
    "Café con Tongkat Ali y Shilajit para vitalidad, resistencia y equilibrio hormonal.",
    "Promueve la energía natural y el equilibrio hormonal; favorece el estado de ánimo, la libido y la resistencia; fomenta la resistencia al estrés y la durabilidad. Ideal para quienes buscan vitalidad y apoyo hormonal.",
    "/tienda/productos/v-lovkafe.png"
  ),
  p(
    "v-neurokafe",
    "V-NEUROKAFE",
    "Neurokafe",
    67500,
    "awaken",
    "Café adaptogénico con ganoderma, nootrópicos y probióticos para concentración y armonía intestino-cerebro.",
    "Favorece la claridad mental y el estado de ánimo; promueve el equilibrio del eje intestino-cerebro con probióticos; aumenta la energía y la productividad sin sobreestimulación. Para niebla cerebral, concentración y café funcional que alimenta mente y cuerpo.",
    "/tienda/productos/v-neurokafe.png"
  ),
  p(
    "v-thermokafe",
    "V-THERMOKAFE",
    "Thermokafe",
    67500,
    "awaken",
    "Café termogénico con guaraná y hierbas para activar el metabolismo, digestión y quema de grasa natural.",
    "Favorece un ritmo metabólico saludable y la termogénesis; favorece la digestión y la regulación natural del apetito; favorece el mantenimiento de la energía y el metabolismo de las grasas. Para control de peso y estímulo metabólico matutino.",
    "/tienda/productos/v-thermokafe.png"
  ),
  p(
    "v-nitro",
    "V-NITRO",
    "Nitro",
    90000,
    "awaken",
    "Vasodilatadores naturales (remolacha, espinaca roja) para óxido nítrico, circulación, resistencia y recuperación.",
    "Apoya la oxigenación y el flujo sanguíneo para energía y resistencia; promueve la absorción de nutrientes y la salud mitocondrial; fomenta la resistencia, la recuperación y el rendimiento. Para atletas, personas activas o quienes buscan mejor circulación y energía celular.",
    "/tienda/productos/v-nitro.png"
  ),
  p(
    "v-nrgy",
    "V-NRGY",
    "Vnrgy",
    60000,
    "awaken",
    "Fórmula de energía limpia con nootrópicos, adaptógenos y nutrientes para concentración y claridad mental.",
    "Aumenta la concentración mental, la claridad y la motivación; aporta energía natural sin nerviosismo ni agotamiento; favorece el estado de ánimo y el equilibrio emocional en situaciones de estrés. Para fatiga, niebla cerebral o falta de motivación.",
    "/tienda/productos/v-nrgy.png"
  ),
  p(
    "vitarly-l",
    "Vitarly-L",
    "Vitarly-L",
    56000,
    "awaken",
    "L-Arginina, zinc, CoQ10, cromo y cafeína para energía, rendimiento físico y vitalidad.",
    "Combate la fatiga y mejora la concentración; potencia la energía y vitalidad diarias; beneficios para rendimiento físico y bienestar. Diseñado para estilos de vida acelerados y deportistas.",
    "/tienda/productos/vitarly-l.png"
  ),
  p(
    "v-ketokafe-bhb",
    "V-KETOKAFE BHB",
    "V-KETOKAFE BHB",
    94000,
    "awaken",
    "Café con cetonas exógenas BHB para apoyo a la cetosis y quema de grasas.",
    "Innovadora mezcla de cetonas exógenas e ingredientes naturales para alcanzar un estado de cetosis y óptima quema de grasas. Café negro tostado con betahidroxibutirato de magnesio, calcio y sodio.",
    "/tienda/productos/v-ketokafe-bhb.png"
  ),
  // Familia Detox
  p(
    "v-tedetox",
    "V-TEDETOX",
    "V-TEDETOX",
    26000,
    "detox",
    "El reajuste diario para la digestión, la desintoxicación y el equilibrio.",
    "Mezcla herbal de acción suave formulada para favorecer las vías naturales de depuración sin golpes fuertes ni molestias. Apoya la digestión, la función hepática, reduce la hinchazón ocasional y mantiene el organismo en movimiento de forma natural.",
    "/tienda/productos/v-tedetox.png"
  ),
  p(
    "v-organex",
    "V-ORGANEX",
    "V-ORGANEX",
    52500,
    "detox",
    "El desintoxicante hepático que apoya la depuración profunda y el equilibrio digestivo.",
    "Combina cardo mariano, guaraná y otros extractos botánicos para favorecer la función hepática, el flujo biliar y los procesos naturales de desintoxicación. También contribuye a una piel más clara y a una digestión equilibrada.",
    "/tienda/productos/v-organex.png"
  ),
  p(
    "v-itaren",
    "V-ITAREN",
    "V-ITAREN",
    52500,
    "detox",
    "Revitalizador renal a base de hierbas que ayuda a limpiar suavemente los riñones y equilibrar los líquidos.",
    "Con gayuba, cola de caballo, moringa y otros extractos que apoyan la función renal y el flujo urinario, ayudan a la desintoxicación y al equilibrio hídrico y reducen la hinchazón y la retención ocasionales.",
    "/tienda/productos/v-itaren.png"
  ),
  // Nutrir a la familia
  p("v-control", "V-CONTROL", "V-CONTROL", 52500, "nutrir", "Soporte de control y balance.", defaultWhy),
  p("colageno-vitalage", "COLÁGENO VITALAGE", "COLÁGENO VITALAGE", 108000, "nutrir", "Colágeno funcional con NAD y astaxantina. Salud articular, piel y energía celular.", "Lo recomiendo para potenciar resultados de dieta con soporte de calidad. NAD y astaxantina respaldan energía y cuidado de la piel; colágeno marino favorece articulaciones y firmeza."),
  p("v-omega-3", "V-OMEGA 3", "V-OMEGA 3", 112500, "nutrir", "Omega 3 para corazón y cerebro.", defaultWhy),
  p("v-tedetox", "V-TEDETOX", "V-TEDETOX", 26000, "nutrir", "Té detox.", defaultWhy),
  // Restaurar a la familia
  p("vitalpro", "VITALPRO", "VITALPRO", 112500, "restaurar", "Proteína y recuperación.", defaultWhy),
  p("v-cuarenta-flora", "V-CUARENTA FLORA", "V-CUARENTA FLORA", 52500, "restaurar", "Probióticos y flora intestinal.", defaultWhy),
  p("v-itadol", "V-ITADOL", "V-ITADOL", 52500, "restaurar", "Soporte articular y bienestar.", defaultWhy),
  // Vital Health
  p(
    "v-glutation-plus",
    "V-GLUTATION PLUS",
    "V-GLUTATION PLUS",
    105000,
    "detox",
    "Glutatión avanzado para desintoxicación celular profunda y protección antioxidante.",
    "Combina glutatión con cofactores como L-Cisteína, Clorofila y Tetrahidrocurcumina para maximizar la defensa antioxidante, apoyar el sistema inmunológico y promover una renovación celular profunda.",
    "/tienda/productos/v-glutation-plus.png"
  ),
  p("v-glutation", "V-GLUTATION", "V-GLUTATION", 125000, "vital", "Glutatión para antioxidación y detox.", defaultWhy),
  p("v-asculax", "V-ASCULAX", "V-ASCULAX", 52500, "vital", "Soporte cardiovascular.", defaultWhy),
  p("v-italay", "V-ITALAY", "V-ITALAY", 52500, "vital", "Bienestar general.", defaultWhy),
  p("v-itaren", "V-ITAREN", "V-ITAREN", 52500, "vital", "Soporte renal y equilibrio.", defaultWhy),
  p("paquete-cero-azucar", "Paquete Cero Azúcar", "Zero Sugar Bundle", 194850, "vital", "Pack especial sin azúcar. Incluye productos seleccionados.", defaultWhy),
  p("paquete-lanzamiento", "Paquete de lanzamiento", "Launch Bundle", 269850, "vital", "Pack de lanzamiento con productos destacados.", defaultWhy),
  p("paquete-detox", "Paquete Detox", "Detox Bundle", 194850, "vital", "Pack detox. Incluye productos de la familia detox.", defaultWhy),
  p("plan-adulto-mayor", "Plan para personas mayores", "Plan Adulto Mayor", 404850, "vital", "Plan completo para adultos mayores. Varios productos incluidos.", defaultWhy),
  p("v-smoothie", "V-SMOOTHIE", "V-SMOOTHIE", 67500, "vital", "Batido nutritivo.", defaultWhy),
  // Plan de dieta (solo checkout desde /consulta, no se muestra en tienda)
  p("plan-dieta-personalizado", "Plan de alimentación 100% personalizado", "Personalized diet plan", 50000, "plan", "Dieta personalizada por tu nutrióloga en menos de 24 h.", defaultWhy),
];

export function getProductBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export function getProductsByFamily(family: Product["family"]): Product[] {
  return PRODUCTS.filter((p) => p.family === family);
}
