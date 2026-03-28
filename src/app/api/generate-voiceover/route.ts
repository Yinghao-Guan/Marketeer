import { GoogleGenAI } from "@google/genai";
import { VOICEOVER_PROMPT } from "@/lib/prompts";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const VOICE_MAP: Record<string, string> = {
    warm: "Kore",
    bold: "Charon",
    energetic: "Puck",
    calm: "Zephyr",
};

// TTS outputs 16-bit mono PCM at 24000 Hz
function buildWav(pcm: Buffer, sampleRate = 24000, channels = 1, bitDepth = 16): Buffer {
    const dataSize = pcm.length;
    const header = Buffer.alloc(44);
    header.write("RIFF", 0);
    header.writeUInt32LE(36 + dataSize, 4);
    header.write("WAVE", 8);
    header.write("fmt ", 12);
    header.writeUInt32LE(16, 16);
    header.writeUInt16LE(1, 20);
    header.writeUInt16LE(channels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(sampleRate * channels * (bitDepth / 8), 28);
    header.writeUInt16LE(channels * (bitDepth / 8), 32);
    header.writeUInt16LE(bitDepth, 34);
    header.write("data", 36);
    header.writeUInt32LE(dataSize, 40);
    return Buffer.concat([header, pcm]);
}

export async function POST(req: Request) {
    try {
        const { script, voiceTone, location, description } = await req.json();

        const voice = VOICE_MAP[voiceTone] ?? "Kore";
        const promptText = VOICEOVER_PROMPT(script, voiceTone, location || "", description || "");

        const result = await ai.models.generateContent({
            model: "gemini-2.5-flash-preview-tts",
            contents: [{ role: "user", parts: [{ text: promptText }] }],
            config: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: voice },
                    },
                },
            },
        });

        const audioPart = result.candidates?.[0]?.content?.parts?.find(
            (p) => p.inlineData?.mimeType?.startsWith("audio/")
        );

        if (!audioPart?.inlineData?.data) {
            throw new Error("No audio returned from TTS");
        }

        const pcmBuffer = Buffer.from(audioPart.inlineData.data, "base64");
        const wavBuffer = buildWav(pcmBuffer);
        const audioBase64 = wavBuffer.toString("base64");

        return Response.json({ audioBase64, voice });
    } catch (error) {
        console.error("Voiceover generation error:", error);
        return Response.json({ error: "Failed to generate voiceover" }, { status: 500 });
    }
}
