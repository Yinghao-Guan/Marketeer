import client from "@/lib/gemini";
import { TRANSCRIBE_LYRICS_PROMPT } from "@/lib/prompts";

interface LyricWord {
  word: string;
  startTime: number;
  endTime: number;
}

interface LyricLine {
  words: LyricWord[];
  startTime: number;
  endTime: number;
}

export async function POST(req: Request) {
  try {
    const { audioBase64, mimeType } = await req.json();

    if (!audioBase64) {
      return Response.json({ error: "No audio provided" }, { status: 400 });
    }

    const response = await client.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: audioBase64,
                mimeType: mimeType || "audio/mpeg",
              },
            },
            { text: TRANSCRIBE_LYRICS_PROMPT },
          ],
        },
      ],
    });

    const raw = response.text ?? "";

    // Strip markdown fencing if Gemini wraps it
    const cleaned = raw.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    let lines: LyricLine[] = [];
    try {
      const parsed = JSON.parse(cleaned);
      if (Array.isArray(parsed)) {
        lines = parsed.filter(
          (line: LyricLine) =>
            Array.isArray(line.words) &&
            typeof line.startTime === "number" &&
            typeof line.endTime === "number"
        );
      }
    } catch {
      console.error("Failed to parse lyrics JSON:", cleaned.slice(0, 200));
    }

    return Response.json({ lines });
  } catch (error) {
    console.error("Lyrics transcription error:", error);
    const message =
      error instanceof Error ? error.message : "Failed to transcribe lyrics";
    return Response.json({ error: message, lines: [] }, { status: 500 });
  }
}
