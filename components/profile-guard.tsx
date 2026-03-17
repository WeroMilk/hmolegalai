"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useUserProfile } from "@/lib/use-user-profile";

function skipProfileCheck(pathname: string): boolean {
  if (pathname === "/" || pathname.startsWith("/auth")) return true;
  if (pathname === "/consulta" || pathname.startsWith("/tienda")) return true;
  if (pathname === "/didi" || pathname === "/admin") return true;
  return false;
}

export function ProfileGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();
  const { profile, loading } = useUserProfile();

  useEffect(() => {
    if (!user || loading || skipProfileCheck(pathname)) return;
    if (!profile?.role) {
      router.replace("/auth/complete-profile");
    }
  }, [user, profile, loading, pathname, router]);

  return <>{children}</>;
}
