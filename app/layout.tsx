import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Footer } from "@/components/footer";

export const metadata: Metadata = {
  title: "Avatar Legal AI",
  description: "Avatar Legal AI — Genera documentos legales profesionales utilizando inteligencia artificial",
  keywords: "documentos legales, IA, inteligencia artificial, contratos, documentos, Avatar Legal AI",
  icons: {
    icon: "/logo.png",
    apple: "/logo.png",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  minimumScale: 0.85,
  maximumScale: 5,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className="dark theme-transition" suppressHydrationWarning>
      <body className="antialiased bg-background text-foreground min-h-screen overflow-x-hidden overflow-y-auto">
        <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-blue-200/25 dark:to-blue-950/20" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(59,130,246,0.1),transparent_50%)]" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl animate-pulse [animation-delay:1000ms]" />
        </div>
        <div className="relative z-10">
          <Providers>
            {children}
            <Footer />
          </Providers>
        </div>
      </body>
    </html>
  );
}
