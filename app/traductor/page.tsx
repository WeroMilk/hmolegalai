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
import { corpusTranslate, type CorpusSuggestion } from "@/lib/tri-translator";

type LangPair = "seri-es" | "es-seri" | "en-es" | "es-en" | "seri-en" | "en-seri";

const PAIRS: { id: LangPair; label: string; labelSeri: string; from: string; to: string }[] = [
  { id: "seri-es", label: "comca'ac → Español", labelSeri: "comca'ac → cocsar iitom", from: "seri", to: "es" },
  { id: "es-seri", label: "Español → comca'ac", labelSeri: "cocsar iitom → comca'ac", from: "es", to: "seri" },
  { id: "en-es", label: "English → Español", labelSeri: "English → cocsar iitom", from: "en", to: "es" },
  { id: "es-en", label: "Español → English", labelSeri: "cocsar iitom → English", from: "es", to: "en" },
  { id: "seri-en", label: "comca'ac → English", labelSeri: "comca'ac → English", from: "seri", to: "en" },
  { id: "en-seri", label: "English → comca'ac", labelSeri: "English → comca'ac", from: "en", to: "seri" },
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
  const [corpusSuggestions, setCorpusSuggestions] = useState<CorpusSuggestion[]>([]);
  const [usedCorpus, setUsedCorpus] = useState(false);

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
    setCorpusSuggestions([]);
    setUsedCorpus(false);
    try {
      // 1) First: try translating from the app's verified corpus (no hallucinations).
      const corpus = corpusTranslate(inputText.trim(), currentPair.from as "es" | "en" | "seri", currentPair.to as "es" | "en" | "seri", {
        minScore: 0.75, // Aumentado para mejor precisión
        limit: 8, // Aumentado para más opciones
      });
      if (corpus.suggestions.length > 0) setCorpusSuggestions(corpus.suggestions);
      // Usar corpus si el score es muy alto (0.95+) o si es exacto (1.0)
      if (corpus.best && (corpus.best.score >= 0.95 || corpus.best.score === 1.0)) {
        setUsedCorpus(true);
        setResult(corpus.best.toText);
        return;
      }
      // Si hay una buena coincidencia (0.85-0.94) y es una palabra corta común, también usar corpus
      if (corpus.best && corpus.best.score >= 0.85 && inputText.trim().length <= 10) {
        setUsedCorpus(true);
        setResult(corpus.best.toText);
        return;
      }

      // 2) Fallback: OpenAI translation for free-text.
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
      
      // Limpiar y normalizar resultado de OpenAI
      let translation = data.result || data.spanish || data.seri || data.english || "";
      translation = translation
        .replace(/^["']|["']$/g, "") // Remover comillas
        .replace(/^[\.\s]+|[\.\s]+$/g, "") // Remover puntos y espacios al inicio/final
        .trim();
      
      setResult(translation);
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

  const handleSpeakResult = useCallback(async () => {
    if (!result || typeof window === "undefined") return;
    
    const { speakText } = await import("@/lib/audio-utils");
    // En el traductor, usar el idioma de destino explícitamente
    await speakText(result, currentPair.to as "seri" | "es" | "en", true);
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
      <main className="min-h-screen pt-20 sm:pt-24 md:pt-28 pb-12 sm:pb-16 md:pb-20 px-4 sm:px-6 md:px-8 lg:px-10 flex flex-col items-center justify-center">
        <div className="w-full max-w-lg md:max-w-2xl lg:max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 leading-tight text-foreground">
            <span className="gradient-text hover-title">Traductor</span>
          </h1>
          <p className="text-sm sm:text-base md:text-lg text-muted mb-8 sm:mb-10 md:mb-12">
            {"comca'ac"} · Español · English
          </p>

          {isSeriInput && (
            <p className="text-[13px] text-muted/90 mb-6 -mt-4">
              Entrada por voz en comca&apos;ac usando Whisper AI. Graba y traduciremos tu audio.
            </p>
          )}

          <div className="space-y-5 sm:space-y-6 md:space-y-8">
            <select
              value={pair}
              onChange={(e) => setPair(e.target.value as LangPair)}
              className="w-full text-sm sm:text-base md:text-lg rounded-xl bg-[var(--card)] border-0 px-4 sm:px-5 py-3 sm:py-3.5 md:py-4 text-foreground focus:outline-none focus:ring-2 focus:ring-foreground/20 appearance-none cursor-pointer"
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
                className="w-full rounded-2xl bg-[var(--card)] border-0 px-4 sm:px-5 md:px-6 py-4 sm:py-5 pr-14 sm:pr-16 text-base sm:text-lg md:text-xl text-foreground placeholder:text-muted/60 focus:outline-none focus:ring-2 focus:ring-foreground/15 resize-none leading-relaxed"
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
                {usedCorpus && (
                  <p className="text-[11px] text-muted mt-3">
                    Coincidencia exacta con frases ya traducidas en la plataforma.
                  </p>
                )}
                {currentPair.to === "seri" && (
                  <p className="text-[11px] text-muted mt-3">
                    La pronunciación usa voz disponible; el comca&apos;ac nativo puede diferir.
                  </p>
                )}
              </div>
            )}

            {!result && corpusSuggestions.length > 0 && (
              <div className="rounded-2xl bg-[var(--card)] px-5 py-5">
                <p className="text-[11px] text-muted uppercase tracking-widest mb-3">
                  Sugerencias (frases ya existentes)
                </p>
                <div className="space-y-2">
                  {corpusSuggestions.map((s) => (
                    <button
                      key={`${s.key}-${s.score}`}
                      type="button"
                      onClick={() => {
                        setUsedCorpus(true);
                        setResult(s.toText);
                      }}
                      className="w-full text-left rounded-xl bg-foreground/5 hover:bg-foreground/10 transition-colors px-4 py-3"
                      title={`Key: ${s.key}`}
                    >
                      <div className="text-[12px] text-muted mb-1">
                        Coincidencia: {Math.round(s.score * 100)}%
                      </div>
                      <div className="text-[14px] text-foreground leading-snug">
                        {s.toText}
                      </div>
                    </button>
                  ))}
                </div>
                <p className="text-[11px] text-muted mt-3">
                  Si ninguna coincide con lo que necesitas, vuelve a intentar con texto más corto o más literal.
                </p>
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
