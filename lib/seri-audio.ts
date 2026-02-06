/**
 * Reproducción de audio en comca'ac (cmiique iitom).
 *
 * ESTRATEGIA MEJORADA:
 * 1. Pre-grabado: Si existe /audio/seri/{phraseId}.mp3, se reproduce (voz auténtica comca'ac).
 * 2. TTS con OpenAI: Genera audio usando OpenAI TTS con voz "nova" optimizada para idiomas no estándar.
 * 3. Fallback: Web Speech API hablando el TEXTO SERI con lang "es-MX" (último recurso).
 *
 * Para voces auténticas: grabar MP3 con hablantes nativos y colocar en public/audio/seri/
 * Ejemplo: public/audio/seri/sit-1.mp3 para la frase "Ziix hac".
 *
 * Fuentes: SIL, 68 Voces, INALI — OpenAI TTS proporciona mejor aproximación que Web Speech API.
 */

export interface SeriPhraseForAudio {
  id: string;
  seri: string;
}

let audioInstance: HTMLAudioElement | null = null;
let audioContextActivated = false;

function getAudio(): HTMLAudioElement {
  if (typeof window === "undefined") throw new Error("window undefined");
  if (!audioInstance) {
    audioInstance = new Audio();
    // En iOS, el audio debe tener estas propiedades para funcionar correctamente
    audioInstance.preload = "auto";
    // playsInline es un atributo HTML, no una propiedad JS
    audioInstance.setAttribute("playsinline", "true");
  }
  return audioInstance;
}

/**
 * Activa el AudioContext en iOS (requiere interacción del usuario).
 * Debe llamarse en respuesta a un evento de usuario (click, touch).
 */
async function activateAudioContext(): Promise<void> {
  if (audioContextActivated || typeof window === "undefined") return;
  try {
    // Crear y activar un AudioContext temporal para desbloquear el audio en iOS
    const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext)();
    if (ctx.state === "suspended") {
      await ctx.resume();
    }
    await ctx.close();
    audioContextActivated = true;
  } catch {
    // Si falla, intentamos activar con el audio element
    try {
      const audio = getAudio();
      await audio.play();
      audio.pause();
      audio.currentTime = 0;
      audioContextActivated = true;
    } catch {
      // Silenciar errores
    }
  }
}

/**
 * Intenta reproducir audio pregrabado desde /audio/seri/{id}.mp3
 * @returns true si se encontró y empezó a reproducir, false si no existe
 */
async function playPreRecorded(phraseId: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  
  // Activar contexto de audio en iOS antes de reproducir
  await activateAudioContext();
  
  const base = typeof window !== "undefined" ? window.location.origin : "";
  const url = `${base}/audio/seri/${phraseId}.mp3`;

  try {
    const res = await fetch(url, { method: "HEAD" });
    if (!res.ok) return false;

    const audio = getAudio();
    audio.src = url;
    audio.load();
    
    // En iOS, puede requerir múltiples intentos
    try {
      await audio.play();
      return true;
    } catch (playError) {
      // Si falla, intentar una vez más después de un pequeño delay
      await new Promise(resolve => setTimeout(resolve, 100));
      try {
        await audio.play();
        return true;
      } catch {
        return false;
      }
    }
  } catch {
    return false;
  }
}

/**
 * Obtiene las voces disponibles (Chrome las carga de forma asíncrona).
 */
function getVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    const synth = window.speechSynthesis;
    let voices = synth.getVoices();
    if (voices.length > 0) {
      resolve(voices);
      return;
    }
    const onVoicesChanged = () => {
      voices = synth.getVoices();
      if (voices.length > 0) {
        synth.removeEventListener("voiceschanged", onVoicesChanged);
        resolve(voices);
      }
    };
    synth.addEventListener("voiceschanged", onVoicesChanged);
    setTimeout(() => {
      synth.removeEventListener("voiceschanged", onVoicesChanged);
      resolve(synth.getVoices());
    }, 500);
  });
}

/**
 * Genera audio usando OpenAI TTS API para mejor pronunciación comca'ac.
 * Esta es la mejor opción cuando no hay audio pregrabado.
 */
