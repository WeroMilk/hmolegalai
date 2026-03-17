"use client";

import { Suspense, useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter, useSearchParams } from "next/navigation";
import { useI18n } from "@/lib/i18n-context";
import { isFirebaseConfigured } from "@/lib/firebase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import { motion } from "framer-motion";
import { Mail, Lock, LogIn, Settings } from "lucide-react";
import { auth } from "@/lib/firebase";
import { isDidiUser } from "@/lib/didi";
import { isSuperUser } from "@/lib/superuser";

function AuthPageContent() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const { signIn, resetPassword } = useAuth();
  const { t } = useI18n();
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get("returnTo");

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

  const friendlyAuthError = (msg: string, fallback: string) => {
    if (!msg || typeof msg !== "string") return fallback;
    const raw = msg.trim();
    if (/Firebase|auth\/|invalid-credential|user-not-found|wrong-password/i.test(raw)) {
      return "Usuario no encontrado o contraseña incorrecta.";
    }
    if (/too-many-requests/i.test(raw)) return "Demasiados intentos. Intenta más tarde.";
    return raw;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!isValidEmail(email)) {
      setError(t("auth_invalid_email"));
      return;
    }
    if (password.length < 6) {
      setError(t("auth_password_min"));
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      const currentUser = auth?.currentUser ?? null;
      const token = currentUser ? await currentUser.getIdToken() : null;
      if (token && (isDidiUser(email) || isSuperUser(email))) {
        await fetch("/api/user-profile", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ role: "cliente" }),
        });
      }
      const target = returnTo && returnTo.startsWith("/") ? returnTo : "/admin";
      router.replace(target);
    } catch (err: unknown) {
      setError(friendlyAuthError(err instanceof Error ? err.message : "", t("auth_error")));
    } finally {
      setLoading(false);
    }
  };

  const [mounted, setMounted] = useState(false);
  const firebaseReady = isFirebaseConfigured();

  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen text-foreground">
      <Navbar />
      <main id="main" className="flex justify-center items-start min-h-screen px-3 xs:px-4 sm:px-6 pt-40 xs:pt-44 sm:pt-28 md:pt-32 pb-10 xs:pb-12 sm:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md space-y-4"
        >
          {mounted && !firebaseReady && (
            <div className="glass-effect p-4 sm:p-5 rounded-xl border border-amber-500/50 bg-amber-500/10">
              <div className="flex items-start gap-3">
                <Settings className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                <div className="space-y-3 text-sm min-w-0">
                  <h3 className="font-semibold text-foreground">{t("auth_firebase_setup_title")}</h3>
                  <p className="text-muted text-xs">{t("auth_firebase_setup_desc")}</p>
                  <div className="flex flex-wrap gap-2 pt-1">
                    <a
                      href="https://console.firebase.google.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      → {t("auth_firebase_link_firebase")}
                    </a>
                    <span className="text-border">|</span>
                    <a
                      href="https://vercel.com/dashboard"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400 hover:underline"
                    >
                      → {t("auth_firebase_link_vercel")}
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="glass-effect hover-box hover-box-no-lift p-6 sm:p-8 rounded-xl border border-teal-500/40 w-full">
            <h1 className="hover-title block w-full text-2xl sm:text-3xl md:text-4xl font-bold mb-2 sm:mb-3 text-center text-foreground">
              Acceso administrador
            </h1>
            <p className="text-muted text-center mb-6 sm:mb-8 md:mb-10 text-sm sm:text-base md:text-lg">
              Inicia sesión para ver solicitudes de dietas y órdenes pagadas.
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 md:space-y-6">
              <div>
                <label htmlFor="auth-email" className="block text-sm font-medium mb-2 flex items-center text-foreground">
                  <Mail className="w-4 h-4 mr-2" />
                  {t("auth_email")}
                </label>
                <Input
                  id="auth-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder={t("auth_placeholder_email")}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label htmlFor="auth-password" className="block text-sm font-medium flex items-center text-foreground">
                    <Lock className="w-4 h-4 mr-2" />
                    {t("auth_password")}
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowForgotPassword(true);
                      setError("");
                      setResetSent(false);
                    }}
                    className="text-xs text-teal-500 hover:text-teal-400"
                  >
                    {t("auth_forgot_password")}
                  </button>
                </div>
                <Input
                  id="auth-password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>

              {showForgotPassword && (
                <div className="p-3 rounded-lg bg-teal-500/10 border border-teal-500/30">
                  {resetSent ? (
                    <p className="text-sm text-foreground">{t("auth_reset_sent")}</p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-muted">{t("auth_placeholder_email")}</p>
                      <div className="flex gap-2">
                        <Input
                          id="auth-reset-email"
                          name="resetEmail"
                          type="email"
                          autoComplete="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder={t("auth_placeholder_email")}
                          className="flex-1"
                          aria-label={t("auth_email")}
                        />
                        <Button
                          type="button"
                          size="sm"
                          disabled={loading || !isValidEmail(email)}
                          onClick={async () => {
                            if (!isValidEmail(email)) {
                              setError(t("auth_invalid_email"));
                              return;
                            }
                            setLoading(true);
                            setError("");
                            try {
                              await resetPassword(email);
                              setResetSent(true);
                            } catch (err: unknown) {
                              setError(friendlyAuthError(err instanceof Error ? err.message : "", t("auth_error")));
                            } finally {
                              setLoading(false);
                            }
                          }}
                        >
                          {t("auth_reset_send")}
                        </Button>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setShowForgotPassword(false); setError(""); }}
                        className="text-xs text-muted hover:text-foreground"
                      >
                        Cancelar
                      </button>
                    </div>
                  )}
                </div>
              )}

              <Button
                type="submit"
                className="w-full i18n-stable-btn flex items-center justify-center min-w-[12rem]"
                disabled={loading}
              >
                {loading ? (
                  t("auth_loading")
                ) : (
                  <>
                    <LogIn className="w-4 h-4 mr-2 inline-block align-middle" />
                    <span className="inline-block align-middle">{t("auth_sign_in")}</span>
                  </>
                )}
              </Button>
            </form>
          </div>
        </motion.div>
      </main>
    </div>
  );
}

function AuthPageFallback() {
  return (
    <div className="min-h-screen text-foreground">
      <Navbar />
      <div className="flex justify-center items-center min-h-screen pt-24">
        <p className="text-muted">Cargando...</p>
      </div>
    </div>
  );
}

export default function AuthPage() {
  return (
    <Suspense fallback={<AuthPageFallback />}>
      <AuthPageContent />
    </Suspense>
  );
}
