import client from "@/lib/gemini";
import { JINGLE_PROMPT } from "@/lib/prompts";

const MOOD_BPM: Record<string, number> = {
    upbeat: 128,
    chill: 80,
    dramatic: 100,
    bold: 120,
};

export async function POST(req: Request) {
    try {
        const { mood, jingleMood, brandName, industry, tagline, location, description } = await req.json();

        const bpm = MOOD_BPM[mood] ?? 100;
        const promptText = `${JINGLE_PROMPT(
            brandName,
            tagline,
            jingleMood,
            industry,
            location || "",
            description || ""
        )}

Target tempo: ${bpm} BPM.
Duration target: around 30 seconds.`;

        const response = await client.models.generateContent({
            model: "lyria-3-clip-preview",
            contents: [{ role: "user", parts: [{ text: promptText }] }],
            config: {
                responseModalities: ["AUDIO", "TEXT"],
            },
        });

        let audioBase64 = "";
        let mimeType = "audio/mpeg";

        if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
                if (part.inlineData?.data) {
                    audioBase64 = part.inlineData.data;
                    mimeType = part.inlineData.mimeType || mimeType;
                    break;
                }
            }
        }

        if (!audioBase64) {
            return Response.json({ error: "No audio generated" }, { status: 500 });
        }

        return Response.json({ audioBase64, duration: 30, mimeType });
    } catch (error) {
        console.error("Jingle generation error:", error);
        const message = error instanceof Error ? error.message : "Failed to generate jingle";
        return Response.json({ error: message }, { status: 500 });
    }
}
