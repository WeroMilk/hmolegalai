import { loadStripe, Stripe } from "@stripe/stripe-js";

let stripePromise: Promise<Stripe | null>;

export const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
    );
  }
  return stripePromise;
};

export async function createCheckoutSession(
  documentId: string,
  price: number,
  saveToAccount?: boolean
): Promise<{ sessionId: string; url: string | null }> {
  const response = await fetch("/api/create-checkout-session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      documentId,
      price: price * 100, // centavos
      saveToAccount: !!saveToAccount,
    }),
  });

  if (!response.ok) {
    throw new Error("Error al crear la sesión de pago");
  }

  const data = await response.json();
  return data;
}
