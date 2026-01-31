"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  User,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  sendEmailVerification,
  sendPasswordResetEmail,
} from "firebase/auth";
import { auth } from "./firebase";
import { SUPERUSER_EMAIL, SUPERUSER_PASSWORD } from "./superuser";

const DEMO_USER_STORAGE = "avatar_demo_superuser";

/** Usuario demo cuando Firebase no está configurado (superusuario local) */
export interface DemoUser {
  email: string | null;
  uid: string;
  getIdToken: (_forceRefresh?: boolean) => Promise<string>;
}

export type AuthUser = User | DemoUser;

function createDemoUser(): DemoUser {
  return {
    email: SUPERUSER_EMAIL,
    uid: "demo-superuser",
    getIdToken: async () => "demo-superuser",
  };
}

interface AuthContextType {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  resendVerificationEmail: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      if (typeof window !== "undefined" && localStorage.getItem(DEMO_USER_STORAGE) === "1") {
        setUser(createDemoUser());
      }
      setLoading(false);
      return;
    }

    try {
      const unsubscribe = onAuthStateChanged(auth, (authUser) => {
        setUser(authUser);
        setLoading(false);
      }, (error) => {
        console.warn("Auth state error (using temp config):", error);
        setLoading(false);
      });

      return unsubscribe;
    } catch (error) {
      console.warn("Auth initialization error:", error);
      setLoading(false);
    }
  }, []);

  const signIn = async (email: string, password: string) => {
    const isSuperuserCreds = email === SUPERUSER_EMAIL && password === SUPERUSER_PASSWORD;

    if (!auth) {
      if (isSuperuserCreds) {
        if (typeof window !== "undefined") localStorage.setItem(DEMO_USER_STORAGE, "1");
        setUser(createDemoUser());
        return;
      }
      throw new Error("Firebase no está configurado. Usa admin@avatar.com / admin123 para modo demo.");
    }

    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (signInErr: any) {
      const code = signInErr?.code || "";
      const userNotFound = code === "auth/user-not-found" || code === "auth/invalid-credential" || code === "auth/wrong-password";
      if (isSuperuserCreds && userNotFound) {
        await createUserWithEmailAndPassword(auth, SUPERUSER_EMAIL, SUPERUSER_PASSWORD);
        await signInWithEmailAndPassword(auth, SUPERUSER_EMAIL, SUPERUSER_PASSWORD);
      } else {
        throw signInErr;
      }
    }
  };

  const getContinueUrl = () => {
    if (typeof window !== "undefined") return window.location.origin + "/auth";
    return process.env.NEXT_PUBLIC_APP_URL ? `${process.env.NEXT_PUBLIC_APP_URL}/auth` : undefined;
  };

  const signUp = async (email: string, password: string) => {
    if (!auth) {
      throw new Error("Firebase no está configurado. Por favor configura las credenciales reales.");
    }
    await createUserWithEmailAndPassword(auth, email.trim(), password);
    // No se exige verificación de correo: el usuario queda logueado y puede usar la app.
  };

  const resendVerificationEmail = async (email: string, password: string) => {
    if (!auth) {
      throw new Error("Firebase no está configurado.");
    }
    const result = await signInWithEmailAndPassword(auth, email.trim(), password);
    if (result.user.emailVerified) {
      await signOut(auth);
      throw new Error("Tu correo ya está verificado. Puedes iniciar sesión.");
    }
    const continueUrl = getContinueUrl();
    await sendEmailVerification(result.user, continueUrl ? {
      url: continueUrl,
      handleCodeInApp: false,
    } : undefined);
    await signOut(auth);
  };

  const resetPassword = async (email: string) => {
    if (!auth) {
      throw new Error("Firebase no está configurado.");
    }
    await sendPasswordResetEmail(auth, email.trim());
  };

  const signInWithGoogle = async () => {
    if (!auth) {
      throw new Error("Firebase no está configurado. Por favor configura las credenciales reales.");
    }
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => {
    if (typeof window !== "undefined") localStorage.removeItem(DEMO_USER_STORAGE);
    if (!auth) {
      setUser(null);
      window.location.href = "/";
      return;
    }
    await signOut(auth);
    window.location.href = "/";
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, signUp, signInWithGoogle, resetPassword, resendVerificationEmail, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
