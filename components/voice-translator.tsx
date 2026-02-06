"use client";

import { useState, useCallback, useRef } from "react";
import { Mic, MicOff, Languages, ChevronDown, Loader2, Volume2 } from "lucide-react";
import { useI18n } from "@/lib/i18n-context";
import { corpusTranslate } from "@/lib/tri-translator";

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
    const SpeechRecognitionAPI =
      (window as unknown as { SpeechRecognition?: new () => SpeechRecognition }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: new () => SpeechRecognition }).webkitSpeechRecognition;
    if (!SpeechRecognitionAPI) {
      onResult("");
      return;
    }
    const rec = new SpeechRecognitionAPI();
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

interface VoiceTranslatorProps {
  className?: string;
}

export function VoiceTranslator({ className = "" }: VoiceTranslatorProps) {
  const { locale } = useI18n();
  const [open, setOpen] = useState(false);
  const [pair, setPair] = useState<LangPair>("seri-es");
  const [inputText, setInputText] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [usedCorpus, setUsedCorpus] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentPair = PAIRS.find((p) => p.id === pair)!;
  const inputLang = currentPair.from;
  const inputSpeechLang = inputLang === "es" ? "es-MX" : "en-US";
  const canUseVoice = inputLang !== "seri"; // El navegador no soporta transcripción de comca'ac

  const { startListening, stopListening, listening } = useVoiceInput((text) => {
    setInputText((prev) => (prev ? `${prev} ${text}` : text));
  });

  const handleTranslate = useCallback(async () => {
    if (!inputText.trim()) return;
    setLoading(true);
    setError("");
    setResult("");
    setUsedCorpus(false);
    try {
      const corpus = corpusTranslate(
        inputText.trim(),
        currentPair.from as "es" | "en" | "seri",
        currentPair.to as "es" | "en" | "seri",
        { minScore: 0.75, limit: 3 }
      );
      if (corpus.best && corpus.best.score >= 0.92) {
        setUsedCorpus(true);
        setResult(corpus.best.toText);
        return;
      }

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
    if (listening) {
      stopListening();
    } else {
      startListening(inputSpeechLang);
    }
  }, [listening, startListening, stopListening, inputSpeechLang]);

  const handleClear = useCallback(() => {
    setInputText("");
    setResult("");
    setError("");
  }, []);

  return (
    <div ref={containerRef} className={`relative ${className}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/15 to-indigo-500/15 border border-blue-500/30 hover:border-blue-500/50 hover:from-blue-500/25 hover:to-indigo-500/25 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
        aria-label="Traductor por voz"
      >
        <Languages className="w-5 h-5 text-blue-500" />
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div
            className="absolute right-0 top-full mt-2 z-50 w-[320px] sm:w-[360px] rounded-2xl shadow-2xl border border-border bg-background/95 backdrop-blur-xl overflow-hidden"
            style={{ boxShadow: "0 20px 50px -12px rgba(0,0,0,0.25), 0 0 0 1px rgba(255,255,255,0.05)" }}
          >
            <div className="p-4 border-b border-border bg-gradient-to-r from-blue-500/10 to-indigo-500/10">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-9 h-9 rounded-xl bg-blue-500/20 flex items-center justify-center">
                  <Languages className="w-5 h-5 text-blue-500" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-foreground">Traductor por voz</h3>
                  <p className="text-xs text-muted">{"comca'ac"} · Español · English</p>
                </div>
              </div>
              <select
                value={pair}
                onChange={(e) => setPair(e.target.value as LangPair)}
                className="w-full text-sm rounded-lg border border-border bg-background px-3 py-2 text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {PAIRS.map((p) => (
                  <option key={p.id} value={p.id}>
                    {locale === "seri" ? p.labelSeri : p.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="p-4 space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder={
                    inputLang === "seri"
                      ? "Escribe en comca'ac (voz no soportada por el navegador)..."
                      : inputLang === "es"
                        ? "Habla o escribe en español..."
                        : "Speak or type in English..."
                  }
                  className="flex-1 min-w-0 text-sm rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <button
                  type="button"
                  onClick={handleMicClick}
                  disabled={!canUseVoice}
                  title={!canUseVoice ? "La transcripción de voz para comca'ac no está disponible" : undefined}
                  className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                    !canUseVoice
                      ? "opacity-50 cursor-not-allowed bg-muted/20 border border-border"
                      : listening
                        ? "bg-red-500/20 border-2 border-red-500/60 text-red-500 animate-pulse"
                        : "bg-blue-500/15 border border-blue-500/40 text-blue-500 hover:bg-blue-500/25"
                  }`}
                  aria-label={listening ? "Detener" : canUseVoice ? "Escuchar" : "Voz no disponible para comca'ac"}
                >
                  {listening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
              </div>

              <button
                type="button"
                onClick={handleTranslate}
                disabled={loading || !inputText.trim()}
                className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium flex items-center justify-center gap-2 transition-colors"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Traduciendo...
                  </>
                ) : (
                  <>
                    <Volume2 className="w-4 h-4" />
                    Traducir
                  </>
                )}
              </button>

              {result && (
                <div className="rounded-xl bg-green-500/10 border border-green-500/30 p-3">
                  <p className="text-xs text-muted mb-1">Traducción:</p>
                  <p className="text-sm text-foreground font-medium">{result}</p>
                  {usedCorpus && (
                    <p className="text-[11px] text-muted mt-2">
                      Coincidencia exacta con frases ya traducidas en la plataforma.
                    </p>
                  )}
                </div>
              )}
              {error && (
                <p className="text-xs text-red-500">{error}</p>
              )}
              {(inputText || result) && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="text-xs text-muted hover:text-foreground"
                >
                  Limpiar
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
