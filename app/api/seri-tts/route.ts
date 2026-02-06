import { NextRequest, NextResponse } from "next/server";

/**
 * API endpoint para generar audio TTS en comca'ac usando OpenAI TTS.
 * 
 * ESTRATEGIA:
 * - Usa OpenAI TTS con modelo "tts-1" o "tts-1-hd" para mejor calidad
 * - Usa voz "nova" o "echo" que tienen mejor pronunciación para idiomas no estándar
 * - Genera audio en formato MP3 para mejor compatibilidad
 * - El texto debe estar en comca'ac (cmiique iitom)
 * 
 * NOTA: OpenAI TTS no tiene soporte nativo para comca'ac, pero puede aproximar
 * la pronunciación mejor que Web Speech API usando voces entrenadas.
 */

export async function POST(request: NextRequest) {
  try {
    const { text } = await request.json();
    
    if (!text || typeof text !== "string" || !text.trim()) {
      return NextResponse.json(
        { error: "Se requiere texto en comca'ac" },
        { status: 400 }
      );
    }

    const key = process.env.OPENAI_API_KEY?.trim();
    if (!key || key.length < 10) {
      return NextResponse.json(
        { error: "OPENAI_API_KEY no configurada" },
        { status: 500 }
      );
    }

    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey: key });

    // Usar OpenAI TTS con voz "nova" (mejor para pronunciación de idiomas no estándar)
    // Modelo "tts-1" es más rápido, "tts-1-hd" es mejor calidad pero más lento
    // Para comca'ac, usar velocidad ligeramente más lenta y voz clara
    const mp3 = await openai.audio.speech.create({
      model: "tts-1-hd", // Mejor calidad para idiomas con pronunciación especial
      voice: "nova", // Voz clara y natural, mejor para idiomas no estándar
      input: text.trim(),
      speed: 0.85, // Velocidad más lenta para mejor comprensión del acento comca'ac
    });

    const buffer = Buffer.from(await mp3.arrayBuffer());
    
    // Retornar el audio como respuesta binaria
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": buffer.length.toString(),
        "Cache-Control": "public, max-age=31536000, immutable", // Cache por 1 año
      },
    });
  } catch (error: unknown) {
    console.error("Error generando TTS comca'ac:", error);
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Error al generar audio",
      },
      { status: 500 }
    );
  }
}
