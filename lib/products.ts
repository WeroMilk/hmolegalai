export interface Product {
  id: string;
  slug: string;
  name: string;
  description: string;
  image: string;
  priceOneTime: number;
  priceSubscription: number;
  stripePriceIdOneTime?: string;
  stripePriceIdSubscription?: string;
  whyRecommend: string;
}

export const PRODUCTS: Product[] = [
  {
    id: "vitalage",
    slug: "vitalage",
    name: "VITALAGE",
    description:
      "Colágeno funcional con NAD y astaxantina. Ayuda a la salud articular, la piel y la energía celular. Formulación premium para resultados visibles.",
    image: "/logo.png",
    priceOneTime: 108000,
    priceSubscription: 97200,
    whyRecommend:
      "Lo recomiendo a mis pacientes que buscan potenciar sus resultados de dieta con un soporte de calidad. El NAD y la astaxantina respaldan la energía y el cuidado de la piel; el colágeno marino favorece articulaciones y firmeza. Es un complemento que encaja con objetivos de bienestar integral y antienvejecimiento.",
  },
];

export function getProductBySlug(slug: string): Product | undefined {
  return PRODUCTS.find((p) => p.slug === slug);
}

export function getProductById(id: string): Product | undefined {
  return PRODUCTS.find((p) => p.id === id);
}
