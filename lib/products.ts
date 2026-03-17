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
  whyRecommend: string = defaultWhy
): Product {
  const slug = id.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
  const sub = Math.round(price * 0.9);
  return {
    id,
    slug,
    name,
    nameEn,
    description,
    image: "/logo.png",
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
}[] = [
  { id: "awaken", name: "Familia Awaken", nameEn: "Familia Awaken", image: "/tienda/familias/awaken.png" },
  { id: "detox", name: "Familia Detox", nameEn: "Familia Detox", image: "/tienda/familias/detox.png" },
  { id: "nutrir", name: "Nutrir a la familia", nameEn: "Nutrir a la familia", image: "/tienda/familias/nutrir.png" },
  { id: "restaurar", name: "Restaurar a la familia", nameEn: "Restaurar a la familia", image: "/tienda/familias/restaurar.png" },
  { id: "vital", name: "Vital Health", nameEn: "Vital Health" },
  { id: "plan", name: "Plan dieta", nameEn: "Diet plan" },
];

export const PRODUCTS: Product[] = [
  // Familia Awaken
  p("v-daily", "V-Daily", "V-Daily", 120000, "awaken", "Suplemento diario de bienestar.", defaultWhy),
  p("v-organex", "V-ORGANEX", "V-ORGANEX", 52500, "awaken", "Soporte orgánico y detox.", defaultWhy),
  p("lattekaffe", "LATTEKAFFE", "LATTEKAFFE", 105000, "awaken", "Latte con café funcional.", defaultWhy),
  p("genius-shake", "BATIDO DE GENIO", "GENIUS SHAKE", 105000, "awaken", "Batido nutricional para rendimiento mental.", defaultWhy),
  p("d-fence-kids", "D-FENCE NIÑOS", "D-FENCE KIDS", 60000, "awaken", "Defensas para niños.", defaultWhy),
  p("smartbiotics-kids", "SMARTBIOTICS NIÑOS", "SMARTBIOTICS KIDS", 60000, "awaken", "Probióticos para niños.", defaultWhy),
  p("keto-bhb", "KETO + BHB", "KETO + BHB", 135000, "awaken", "Soporte cetogénico con BHB.", defaultWhy),
  // Familia Detox
  p("v-glucalose", "V-GLUCALOSE", "V-GLUCALOSE", 52500, "detox", "Soporte metabólico y glucosa.", defaultWhy),
  p("v-ketokafe-bhb", "V-KETOKAFE BHB", "V-KETOKAFE BHB", 94000, "detox", "Café funcional con BHB.", defaultWhy),
  p("v-italboost", "V-ITALBOOST", "V-ITALBOOST", 63000, "detox", "Energía y vitalidad.", defaultWhy),
  p("v-curcumax", "V-CURCUMAX", "V-CURCUMAX", 63000, "detox", "Curcumina y bienestar antiinflamatorio.", defaultWhy),
  // Nutrir a la familia (5)
  p("v-control", "V-CONTROL", "V-CONTROL", 52500, "nutrir", "Soporte de control y balance.", defaultWhy),
  p("colageno-vitalage", "COLÁGENO VITALAGE", "COLÁGENO VITALAGE", 108000, "nutrir", "Colágeno funcional con NAD y astaxantina. Salud articular, piel y energía celular.", "Lo recomiendo para potenciar resultados de dieta con soporte de calidad. NAD y astaxantina respaldan energía y cuidado de la piel; colágeno marino favorece articulaciones y firmeza."),
  p("v-nrgy", "V-NRGY", "V-NRGY", 60000, "nutrir", "Energía natural.", defaultWhy),
  p("v-omega-3", "V-OMEGA 3", "V-OMEGA 3", 112500, "nutrir", "Omega 3 para corazón y cerebro.", defaultWhy),
  p("v-tedetox", "V-TEDETOX", "V-TEDETOX", 26000, "nutrir", "Té detox.", defaultWhy),
  // Restaurar a la familia (7)
  p("v-thermokafe", "V-THERMOKAFE", "V-THERMOKAFE", 67500, "restaurar", "Café termogénico.", defaultWhy),
  p("v-nitro", "V-NITRO", "V-NITRO", 90000, "restaurar", "Soporte nitrógeno y rendimiento.", defaultWhy),
  p("v-lovkafe", "V-LOVKAFE", "V-LOVKAFE", 67500, "restaurar", "Café funcional.", defaultWhy),
  p("vitalpro", "VITALPRO", "VITALPRO", 112500, "restaurar", "Proteína y recuperación.", defaultWhy),
  p("v-neurokafe", "V-NEUROKAFE", "V-NEUROKAFE", 67500, "restaurar", "Café para enfoque y claridad mental.", defaultWhy),
  p("v-cuarenta-flora", "V-CUARENTA FLORA", "V-CUARENTA FLORA", 52500, "restaurar", "Probióticos y flora intestinal.", defaultWhy),
  p("v-itadol", "V-ITADOL", "V-ITADOL", 52500, "restaurar", "Soporte articular y bienestar.", defaultWhy),
  // Vital Health (resto)
  p("v-glutation-plus", "V-GLUTATION PLUS", "V-GLUTATION PLUS", 105000, "vital", "Glutatión para detox celular.", defaultWhy),
  p("v-glutation", "V-GLUTATION", "V-GLUTATION", 125000, "vital", "Glutatión para antioxidación y detox.", defaultWhy),
  p("v-asculax", "V-ASCULAX", "V-ASCULAX", 52500, "vital", "Soporte cardiovascular.", defaultWhy),
  p("v-italay", "V-ITALAY", "V-ITALAY", 52500, "vital", "Bienestar general.", defaultWhy),
  p("v-itaren", "V-ITAREN", "V-ITAREN", 52500, "vital", "Soporte renal y equilibrio.", defaultWhy),
  p("vitarly-l", "Vitarly-L", "Vitarly-L", 56000, "vital", "Suplemento Vitarly-L.", defaultWhy),
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
