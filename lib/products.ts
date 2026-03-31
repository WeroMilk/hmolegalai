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
  /** Descripción completa (p. ej. en la página de la familia). */
  description?: string;
  /** Resumen para la portada de la tienda (sin truncar). */
  shortDescription?: string;
}[] = [
  {
    id: "awaken",
    name: "Familia Awaken",
    nameEn: "Familia Awaken",
    image: "/tienda/familias/awaken.png",
    description:
      "Enciende tu día con energía, concentración y claridad. Desde cafés funcionales hasta suplementos de rendimiento, Awaken te ayuda a empezar con fuerza y mantenerte alerta.",
    shortDescription: "Energía, concentración y claridad. Cafés funcionales y suplementos de rendimiento.",
  },
  {
    id: "detox",
    name: "Familia Detox",
    nameEn: "Familia Detox",
    image: "/tienda/familias/detox.png",
    description:
      "Revitaliza tu sistema y apoya el equilibrio desde adentro. La Colección Detox combina mezclas específicas para ayudar a tu cuerpo a limpiar, reiniciar y sentirse renovado.",
    shortDescription: "Revitaliza tu sistema y apoya el equilibrio. Mezclas para limpiar y renovar.",
  },
  {
    id: "nutrir",
    name: "Nutrir a la familia",
    nameEn: "Nutrir a la familia",
    image: "/tienda/familias/nutrir.png",
    description:
      "Dale a tu cuerpo el cuidado diario que se merece. La colección Nourish proporciona nutrientes esenciales y bienestar fundamental para ayudarte a prosperar cada día.",
    shortDescription: "Cuidado diario y nutrientes esenciales para prosperar cada día.",
  },
  {
    id: "restaurar",
    name: "Restaurar a la familia",
    nameEn: "Restaurar a la familia",
    image: "/tienda/familias/restaurar.png",
    description:
      "Encuentre el equilibrio, la fuerza y la renovación. La colección Restore está pensada para favorecer la recuperación, la resistencia y la vitalidad en general, para que te sientas lo mejor posible.",
    shortDescription: "Equilibrio, fuerza y renovación. Recuperación y vitalidad.",
  },
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
  p(
    "colageno-vitalage",
    "VITALAGE COLLAGEN",
    "Vitalage Collagen",
    108000,
    "nutrir",
    "La mezcla de brillo y movilidad: colágeno hidrolizado con nutrientes para piel, articulaciones y microbioma.",
    "Combina péptidos hidrolizados con nutrientes intestinales y de apoyo a los tejidos para restaurar la elasticidad de la piel, fortalecer las articulaciones, apoyar la salud del microbioma y la luminosidad interna. Favorece la salud de las articulaciones, la piel y el tejido conjuntivo; la elasticidad y los signos visibles del envejecimiento; la reparación intestinal y la resistencia de los tejidos internos.",
    "/tienda/productos/colageno-vitalage.png"
  ),
  p(
    "v-daily",
    "V-Daily",
    "V-Daily",
    120000,
    "nutrir",
    "Multi-Vitamin Powder con vitaminas, minerales, inositol y prebióticos. Sabor limón, rápida absorción.",
    "Fórmula que combina vitaminas A, C, D3 y E con extractos naturales para reforzar el sistema inmunitario y combatir el estrés oxidativo. Complejo B para energía, metabolismo y concentración; inositol para el equilibrio del sistema nervioso. Minerales para huesos y músculos; inulina y prebióticos para la digestión. Sin azúcares añadidos, máxima biodisponibilidad.",
    "/tienda/productos/v-daily.png"
  ),
  p(
    "v-omega-3",
    "V-OMEGA 3",
    "V-Omega 3",
    112500,
    "nutrir",
    "Omegas de alta calidad para cerebro, piel y corazón. Astaxantina, vitaminas A, D3, E y aceite de salmón.",
    "Proporciona ácidos grasos esenciales para apoyar la salud cerebral, cutánea y cardiovascular, con respuesta inflamatoria saludable y claridad cognitiva. Apoya el rendimiento del cerebro, el estado de ánimo y el sistema nervioso; promueve la salud cardiovascular y la circulación; nutre la piel, las articulaciones y el equilibrio de la inflamación.",
    "/tienda/productos/v-omega-3.png"
  ),
  p(
    "vitalpro",
    "VITALPRO",
    "Vitalpro",
    112500,
    "nutrir",
    "Proteína en polvo enriquecida con vegetales, frutas, omega 3 y antioxidantes. Sabor vainilla.",
    "Fórmula con aislado de suero y soya, péptidos de colágeno, inulina de agave, mezcla de vegetales y frutas VitalHealth, cordyceps, mangostán, maqui, ganoderma, shiitake, cúrcuma, omega 3, CoQ10 y más. Potencia la energía y la vitalidad con ingredientes naturales de alta biodisponibilidad.",
    "/tienda/productos/vitalpro.png"
  ),
  // Restaurar a la familia
  p(
    "v-asculax",
    "V-ASCULAX",
    "Asculax",
    52500,
    "restaurar",
    "El potenciador del flujo: MSM, romero, cola de caballo para drenaje linfático y salud vascular.",
    "Combina MSM, romero, cola de caballo y otros ingredientes botánicos para ayudar al drenaje linfático, apoyar la salud vascular y promover la integridad de la piel, el tejido conectivo y la circulación. Fomenta un flujo linfático y circulación saludables; apoya la vitalidad de la piel y los tejidos; promueve el alivio de la hinchazón o el estancamiento ocasionales.",
    "/tienda/productos/v-asculax.png"
  ),
  p(
    "v-itadol",
    "V-ITADOL",
    "Itadol",
    52500,
    "restaurar",
    "El apoyo para el malestar y la movilidad. Glucosamina y MSM para bienestar articular y muscular.",
    "Contiene glucosamina y MSM que contribuyen al bienestar articular y muscular, mejoran la flexibilidad y favorecen un flujo sanguíneo y una respuesta inflamatoria saludables. Favorece el confort articular y muscular; la movilidad y flexibilidad; la circulación, la recuperación de los tejidos y la salud de la sangre.",
    "/tienda/productos/v-itadol.png"
  ),
  p(
    "v-curcumax",
    "V-CURCUMAX",
    "V-Curcumax",
    63000,
    "restaurar",
    "Cúrcuma, MSM, vitamina C y selenio para articulaciones, inflamación e inmunidad.",
    "Fórmula avanzada con cúrcuma, MSM, vitamina C y selenio que actúan conjuntamente para favorecer la salud de las articulaciones y reducir la inflamación, reforzar el sistema inmunitario y proteger las células del daño oxidativo. Óptima absorción y beneficios para el bienestar general y la movilidad articular.",
    "/tienda/productos/v-curcumax.png"
  ),
  p(
    "v-cuarenta-flora",
    "V-FORTYFLORA",
    "Fortyflora",
    52500,
    "restaurar",
    "El reequilibrador y alcalinizador intestinal. Magnesio, calcio y carbón activado.",
    "Combina minerales esenciales, carbón activado y agentes alcalinizantes para neutralizar la acidez, reequilibrar el entorno intestinal y promover una eliminación saludable. Favorece el equilibrio intestinal y el bienestar digestivo; ayuda a neutralizar la acidez y el equilibrio del pH; apoya la eliminación de toxinas y la regularidad intestinal.",
    "/tienda/productos/v-cuarenta-flora.png"
  ),
  p(
    "v-italay",
    "V-ITALAY",
    "Italay",
    52500,
    "restaurar",
    "El maestro zen: valeriana, pasiflora y té verde para calma, sueño y concentración.",
    "Formulado con ingredientes botánicos calmantes como la raíz de valeriana y la flor de la pasión para apoyar el sistema nervioso, mejorar el descanso y ayudar a regular la concentración mental y el equilibrio sensorial. Apoya un sistema nervioso tranquilo; favorece un sueño reparador y la regulación del estrés; promueve la concentración y la estabilidad del estado de ánimo.",
    "/tienda/productos/v-italay.png"
  ),
  p(
    "v-control",
    "V-CONTROL",
    "Control",
    52500,
    "restaurar",
    "El estabilizador suprarrenal y del hambre. Bálsamo de limón, espirulina, acerola, nopal.",
    "Combina adaptógenos, nutrientes y botánicos como el bálsamo de limón, espirulina, acerola e higo chumbo que ayudan a mantener la energía equilibrada, el azúcar en sangre y el estado de ánimo, y apoyan suavemente los órganos de desintoxicación. Ayuda a mantener un nivel saludable de azúcar en sangre y de ansiedad por la comida; a equilibrar el estado de ánimo y el sistema nervioso; favorece la salud suprarrenal y la desintoxicación.",
    "/tienda/productos/v-control.png"
  ),
  p(
    "v-glutation",
    "V-GLUTATION",
    "Glutation",
    125000,
    "restaurar",
    "El antioxidante fundamental. Glutatión con cúrcuma y escaramujo para detox e inmunidad.",
    "Ofrece una dosis pura de glutatión junto con ingredientes sinérgicos como la cúrcuma y el escaramujo para promover la actividad antioxidante, fortalecer el sistema inmunitario y apoyar la desintoxicación. Apoya los procesos naturales de desintoxicación; favorece la reparación celular y la resistencia inmunitaria; promueve una respuesta inflamatoria saludable y una respuesta al estrés oxidativo.",
    "/tienda/productos/v-glutation.png"
  ),
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
  p("v-itaren", "V-ITAREN", "V-ITAREN", 52500, "vital", "Soporte renal y equilibrio.", defaultWhy),
  p("paquete-cero-azucar", "Paquete Cero Azúcar", "Zero Sugar Bundle", 194850, "vital", "Pack especial sin azúcar. Incluye productos seleccionados.", defaultWhy),
  p("paquete-lanzamiento", "Paquete de lanzamiento", "Launch Bundle", 269850, "vital", "Pack de lanzamiento con productos destacados.", defaultWhy),
  p("paquete-detox", "Paquete Detox", "Detox Bundle", 194850, "vital", "Pack detox. Incluye productos de la familia detox.", defaultWhy),
  p("plan-adulto-mayor", "Plan para personas mayores", "Plan Adulto Mayor", 404850, "vital", "Plan completo para adultos mayores. Varios productos incluidos.", defaultWhy),
  p("v-smoothie", "V-SMOOTHIE", "V-SMOOTHIE", 67500, "vital", "Batido nutritivo.", defaultWhy),
  // Planes de dieta (solo checkout desde /consulta; no se muestran en tienda)
  p("plan-dieta-semanal", "Plan de dieta — Semanal", "Weekly diet plan", 39900, "plan", "Dieta personalizada por 1 semana. Entrega en menos de 24 h.", defaultWhy),
  p("plan-dieta-quincenal", "Plan de dieta — Quincenal", "Biweekly diet plan", 59900, "plan", "Dieta personalizada por 2 semanas. Entrega en menos de 24 h.", defaultWhy),
  p("plan-dieta-mensual", "Plan de dieta — Mensual", "Monthly diet plan", 99900, "plan", "Dieta personalizada por 1 mes. Entrega en menos de 24 h.", defaultWhy),
];

/** IDs de planes de dieta para uso en consulta y checkout */
export const PLAN_DIETA_IDS = {
  semanal: "plan-dieta-semanal",
  quincenal: "plan-dieta-quincenal",
  mensual: "plan-dieta-mensual",
} as const;
export type PlanDietaKey = keyof typeof PLAN_DIETA_IDS;

export function getProductBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}

export function getProductsByFamily(family: Product["family"]): Product[] {
  return PRODUCTS.filter((p) => p.family === family);
}
