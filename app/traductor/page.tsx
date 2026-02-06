"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useUserProfile } from "@/lib/use-user-profile";
import { useI18n } from "@/lib/i18n-context";
import { isDidiUser } from "@/lib/didi";
import { isSuperUser } from "@/lib/superuser";
import { Navbar } from "@/components/navbar";
import { ArrowLeft, Mic, MicOff, Loader2, Volume2 } from "lucide-react";

type LangPair = "seri-es" | "es-seri" | "en-es" | "es-en";

const PAIRS: { id: LangPair; label: string; labelSeri: string; from: string; to: string }[] = [
  { id: "seri-es", label: "comca'ac → Español", labelSeri: "comca'ac → cocsar iitom", from: "seri", to: "es" },
  { id: "es-seri", label: "Español → comca'ac", labelSeri: "cocsar iitom → comca'ac", from: "es", to: "seri" },
  { id: "en-es", label: "English → Español", labelSeri: "English → cocsar iitom", from: "en", to: "es" },
  { id: "es-en", label: "Español → English", labelSeri: "cocsar iitom → English", from: "es", to: "en" },
];

function useVoiceInput(onResult: (text: string) => void) {
  const [listening, setListening] = useState(false);
  const recRef = useRef<SpeechRecognition | null>(null);

  const startListening = useCallback((lang: "es-MX" | "en-US") => {
    if (typeof window === "undefined") return;
    const API =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognition }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognition }).webkitSpeechRecognition;
    if (!API) return;
    const rec = new API();
    rec.continuous = false;
    rec.interimResults = false;
    rec.lang = lang;
    rec.onresult = (e: SpeechRecognitionEvent) => {
      const t = e.results[e.results.length - 1];
      if (t.isFinal && t.length > 0) onResult(t[0].transcript.trim());
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    rec.start();
    setListening(true);
  }, [onResult]);

  const stopListening = useCallback(() => {
    if (recRef.current) {
      try { recRef.current.stop(); } catch { /* ignore */ }
      recRef.current = null;
    }
    setListening(false);
  }, []);

  return { startListening, stopListening, listening };
}

function useSeriVoiceInput(onResult: (text: string) => void, onError?: (msg: string) => void) {
  const [recording, setRecording] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);

  const startRecording = useCallback(async () => {
    if (typeof window === "undefined") return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
        ? "audio/webm;codecs=opus"
        : "audio/webm";
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mediaRecorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
        const blob = new Blob(chunksRef.current, { type: mimeType });
        if (blob.size < 100) {
          setTranscribing(false);
          return;
        }
        setTranscribing(true);
        try {
          const fd = new FormData();
          fd.append("audio", blob, "audio.webm");
          fd.append("language", "seri");
          const res = await fetch("/api/voice-transcribe", { method: "POST", body: fd });
          const data = await res.json();
          if (res.ok && data.text) {
            onResult(data.text);
          } else {
            onError?.(data.error || "Error al transcribir comca'ac");
          }
        } catch (err) {
          onError?.(err instanceof Error ? err.message : "Error al transcribir");
        } finally {
          setTranscribing(false);
        }
      };
      mediaRecorder.start();
      setRecording(true);
    } catch (err) {
      console.error("Error starting Seri recording:", err);
      onError?.(err instanceof Error ? err.message : "Error al acceder al micrófono");
    }
  }, [onResult, onError]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    setRecording(false);
  }, []);

  return { startRecording, stopRecording, recording, transcribing };
}

