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
  saveToAccount?: boolean,
  idToken?: string
): Promise<{ sessionId: string; url: string | null }> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (idToken) {
    headers.Authorization = `Bearer ${idToken}`;
  }

  const body = {
    documentId,
    price: price * 100, // centavos
    saveToAccount: !!saveToAccount,
    ...(idToken ? { idToken } : {}),
  };
  const response = await fetch("/api/create-checkout-session", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const data = await response.json().catch(() => ({}));
    throw new Error(data?.error || "Error al crear la sesión de pago");
  }

  const data = await response.json();
  return data;
}
