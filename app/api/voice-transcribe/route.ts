import { NextRequest, NextResponse } from "next/server";

/** Prompt para Whisper: ejemplos de transcripción en comca'ac (cmiique iitom).
 * Whisper usa el estilo del prompt para guiar la ortografía. Fuentes: SIL, Moser & Marlett. */
const SERI_PROMPT =
  "hax quih cöihcö quih itom tiij? haxt ziix hapáctim cmiique comcaac cocsar iitom hehe hant iiha tahejöc caacoj quííp iizax xicaast hapaspoj tooj xnoois cöicöt haxöl ziix quih coi zo hehe hac mapt cöihcapxöt xaap iti cöihcaaitoj hast cöpaac haxt quih ooca cöihyáax quih iti capxöt quih islixp quih yaza quih ano coti";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audio = formData.get("audio") as Blob | File | null;
    const language = (formData.get("language") as string) || "auto";

    if (!audio || !(audio instanceof Blob)) {
      return NextResponse.json({ error: "Se requiere audio" }, { status: 400 });
    }

    const key = process.env.OPENAI_API_KEY?.trim();
    if (!key || key.length < 10) {
      return NextResponse.json({ error: "OPENAI_API_KEY no configurada" }, { status: 500 });
    }

    const buffer = Buffer.from(await audio.arrayBuffer());
    const file = new File([buffer], "audio.webm", { type: audio.type || "audio/webm" });

    const { default: OpenAI } = await import("openai");
    const openai = new OpenAI({ apiKey: key });

    const transcription = await openai.audio.transcriptions.create({
      file,
      model: "gpt-4o-transcribe",
      response_format: "text",
      language: language === "seri" ? undefined : language === "es" ? "es" : language === "en" ? "en" : undefined,
      prompt: language === "seri" ? SERI_PROMPT : undefined,
    });

    const text = typeof transcription === "string" ? transcription : (transcription as { text?: string }).text ?? "";
    return NextResponse.json({ text: text.trim() });
  } catch (error: unknown) {
    console.error("Error voice-transcribe:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error al transcribir" },
      { status: 500 }
    );
  }
}
