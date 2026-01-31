"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  PaymentElement,
  useStripe,
  useElements,
  Elements,
} from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { useTheme } from "@/lib/theme-context";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || ""
);

interface PaymentFormInnerProps {
  clientSecret: string;
  documentId: string;
  saveToAccount: boolean;
  onError: (msg: string) => void;
}

function PaymentFormInner({
  clientSecret,
  documentId,
  saveToAccount,
  onError,
}: PaymentFormInnerProps) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsProcessing(true);
    onError("");

    const returnUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}/documentos/${documentId}/success?save=${saveToAccount ? "1" : "0"}`
        : "";

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: returnUrl,
        receipt_email: undefined,
        payment_method_data: {
          billing_details: {
            address: { country: "MX" },
          },
        },
      },
    });

    if (error) {
      onError(error.message || "Error al procesar el pago");
      setIsProcessing(false);
      return;
    }

    // Pago exitoso sin redirect (tarjeta sin 3DS): redirigir manualmente a success
    const paymentIntentId = clientSecret.split("_secret_")[0];
    const successUrl = `${window.location.origin}/documentos/${documentId}/success?payment_intent=${paymentIntentId}&save=${saveToAccount ? "1" : "0"}`;
    router.push(successUrl);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />
      <Button
        type="submit"
        disabled={!stripe || !elements || isProcessing}
        className="w-full"
        size="lg"
      >
        {isProcessing ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Procesando...
          </>
        ) : (
          "Pagar ahora"
        )}
      </Button>
    </form>
  );
}

interface PaymentFormProps {
  clientSecret: string;
  documentId: string;
  saveToAccount: boolean;
  onError: (msg: string) => void;
}

export function PaymentForm({
  clientSecret,
  documentId,
  saveToAccount,
  onError,
}: PaymentFormProps) {
  const { theme } = useTheme();

  const appearance = {
    theme: theme === "dark" ? ("night" as const) : ("stripe" as const),
    variables: {
      colorPrimary: "#2563eb",
      colorBackground: theme === "dark" ? "#0a0a0a" : "#ffffff",
      textColor: theme === "dark" ? "#fafafa" : "#0f172a",
      colorText: theme === "dark" ? "#fafafa" : "#0f172a",
      colorDanger: "#ef4444",
      borderRadius: "8px",
    },
  };

  const options = {
    clientSecret,
    appearance,
    locale: "es" as const,
  };

  return (
    <Elements stripe={stripePromise} options={options}>
      <PaymentFormInner
        clientSecret={clientSecret}
        documentId={documentId}
        saveToAccount={saveToAccount}
        onError={onError}
      />
    </Elements>
  );
}
