"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { useI18n } from "@/lib/i18n-context";
import { isFirebaseConfigured } from "@/lib/firebase";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/navbar";
import { motion } from "framer-motion";
import Image from "next/image";
import { Mail, Lock, LogIn, UserPlus, Settings } from "lucide-react";

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showVerifyEmail, setShowVerifyEmail] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState("");
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [resendSent, setResendSent] = useState(false);
  const { signIn, signUp, signInWithGoogle, resetPassword, resendVerificationEmail } = useAuth();
  const { t } = useI18n();
  const router = useRouter();

  const isValidEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e.trim());

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
    if (!isLogin && password !== confirmPassword) {
      setError(t("auth_password_mismatch"));
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        router.push("/documentos");
      } else {
        await signUp(email, password);
        setVerifyEmail(email);
        setResendSent(false);
        setShowVerifyEmail(true);
      }
    } catch (err: any) {
      setError(err.message || t("auth_error"));
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");
    try {
      await signInWithGoogle();
      router.push("/documentos");
    } catch (err: any) {
      setError(err.message || t("auth_error_google"));
    } finally {
      setLoading(false);
    }
  };

  const [mounted, setMounted] = useState(false);
  const firebaseReady = isFirebaseConfigured();

  useEffect(() => setMounted(true), []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Navbar />
      <div className="flex justify-center items-start min-h-screen px-3 xs:px-4 sm:px-6 pt-24 xs:pt-28 sm:pt-32 pb-10 xs:pb-12 sm:pb-20">
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
                  <ol className="list-decimal list-inside space-y-1.5 text-muted text-xs leading-relaxed">
                    <li>{t("auth_firebase_setup_step1")}</li>
                    <li>{t("auth_firebase_setup_step2")}</li>
                    <li>{t("auth_firebase_setup_step3")}</li>
                    <li>{t("auth_firebase_setup_step4")}</li>
                    <li>{t("auth_firebase_setup_step5")}</li>
                  </ol>
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
                  <p className="text-amber-600 dark:text-amber-400 text-xs font-medium">{t("auth_firebase_setup_redeploy")}</p>
                </div>
              </div>
            </div>
          )}

          <div className="glass-effect hover-box hover-box-no-lift p-6 sm:p-8 rounded-xl border border-blue-500/40 w-full">
            {showVerifyEmail ? (
              <div className="space-y-4 text-center">
                <div className="w-16 h-16 mx-auto rounded-full bg-green-500/20 flex items-center justify-center">
                  <Mail className="w-8 h-8 text-green-500" />
                </div>
                <h1 className="hover-title text-2xl sm:text-3xl font-bold text-foreground">
                  {t("auth_verify_email_title")}
                </h1>
                <p className="text-muted text-sm sm:text-base">
                  {t("auth_verify_email_desc")}
                </p>
                {error && (
                  <div className="p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm text-left">
                    {error}
                  </div>
                )}
                {resendSent ? (
                  <p className="text-sm text-green-500 font-medium">{t("auth_verify_email_resend_success")}</p>
                ) : (
                  <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/30 text-left space-y-2">
                    <p className="text-sm text-muted">{t("auth_verify_email_resend")}</p>
                    <div className="flex gap-2">
                      <Input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="flex-1"
                      />
                      <Button
                        type="button"
                        size="sm"
                        disabled={loading || password.length < 6}
                        onClick={async () => {
                          setError("");
                          setLoading(true);
                          try {
                            await resendVerificationEmail(verifyEmail, password);
                            setResendSent(true);
                          } catch (err: any) {
                            setError(err.message || t("auth_error"));
                          } finally {
                            setLoading(false);
                          }
                        }}
                      >
                        {loading ? t("auth_loading") : t("auth_reset_send")}
                      </Button>
                    </div>
                  </div>
                )}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => {
                    setShowVerifyEmail(false);
                    setIsLogin(true);
                    setError("");
                    setPassword("");
                  }}
                >
                  {t("auth_verify_email_back")}
                </Button>
              </div>
            ) : (
              <>
            <h1 className="hover-title block w-full text-2xl sm:text-3xl font-bold mb-2 text-center text-foreground">
              {isLogin ? t("auth_sign_in") : t("auth_sign_up")}
            </h1>
            <p className="text-muted text-center mb-6 sm:mb-8 text-sm sm:text-base">
              {isLogin ? t("auth_access_continue") : t("auth_create_begin")}
            </p>

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-400 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center text-foreground">
                  <Mail className="w-4 h-4 mr-2" />
                  {t("auth_email")}
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder={t("auth_placeholder_email")}
                />
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium flex items-center text-foreground">
                    <Lock className="w-4 h-4 mr-2" />
                    {t("auth_password")}
                  </label>
                  {isLogin && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowForgotPassword(true);
                        setError("");
                        setResetSent(false);
                      }}
                      className="text-xs text-blue-500 hover:text-blue-400"
                    >
                      {t("auth_forgot_password")}
                    </button>
                  )}
                </div>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  minLength={6}
                />
              </div>

              {showForgotPassword && (
                <div className="p-3 rounded-lg bg-blue-500/10 border border-blue-500/30">
                  {resetSent ? (
                    <p className="text-sm text-foreground">{t("auth_reset_sent")}</p>
                  ) : (
                    <div className="space-y-2">
                      <p className="text-sm text-muted">{t("auth_placeholder_email")}</p>
                      <div className="flex gap-2">
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder={t("auth_placeholder_email")}
                          className="flex-1"
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
                            } catch (err: any) {
                              setError(err.message || t("auth_error"));
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

              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center text-foreground">
                    <Lock className="w-4 h-4 mr-2" />
                    {t("auth_confirm_password")}
                  </label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required={!isLogin}
                    placeholder="••••••••"
                    minLength={6}
                  />
                </div>
              )}

              <Button
                type="submit"
                className="w-full i18n-stable-btn flex items-center justify-center min-w-[12rem]"
                disabled={loading}
              >
                {loading ? (
                  t("auth_loading")
                ) : isLogin ? (
                  <>
                    <LogIn className="w-4 h-4 mr-2 inline-block align-middle" />
                    <span className="inline-block align-middle">{t("auth_sign_in")}</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 mr-2 inline-block align-middle" />
                    <span className="inline-block align-middle">{t("auth_sign_up")}</span>
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6">
              <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-border" />
                <span className="text-sm text-muted shrink-0 px-2">{t("auth_or_continue")}</span>
                <div className="flex-1 border-t border-border" />
              </div>

              <Button
                variant="outline"
                className="w-full mt-4 flex items-center justify-center gap-2"
                onClick={handleGoogleSignIn}
                disabled={loading || !mounted || !firebaseReady}
              >
                <Image
                  src="/google-g-logo.png"
                  alt="Google"
                  width={20}
                  height={20}
                  className="w-5 h-5"
                />
                <span>{t("auth_google")}</span>
              </Button>
            </div>

            <div className="mt-6 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsLogin(!isLogin);
                  setError("");
                  setConfirmPassword("");
                }}
                className="text-blue-500 hover:text-blue-400 text-sm"
              >
                {isLogin ? t("auth_no_account") : t("auth_has_account")}
              </button>
            </div>
            </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