async function generateOpenAITTS(seriText: string): Promise<string | null> {
  if (typeof window === "undefined") return null;
  
  try {
    const res = await fetch("/api/seri-tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: seriText }),
    });
    
    if (!res.ok) return null;
    
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    return url;
  } catch {
    return null;
  }
}

/**
 * Reproduce el texto Seri con Web Speech API (fallback de último recurso).
 * Intenta lang "sei" (Seri); si no hay voz, usa es-MX para aproximación fonética.
 */
async function speakWithWebTTS(seriText: string): Promise<void> {
  if (typeof window === "undefined") return;
  
  // Activar contexto de audio en iOS antes de usar TTS
  await activateAudioContext();
  
  try {
    const synth = window.speechSynthesis;
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(seriText);
    utterance.rate = 0.85;
    utterance.pitch = 1;
    // En iOS, asegurar que el volumen esté al máximo
    utterance.volume = 1.0;

    const voices = await getVoices();
    const seiVoice = voices.find((v) => v.lang.toLowerCase().startsWith("sei"));
    const esMXVoice =
      voices.find((v) => v.lang === "es-MX") ?? voices.find((v) => v.lang.startsWith("es"));

    if (seiVoice) {
      utterance.voice = seiVoice;
      utterance.lang = "sei";
    } else if (esMXVoice) {
      utterance.voice = esMXVoice;
      utterance.lang = "es-MX";
    } else {
      utterance.lang = "es-MX";
    }

    // En iOS, puede requerir un pequeño delay antes de hablar
    await new Promise(resolve => setTimeout(resolve, 50));
    synth.speak(utterance);
  } catch {
    /* silenciar */
  }
}

/**
 * Reproduce audio desde una URL (blob o archivo).
 */
async function playAudioFromURL(url: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  
  await activateAudioContext();
  
  try {
    const audio = getAudio();
    audio.src = url;
    audio.load();
    
    try {
      await audio.play();
      return true;
    } catch (playError) {
      // Si falla, intentar una vez más después de un pequeño delay
      await new Promise(resolve => setTimeout(resolve, 100));
      try {
        await audio.play();
        return true;
      } catch {
        return false;
      }
    }
  } catch {
    return false;
  }
}

/**
 * Reproduce la frase en Seri (cmiique iitom).
 * ESTRATEGIA MEJORADA:
 * 1. Intenta audio pregrabado (voz auténtica comca'ac).
 * 2. Genera audio con OpenAI TTS (mejor pronunciación comca'ac).
 * 3. Fallback: Web Speech API (último recurso).
 */
export async function playSeriPhrase(phrase: SeriPhraseForAudio): Promise<void> {
  if (typeof window === "undefined") return;

  // 1. Intentar audio pregrabado (voz auténtica)
  const played = await playPreRecorded(phrase.id);
  if (played) return;

  // 2. Generar audio con OpenAI TTS (mejor pronunciación)
  const audioURL = await generateOpenAITTS(phrase.seri);
  if (audioURL) {
    const played = await playAudioFromURL(audioURL);
    if (played) {
      // Limpiar el blob URL después de reproducir (con delay para que termine la reproducción)
      setTimeout(() => {
        try {
          URL.revokeObjectURL(audioURL);
        } catch {
          // Ignorar errores al limpiar
        }
      }, 5000);
      return;
    }
  }

  // 3. Fallback: Web Speech API (último recurso)
  await speakWithWebTTS(phrase.seri);
}

/**
 * Reproduce texto comca'ac directamente (para traducciones dinámicas).
 * Usa la misma estrategia mejorada que playSeriPhrase.
 */
export async function playSeriText(seriText: string): Promise<void> {
  if (typeof window === "undefined" || !seriText.trim()) return;

  // 1. Generar audio con OpenAI TTS (mejor pronunciación)
  const audioURL = await generateOpenAITTS(seriText.trim());
  if (audioURL) {
    const played = await playAudioFromURL(audioURL);
    if (played) {
      // Limpiar el blob URL después de reproducir
      setTimeout(() => {
        try {
          URL.revokeObjectURL(audioURL);
        } catch {
          // Ignorar errores al limpiar
        }
      }, 5000);
      return;
    }
  }

  // 2. Fallback: Web Speech API
  await speakWithWebTTS(seriText.trim());
}
