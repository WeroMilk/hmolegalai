"use client";

/**
 * Utilidades para reproducción de audio en múltiples idiomas.
 * Soporta comca'ac, español e inglés con mejor calidad de voz.
 * Optimizado para respuesta inmediata y cancelación automática.
 */

import { playSeriText } from "./seri-audio";

export type SupportedLanguage = "seri" | "es" | "en";

// Instancia global para cancelación inmediata
let currentUtterance: SpeechSynthesisUtterance | null = null;
let currentAudio: HTMLAudioElement | null = null;
let listenersInitialized = false;

// Inicializar cancelación automática al hacer clic en elementos interactivos
function initializeCancelListeners(): void {
  if (typeof window === "undefined" || listenersInitialized) return;
  
  // Cancelar audio cuando se hace clic en cualquier elemento interactivo
  const cancelOnInteraction = (e: Event) => {
    const target = e.target as HTMLElement;
    // No cancelar si el clic es en un botón de audio/play
    if (target.closest('button[aria-label*="Escuchar"], button[aria-label*="Listen"], button[title*="Escuchar"], button[title*="Listen"]')) {
      return;
    }
    stopSpeaking();
  };
  
  // Agregar listeners una sola vez
  document.addEventListener("click", cancelOnInteraction, true);
  document.addEventListener("touchstart", cancelOnInteraction, true);
  document.addEventListener("keydown", (e) => {
    // Cancelar solo si no es espacio o Enter (que podrían ser para reproducir)
    if (e.key !== " " && e.key !== "Enter") {
      stopSpeaking();
    }
  }, true);
  
  listenersInitialized = true;
}

// Inicializar listeners cuando el módulo se carga
if (typeof window !== "undefined") {
  // Usar requestAnimationFrame para asegurar que el DOM esté listo
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeCancelListeners);
  } else {
    initializeCancelListeners();
  }
}

/**
 * Obtiene el idioma basado en el flag seleccionado.
 * Si no hay flag o está en el cliente, usa el idioma por defecto.
 */
function getLanguageFromFlag(): SupportedLanguage {
  if (typeof window === "undefined") return "es";
  
  try {
    const flag = localStorage.getItem("avatar_flag_choice") as "seri" | "mx" | "us" | null;
    if (flag === "seri") return "seri";
    if (flag === "mx") return "es";
    if (flag === "us") return "en";
  } catch {
    // Si hay error accediendo localStorage, usar español por defecto
  }
  
  // Fallback: usar locale del documento
  const docLang = typeof document !== "undefined" ? document.documentElement.lang : "es";
  if (docLang === "seri") return "seri";
  if (docLang === "en") return "en";
  return "es";
}

/**
 * Reproduce texto en el idioma especificado con la mejor calidad disponible.
 * Por defecto usa el flag seleccionado en el header para mantener consistencia.
 * En traductores, puedes pasar lang explícitamente para usar el idioma de destino.
 * 
 * @param text - Texto a reproducir
 * @param lang - Idioma del texto ("seri", "es", o "en"). Si no se especifica, usa el flag seleccionado.
 * @param forceLang - Si es true, fuerza el uso de lang incluso si hay flag seleccionado (útil en traductores).
 */
export async function speakText(text: string, lang?: SupportedLanguage, forceLang: boolean = false): Promise<void> {
  // Cancelar cualquier audio en curso inmediatamente
  stopSpeaking();
  
  // Usar el flag seleccionado por defecto, a menos que forceLang sea true y lang esté especificado
  const finalLang = (forceLang && lang) ? lang : getLanguageFromFlag();
  if (typeof window === "undefined" || !text.trim()) return;

  // Para comca'ac, usar el sistema mejorado con OpenAI TTS
  if (finalLang === "seri") {
    await playSeriText(text.trim());
    return;
  }

  // Para español e inglés, usar Web Speech API con mejor voz disponible
  const synth = window.speechSynthesis;
  synth.cancel(); // Cancelar inmediatamente antes de configurar
  
  // Obtener voces de forma síncrona si están disponibles (más rápido)
  const voices = synth.getVoices();

  const utterance = new SpeechSynthesisUtterance(text.trim());
  currentUtterance = utterance; // Guardar referencia para cancelación
  
  // Configurar idioma y parámetros según el flag seleccionado (optimizado)
  if (finalLang === "es") {
    utterance.lang = "es-MX";
    utterance.rate = 0.9;
  } else {
    utterance.lang = "en-US";
    utterance.rate = 0.95;
  }
  
  utterance.pitch = 1;
  utterance.volume = 1.0;

  // Seleccionar mejor voz disponible según el flag seleccionado (síncrono si hay voces)
  let preferredVoice: SpeechSynthesisVoice | null = null;

  if (voices.length > 0) {
    // Voces ya disponibles, seleccionar inmediatamente
    if (finalLang === "es") {
      preferredVoice =
        voices.find((v) => v.lang === "es-MX") ??
        voices.find((v) => v.lang === "es-ES") ??
        voices.find((v) => v.lang.startsWith("es")) ??
        null;
    } else {
      preferredVoice =
        voices.find((v) => v.lang === "en-US") ??
        voices.find((v) => v.lang === "en-GB") ??
        voices.find((v) => v.lang.startsWith("en")) ??
        null;
    }
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }
    
    // Reproducir inmediatamente sin delays
    synth.speak(utterance);
  } else {
    // Voces no disponibles aún, esperar pero con timeout más corto
    const voicePromise = new Promise<void>((resolve) => {
      const onVoicesChanged = () => {
        const newVoices = synth.getVoices();
        if (newVoices.length > 0) {
          synth.removeEventListener("voiceschanged", onVoicesChanged);
          
          // Seleccionar voz con las voces cargadas
          let newPreferredVoice: SpeechSynthesisVoice | null = null;
          if (finalLang === "es") {
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
      // Timeout más corto para respuesta más rápida
      setTimeout(() => {
        synth.removeEventListener("voiceschanged", onVoicesChanged);
        resolve();
      }, 200); // Reducido de 1000ms a 200ms
    });
    
    await voicePromise;
    // Reproducir inmediatamente después de obtener voces
    synth.speak(utterance);
  }
  
  // Limpiar referencia cuando termine
  utterance.onend = () => {
    currentUtterance = null;
  };
  utterance.onerror = () => {
    currentUtterance = null;
  };
}

/**
 * Detiene cualquier reproducción de audio en curso inmediatamente.
 * Optimizado para respuesta instantánea.
 */
export function stopSpeaking(): void {
  if (typeof window === "undefined") return;
  
  // Cancelar SpeechSynthesis inmediatamente
  const synth = window.speechSynthesis;
  synth.cancel();
  
  // Limpiar referencias
  currentUtterance = null;
  
  // Cancelar audio HTML si existe
  if (currentAudio) {
    try {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    } catch {
      // Ignorar errores
    }
    currentAudio = null;
  }
}

// Exportar función para cancelar audio HTML desde seri-audio
export function setCurrentAudio(audio: HTMLAudioElement | null): void {
  currentAudio = audio;
}
