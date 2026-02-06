/**
 * Reproducción de audio en comca'ac (cmiique iitom).
 *
 * ESTRATEGIA:
 * 1. Pre-grabado: Si existe /audio/seri/{phraseId}.mp3, se reproduce (voz auténtica).
 * 2. Fallback: Web Speech API hablando el TEXTO SERI (no español) con lang "sei".
 *    Los navegadores no tienen voz Seri; se prueba "sei" y luego es-MX como fallback.
 *
 * Para voces auténticas: grabar MP3 con hablantes nativos y colocar en public/audio/seri/
 * Ejemplo: public/audio/seri/sit-1.mp3 para la frase "Ziix hac".
 *
 * Fuentes: SIL, 68 Voces, INALI — no existe TTS nativo para Seri.
 */

export interface SeriPhraseForAudio {
  id: string;
  seri: string;
}

let audioInstance: HTMLAudioElement | null = null;

function getAudio(): HTMLAudioElement {
  if (typeof window === "undefined") throw new Error("window undefined");
  if (!audioInstance) {
    audioInstance = new Audio();
  }
  return audioInstance;
}

/**
 * Intenta reproducir audio pregrabado desde /audio/seri/{id}.mp3
 * @returns true si se encontró y empezó a reproducir, false si no existe
 */
async function playPreRecorded(phraseId: string): Promise<boolean> {
  if (typeof window === "undefined") return false;
  const base = typeof window !== "undefined" ? window.location.origin : "";
  const url = `${base}/audio/seri/${phraseId}.mp3`;

  try {
    const res = await fetch(url, { method: "HEAD" });
    if (!res.ok) return false;

    const audio = getAudio();
    audio.src = url;
    audio.load();
    await audio.play();
    return true;
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
 * Reproduce el texto Seri con Web Speech API.
 * Intenta lang "sei" (Seri); si no hay voz, usa es-MX para aproximación fonética.
 */
async function speakWithTTS(seriText: string): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    const synth = window.speechSynthesis;
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(seriText);
    utterance.rate = 0.85;
    utterance.pitch = 1;

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

    synth.speak(utterance);
  } catch {
    /* silenciar */
  }
}

/**
 * Reproduce la frase en Seri (cmiique iitom).
 * 1. Intenta audio pregrabado (voz auténtica comca'ac).
 * 2. Fallback: TTS con el texto Seri (aproximación).
 */
export async function playSeriPhrase(phrase: SeriPhraseForAudio): Promise<void> {
  if (typeof window === "undefined") return;

  const played = await playPreRecorded(phrase.id);
  if (played) return;

  await speakWithTTS(phrase.seri);
}
