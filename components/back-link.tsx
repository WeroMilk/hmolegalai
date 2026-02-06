"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";

interface BackLinkProps {
  href: string;
  children: React.ReactNode;
  /** Color: blue (default) o purple (DIDI) */
  variant?: "blue" | "purple";
  className?: string;
}

/** Botón Volver unificado: misma posición en desktop y móvil en toda la app */
export function BackLink({ href, children, variant = "blue", className = "" }: BackLinkProps) {
  const colorClass =
    variant === "purple"
      ? "text-purple-500 hover:text-purple-400"
      : "text-blue-500 hover:text-blue-400";

  return (
    <Link
      href={href}
      className={`inline-flex items-center py-2 min-h-[44px] mb-4 ${colorClass} ${className}`}
    >
      <ArrowLeft className="w-4 h-4 mr-2 shrink-0" aria-hidden />
      {children}
    </Link>
  );
}
