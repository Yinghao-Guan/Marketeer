import { GoogleGenAI } from "@google/genai";
import { JINGLE_PROMPT } from "@/lib/prompts";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });

const MOOD_BPM: Record<string, number> = {
    upbeat: 128,
    chill: 80,
    dramatic: 100,
    bold: 120,
};

// Build a WAV file buffer from raw PCM data.
// Lyria outputs 16-bit stereo PCM at 48000 Hz.
function buildWav(pcm: Buffer, sampleRate = 48000, channels = 2, bitDepth = 16): Buffer {
    const dataSize = pcm.length;
    const header = Buffer.alloc(44);
    header.write("RIFF", 0);
    header.writeUInt32LE(36 + dataSize, 4);
    header.write("WAVE", 8);
    header.write("fmt ", 12);
    header.writeUInt32LE(16, 16);                                        // fmt chunk size
    header.writeUInt16LE(1, 20);                                         // PCM format
    header.writeUInt16LE(channels, 22);
    header.writeUInt32LE(sampleRate, 24);
    header.writeUInt32LE(sampleRate * channels * (bitDepth / 8), 28);   // byte rate
    header.writeUInt16LE(channels * (bitDepth / 8), 32);                // block align
    header.writeUInt16LE(bitDepth, 34);
    header.write("data", 36);
    header.writeUInt32LE(dataSize, 40);
    return Buffer.concat([header, pcm]);
}

export async function POST(req: Request) {
    try {
        const { mood, jingleMood, brandName, industry, tagline } = await req.json();

        const bpm = MOOD_BPM[mood] ?? 100;
        const promptText = JINGLE_PROMPT(brandName, tagline, jingleMood, industry);

        const audioChunks: Buffer[] = [];

        await new Promise<void>((resolve, reject) => {
            // Hard timeout: stop collecting and resolve before Vercel's 60s limit
            const hardTimeout = setTimeout(() => resolve(), 55000);

            ai.live.music.connect({
                model: "models/lyria-realtime-exp",
                callbacks: {
                    onmessage: (message) => {
                        if (message.audioChunks) {
                            for (const chunk of message.audioChunks) {
                                audioChunks.push(Buffer.from(chunk.data, "base64"));
                            }
                        }
                    },
                    onclose: () => {
                        clearTimeout(hardTimeout);
                        resolve();
                    },
                    onerror: (error) => {
                        clearTimeout(hardTimeout);
                        reject(error);
                    },
                },
            }).then(async (session) => {
                await session.setWeightedPrompts({
                    weightedPrompts: [{ text: promptText, weight: 1.0 }],
                });
                await session.setMusicGenerationConfig({
                    musicGenerationConfig: { bpm, temperature: 1.1 },
                });
                await session.play();

                // Collect 30 seconds of audio then close
                setTimeout(async () => {
                    await session.stop();
                }, 30000);
            }).catch(reject);
        });

        const wavBuffer = buildWav(Buffer.concat(audioChunks));
        const audioBase64 = wavBuffer.toString("base64");

        return Response.json({ audioBase64, duration: 30 });
    } catch (error) {
        console.error("Jingle generation error:", error);
        return Response.json({ error: "Failed to generate jingle" }, { status: 500 });
    }
}
