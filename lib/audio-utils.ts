"use client";

/**
 * Utilidades para reproducción de audio en múltiples idiomas.
 * Soporta comca'ac, español e inglés con mejor calidad de voz.
 */

import { playSeriText } from "./seri-audio";

export type SupportedLanguage = "seri" | "es" | "en";

/**
 * Reproduce texto en el idioma especificado con la mejor calidad disponible.
 * 
 * @param text - Texto a reproducir
 * @param lang - Idioma del texto ("seri", "es", o "en")
 */
export async function speakText(text: string, lang: SupportedLanguage): Promise<void> {
  if (typeof window === "undefined" || !text.trim()) return;

  // Para comca'ac, usar el sistema mejorado con OpenAI TTS
  if (lang === "seri") {
    await playSeriText(text.trim());
    return;
  }

  // Para español e inglés, usar Web Speech API con mejor voz disponible
  const synth = window.speechSynthesis;
  synth.cancel();

  const utterance = new SpeechSynthesisUtterance(text.trim());
  
  // Configurar idioma y parámetros
  if (lang === "es") {
    utterance.lang = "es-MX";
    utterance.rate = 0.9;
  } else {
    utterance.lang = "en-US";
    utterance.rate = 0.95;
  }
  
  utterance.pitch = 1;
  utterance.volume = 1.0;

  // Seleccionar mejor voz disponible
  const voices = synth.getVoices();
  let preferredVoice: SpeechSynthesisVoice | null = null;

  if (lang === "es") {
    // Preferir voces mexicanas, luego españolas, luego cualquier español
    preferredVoice =
      voices.find((v) => v.lang === "es-MX") ??
      voices.find((v) => v.lang === "es-ES") ??
      voices.find((v) => v.lang.startsWith("es")) ??
      null;
  } else {
    // Preferir voces estadounidenses, luego británicas, luego cualquier inglés
    preferredVoice =
      voices.find((v) => v.lang === "en-US") ??
      voices.find((v) => v.lang === "en-GB") ??
      voices.find((v) => v.lang.startsWith("en")) ??
      null;
  }

  if (preferredVoice) {
    utterance.voice = preferredVoice;
  }

  // En algunos navegadores, las voces se cargan de forma asíncrona
  // Esperar un momento si no hay voces disponibles
  if (voices.length === 0) {
    await new Promise<void>((resolve) => {
      const onVoicesChanged = () => {
        const newVoices = synth.getVoices();
        if (newVoices.length > 0) {
          synth.removeEventListener("voiceschanged", onVoicesChanged);
          
          // Seleccionar voz nuevamente con las voces cargadas
          let newPreferredVoice: SpeechSynthesisVoice | null = null;
          if (lang === "es") {
            newPreferredVoice =
              newVoices.find((v) => v.lang === "es-MX") ??
              newVoices.find((v) => v.lang === "es-ES") ??
              newVoices.find((v) => v.lang.startsWith("es")) ??
              null;
          } else {
            newPreferredVoice =
              newVoices.find((v) => v.lang === "en-US") ??
              newVoices.find((v) => v.lang === "en-GB") ??
              newVoices.find((v) => v.lang.startsWith("en")) ??
              null;
          }
          
          if (newPreferredVoice) {
            utterance.voice = newPreferredVoice;
          }
          
          resolve();
        }
      };
      synth.addEventListener("voiceschanged", onVoicesChanged);
      setTimeout(() => {
        synth.removeEventListener("voiceschanged", onVoicesChanged);
        resolve();
      }, 1000);
    });
  }

  // Pequeño delay para iOS
  await new Promise((resolve) => setTimeout(resolve, 50));
  synth.speak(utterance);
}

/**
 * Detiene cualquier reproducción de audio en curso.
 */
export function stopSpeaking(): void {
  if (typeof window === "undefined") return;
  const synth = window.speechSynthesis;
  synth.cancel();
}
