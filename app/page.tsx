"use client";

import { Hero } from "@/components/hero";
import { Features } from "@/components/features";
import { AboutSection } from "@/components/about-section";
import { FAQSection } from "@/components/faq-section";
import { Navbar } from "@/components/navbar";

export default function Home() {
  return (
    <main className="min-h-screen text-foreground w-full min-w-0 max-w-full">
      <Navbar />

      <div>
        <Hero />
        <Features />
        <AboutSection />
        <FAQSection />
      </div>
    </main>
  );
}