export default function TraductorPage() {
  const { user } = useAuth();
  const { profile, loading: profileLoading } = useUserProfile();
  const { locale } = useI18n();
  const [pair, setPair] = useState<LangPair>("seri-es");
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [mounted, setMounted] = useState(false);

  const authorized =
    !!user &&
    (isSuperUser(user.email ?? "") ||
      (profile?.role === "abogado" && profile?.approved) ||
      isDidiUser(user.email ?? ""));

  useEffect(() => setMounted(true), []);

  const currentPair = PAIRS.find((p) => p.id === pair)!;
  const inputLang = currentPair.from;
  const inputSpeechLang = inputLang === "es" ? "es-MX" : "en-US";
  const isSeriInput = inputLang === "seri";

  const { startListening, stopListening, listening } = useVoiceInput((text) => {
    setInputText((prev) => (prev ? `${prev} ${text}` : text));
  });

  const { startRecording, stopRecording, recording, transcribing } = useSeriVoiceInput(
    (text) => setInputText((prev) => (prev ? `${prev} ${text}` : text)),
    (msg) => setError(msg)
  );

  const handleTranslate = useCallback(async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setError("");
    setResult("");
    try {
      const res = await fetch("/api/voice-translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: inputText.trim(),
          fromLang: currentPair.from,
          toLang: currentPair.to,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Error al traducir");
      setResult(data.result || data.spanish || data.seri || data.english || "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al traducir");
    } finally {
      setLoading(false);
    }
  }, [inputText, currentPair]);

  const handleMicClick = useCallback(() => {
    if (isSeriInput) {
      if (recording || transcribing) stopRecording();
      else startRecording();
    } else {
      if (listening) stopListening();
      else startListening(inputSpeechLang);
    }
  }, [isSeriInput, recording, transcribing, stopRecording, startRecording, listening, stopListening, startListening, inputSpeechLang]);

  const handleClear = useCallback(() => {
    setInputText("");
    setResult("");
    setError("");
  }, []);

  const handleSpeakResult = useCallback(() => {
    if (!result || typeof window === "undefined") return;
    const synth = window.speechSynthesis;
    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(result);
    utterance.lang = currentPair.to === "seri" ? "es-MX" : currentPair.to === "es" ? "es-MX" : "en-US";
    utterance.rate = 0.9;
    synth.speak(utterance);
  }, [result, currentPair.to]);

  if (!mounted || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-muted" />
      </div>
    );
  }

  if (!user || !authorized) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen pt-20 flex items-center justify-center">
          <div className="text-center px-6">
            <p className="text-muted mb-6">Acceso restringido. Debes iniciar sesión como abogado, admin o DIDI.</p>
            <Link
              href="/auth"
              className="inline-flex items-center gap-2 text-blue-500 hover:text-blue-600 font-medium"
            >
              <ArrowLeft className="w-4 h-4" />
              Ir a iniciar sesión
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen pt-20 sm:pt-24 pb-16 px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center">
        <div className="w-full max-w-lg mx-auto">
          <h1 className="text-[28px] sm:text-[34px] font-semibold text-foreground tracking-[-0.02em] mb-2">
            Traductor
          </h1>
          <p className="text-[15px] text-muted mb-10 sm:mb-12">
            {"comca'ac"} · Español · English
          </p>

          {isSeriInput && (
            <p className="text-[13px] text-muted/90 mb-6 -mt-4">
              Entrada por voz en comca'ac usando Whisper AI. Graba y traduciremos tu audio.
            </p>
          )}

          <div className="space-y-6 sm:space-y-8">
            <select
              value={pair}
              onChange={(e) => setPair(e.target.value as LangPair)}
              className="w-full text-[15px] rounded-xl bg-[var(--card)] border-0 px-4 py-3.5 text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 appearance-none cursor-pointer"
            >
              {PAIRS.map((p) => (
                <option key={p.id} value={p.id}>
                  {locale === "seri" ? p.labelSeri : p.label}
                </option>
              ))}
            </select>

            <div className="relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={
                  inputLang === "seri"
                    ? "Escribe o graba voz en comca'ac…"
                    : inputLang === "es"
                      ? "Escribe o habla en español…"
                      : "Type or speak in English…"
                }
                rows={5}
                className="w-full rounded-2xl bg-[var(--card)] border-0 px-5 py-4 pr-16 text-[17px] text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-foreground/15 resize-none leading-relaxed"
              />
              <button
                type="button"
                onClick={handleMicClick}
                disabled={transcribing}
                title={
                  transcribing
                    ? "Transcribiendo…"
                    : isSeriInput
                      ? "Grabar voz en comca'ac (Whisper AI)"
                      : listening || recording
                        ? "Detener"
                        : "Microfono"
                }
                className={`absolute right-4 top-4 w-11 h-11 rounded-full flex items-center justify-center transition-all ${
                  transcribing
                    ? "bg-foreground/10 cursor-wait"
                    : listening || recording
                      ? "bg-red-500/15 text-red-500 animate-pulse"
                      : "bg-foreground/5 text-foreground hover:bg-foreground/10 active:scale-95"
                }`}
                aria-label={listening || recording ? "Detener" : "Microfono"}
              >
                {transcribing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : listening || recording ? (
                  <MicOff className="w-5 h-5" />
                ) : (
                  <Mic className="w-5 h-5" />
                )}
              </button>
            </div>

            <button
              type="button"
              onClick={handleTranslate}
              disabled={loading || !inputText.trim()}
              className="w-full py-4 rounded-full bg-foreground text-background font-medium text-[16px] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Traduciendo…
                </>
              ) : (
                "Traducir"
              )}
            </button>

            {result && (
              <div className="rounded-2xl bg-[var(--card)] px-5 py-5">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <p className="text-[11px] text-muted uppercase tracking-widest">Traducción</p>
                  <button
                    type="button"
                    onClick={handleSpeakResult}
                    className="w-10 h-10 rounded-full flex items-center justify-center bg-foreground/5 text-foreground hover:bg-foreground/10 active:scale-95 transition-all"
                    title={currentPair.to === "seri" ? "Escuchar en comca'ac (aproximación)" : "Escuchar traducción"}
                    aria-label="Escuchar traducción"
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-[17px] text-foreground leading-[1.5]">{result}</p>
                {currentPair.to === "seri" && (
                  <p className="text-[11px] text-muted mt-3">
                    La pronunciación usa voz disponible; el comca'ac nativo puede diferir.
                  </p>
                )}
              </div>
            )}
            {error && (
              <p className="text-[13px] text-red-500">{error}</p>
            )}
            {(inputText || result) && (
              <button
                type="button"
                onClick={handleClear}
                className="text-[13px] text-muted hover:text-foreground transition-colors"
              >
                Limpiar
              </button>
            )}
          </div>
        </div>
      </main>
    </>
  );
}
